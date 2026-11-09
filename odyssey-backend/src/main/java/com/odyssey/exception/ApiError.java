package com.odyssey.exception;

import java.util.Map;

/**
 * Standard error envelope returned by every API error response.
 * Field-level validation errors are exposed through {@code errors}.
 */
public class ApiError {
    private final String message;
    private final Map<String, String> errors;

    public ApiError(String message) {
        this(message, null);
    }

    public ApiError(String message, Map<String, String> errors) {
        this.message = message;
        this.errors = errors;
    }

    public String getMessage() {
        return message;
    }

    public Map<String, String> getErrors() {
        return errors;
    }
}
