package com.odyssey.security;

import com.odyssey.config.JwtConfig;
import com.odyssey.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    public static final String ACCESS_COOKIE = "odyssey-token";
    public static final String REFRESH_COOKIE = "odyssey-refresh";

    private final JwtConfig jwtConfig;
    private final SecretKey secretKey;

    public JwtTokenProvider(JwtConfig jwtConfig) {
        this.jwtConfig = jwtConfig;
        this.secretKey = Keys.hmacShaKeyFor(jwtConfig.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String createAccessToken(User user) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtConfig.getAccessExpiration());

        return Jwts.builder()
                .setSubject(user.getEmail())
                .setIssuer(jwtConfig.getIssuer())
                .setAudience(jwtConfig.getAudience())
                .setId(UUID.randomUUID().toString())
                .claim("uid", user.getId())
                .claim("tv", user.getTokenVersion())
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    /**
     * Parses and validates the access token, returning null for anything that is
     * expired, malformed, or signed with a different key.
     */
    public Claims parseAccessToken(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .requireIssuer(jwtConfig.getIssuer())
                    .requireAudience(jwtConfig.getAudience())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (JwtException | IllegalArgumentException e) {
            return null;
        }
    }

    public String resolveAccessToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return readCookie(request, ACCESS_COOKIE);
    }

    public String resolveRefreshToken(HttpServletRequest request) {
        return readCookie(request, REFRESH_COOKIE);
    }

    public String readCookie(HttpServletRequest request, String name) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (name.equals(cookie.getName()) && StringUtils.hasText(cookie.getValue())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    public long getAccessExpirationMs() {
        return jwtConfig.getAccessExpiration();
    }

    public long refreshExpirationMs(boolean rememberMe) {
        return rememberMe ? jwtConfig.getRememberMeRefreshExpiration() : jwtConfig.getRefreshExpiration();
    }

    public JwtConfig getJwtConfig() {
        return jwtConfig;
    }
}
