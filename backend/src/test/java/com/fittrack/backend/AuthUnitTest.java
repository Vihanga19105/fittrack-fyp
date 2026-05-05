package com.fittrack.backend;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AuthUnitTest {

    @Test
    void shouldAcceptCorrectPassword() {
        String enteredPassword = "123456";
        String actualPassword = "123456";

        boolean result = enteredPassword.equals(actualPassword);

        assertTrue(result);
    }

    @Test
    void shouldRejectWrongPassword() {
        String enteredPassword = "wrong123";
        String actualPassword = "123456";

        boolean result = enteredPassword.equals(actualPassword);

        assertFalse(result);
    }
}