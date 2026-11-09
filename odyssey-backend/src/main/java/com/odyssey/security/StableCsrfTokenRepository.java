package com.odyssey.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;

/**
 * Cookie-backed CSRF tokens that are issued once per client instead of being
 * rotated on every authenticated request. The API is stateless and identifies
 * the user from a JWT, so Spring's default rotation after authentication would
 * invalidate the token the browser last received.
 */
public class StableCsrfTokenRepository implements CsrfTokenRepository {

    private final CookieCsrfTokenRepository delegate = CookieCsrfTokenRepository.withHttpOnlyFalse();

    public StableCsrfTokenRepository() {
        delegate.setCookieName("XSRF-TOKEN");
        delegate.setHeaderName("X-XSRF-TOKEN");
        delegate.setCookiePath("/");
    }

    @Override
    public CsrfToken generateToken(HttpServletRequest request) {
        return delegate.generateToken(request);
    }

    @Override
    public void saveToken(CsrfToken token, HttpServletRequest request, HttpServletResponse response) {
        // Ignore rotations and clears: only issue a cookie when the client has none.
        if (token == null || delegate.loadToken(request) != null) {
            return;
        }
        delegate.saveToken(token, request, response);
    }

    @Override
    public CsrfToken loadToken(HttpServletRequest request) {
        return delegate.loadToken(request);
    }
}
