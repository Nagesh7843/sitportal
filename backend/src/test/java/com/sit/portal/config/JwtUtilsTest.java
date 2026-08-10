package com.sit.portal.config;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilsTest {

    private final JwtUtils jwtUtils = new JwtUtils("SitPortalSecretKeyForJwtAuthenticationToken2026SecureKey!");

    @Test
    void generatesAValidTokenContainingTheEmailAndRole() {
        String token = jwtUtils.generateToken("student@sit.ac.in", "student");

        assertTrue(jwtUtils.validateToken(token));
        assertEquals("student@sit.ac.in", jwtUtils.getEmailFromToken(token));
        assertEquals("student", jwtUtils.getRoleFromToken(token));
    }

    @Test
    void rejectsMalformedTokens() {
        assertFalse(jwtUtils.validateToken("not-a-jwt"));
        assertFalse(jwtUtils.validateToken(""));
    }
}
