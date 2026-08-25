package com.sit.portal.controller;

import com.sit.portal.config.JwtUtils;
import com.sit.portal.entity.Faculty;
import com.sit.portal.entity.Student;
import com.sit.portal.entity.User;
import com.sit.portal.repository.FacultyRepository;
import com.sit.portal.repository.ParentRepository;
import com.sit.portal.repository.StudentRepository;
import com.sit.portal.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock private UserRepository userRepository;
    @Mock private FacultyRepository facultyRepository;
    @Mock private StudentRepository studentRepository;
    @Mock private ParentRepository parentRepository;
    @Mock private JwtUtils jwtUtils;
    @Mock private PasswordEncoder passwordEncoder;
    @InjectMocks private AuthController controller;

    @Test
    void rejectsLoginWhenCredentialsAreIncomplete() {
        ResponseEntity<?> response = controller.login(Map.of("email", "student@sitcoe.ac.in"));

        assertEquals(400, response.getStatusCode().value());
        assertEquals("Email and password are required.", ((Map<?, ?>) response.getBody()).get("message"));
        verifyNoInteractions(userRepository, jwtUtils, passwordEncoder);
    }

    @Test
    void rejectsLoginWhenUserDoesNotExist() {
        when(userRepository.findByEmail("student@sitcoe.ac.in")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.login(Map.of(
                "email", " Student@SITCOE.AC.IN ", "password", "password", "role", "student"));

        assertEquals(401, response.getStatusCode().value());
        assertEquals("Invalid credentials or account does not exist.", ((Map<?, ?>) response.getBody()).get("message"));
    }

    @Test
    void rejectsIncorrectPasswordForAnExistingUser() {
        User user = User.builder().email("student@sitcoe.ac.in").password("encoded-password").role("student").build();
        when(userRepository.findByEmail("student@sitcoe.ac.in")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "encoded-password")).thenReturn(false);

        ResponseEntity<?> response = controller.login(Map.of("email", "student@sitcoe.ac.in", "password", "wrong"));

        assertEquals(401, response.getStatusCode().value());
        assertEquals("Invalid credentials.", ((Map<?, ?>) response.getBody()).get("message"));
        verify(jwtUtils, never()).generateToken(anyString(), anyString());
    }

    @Test
    void authorizedGoogleUserLogsInSuccessfully() {
        User user = User.builder().email("faculty@sitcoe.ac.in").role("faculty").build();
        when(userRepository.findByEmail("faculty@sitcoe.ac.in")).thenReturn(Optional.of(user));
        when(jwtUtils.generateToken("faculty@sitcoe.ac.in", "faculty")).thenReturn("mock-jwt-token");

        ResponseEntity<?> response = controller.googleLogin(Map.of("email", "faculty@sitcoe.ac.in"));

        assertEquals(200, response.getStatusCode().value());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertEquals("mock-jwt-token", body.get("token"));
        assertEquals("faculty", body.get("role"));
    }

    @Test
    void unauthorizedGoogleUserIsStrictlyDeniedWith403() {
        when(userRepository.findByEmail("unknown.person@gmail.com")).thenReturn(Optional.empty());
        when(facultyRepository.findByEmail("unknown.person@gmail.com")).thenReturn(Optional.empty());
        when(studentRepository.findByEmail("unknown.person@gmail.com")).thenReturn(Optional.empty());
        when(studentRepository.findByParentEmail("unknown.person@gmail.com")).thenReturn(Optional.empty());

        ResponseEntity<?> response = controller.googleLogin(Map.of("email", "unknown.person@gmail.com"));

        assertEquals(403, response.getStatusCode().value());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertTrue(((String) body.get("message")).contains("Access Denied"));
        verify(jwtUtils, never()).generateToken(anyString(), anyString());
    }

    @Test
    void rejectsRegistrationForNonRosterEmail() {
        when(userRepository.existsByEmail("unknown@gmail.com")).thenReturn(false);
        when(facultyRepository.findByEmail("unknown@gmail.com")).thenReturn(Optional.empty());
        when(studentRepository.existsByEmail("unknown@gmail.com")).thenReturn(false);

        User request = User.builder().email("unknown@gmail.com").password("pass123").role("student").build();
        ResponseEntity<?> response = controller.register(request);

        assertEquals(400, response.getStatusCode().value());
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertNotNull(body);
        assertTrue(((String) body.get("message")).contains("Registration denied"));
        verify(userRepository, never()).save(any());
    }
}
