package com.odyssey.exception;

/** Raised when AI features are used but no provider key is configured. */
public class AiNotConfiguredException extends RuntimeException {
    public AiNotConfiguredException(String message) {
        super(message);
    }
}
