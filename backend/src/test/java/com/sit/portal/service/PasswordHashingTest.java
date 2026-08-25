package com.sit.portal.service;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

public class PasswordHashingTest {

    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Test
    void testPasswordIsHashedWithBCrypt() {
        String rawPassword = "AdminSecureTestPassword2026!";
        String encoded = passwordEncoder.encode(rawPassword);

        // Assert encoded password starts with BCrypt prefix $2a$ or $2b$
        assertTrue(encoded.startsWith("$2a$") || encoded.startsWith("$2b$"));
        assertEquals(60, encoded.length());

        // Assert plain text comparison fails
        assertNotEquals(rawPassword, encoded);

        // Assert BCrypt matching succeeds
        assertTrue(passwordEncoder.matches(rawPassword, encoded));

        // Assert incorrect password fails
        assertFalse(passwordEncoder.matches("WrongPassword", encoded));
    }

    @Test
    void testDifferentSaltPerHash() {
        String rawPassword = "SuperAdminPassword2026!";
        String hash1 = passwordEncoder.encode(rawPassword);
        String hash2 = passwordEncoder.encode(rawPassword);

        // BCrypt uses distinct salts
        assertNotEquals(hash1, hash2);

        // Both verify correctly against the same raw password
        assertTrue(passwordEncoder.matches(rawPassword, hash1));
        assertTrue(passwordEncoder.matches(rawPassword, hash2));
    }
}
