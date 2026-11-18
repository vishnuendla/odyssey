package com.odyssey.exception;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

/**
 * Standard error envelope returned by every API error response.
 * Field-level validation errors are exposed through {@code errors}, and
 * {@code code} carries a stable machine-readable reason when the client needs
 * to react differently from a plain message (for example a CSRF rejection).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiError {
    private final String message;
    private final Map<String, String> errors;
    private final String code;

    public ApiError(String message) {
        this(message, null, null);
    }

    public ApiError(String message, Map<String, String> errors) {
        this(message, errors, null);
    }

    public ApiError(String message, Map<String, String> errors, String code) {
        this.message = message;
        this.errors = errors;
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public Map<String, String> getErrors() {
        return errors;
    }

    public String getCode() {
        return code;
    }
}
