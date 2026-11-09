package com.odyssey.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.jwt")
public class JwtConfig {
    private String secret;
    private long accessExpiration = 15 * 60 * 1000L;
    private long refreshExpiration = 7L * 24 * 60 * 60 * 1000;
    private long rememberMeRefreshExpiration = 30L * 24 * 60 * 60 * 1000;
    private String issuer = "odyssey";
    private String audience = "odyssey-web";
    private boolean secureCookies = false;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public long getAccessExpiration() {
        return accessExpiration;
    }

    public void setAccessExpiration(long accessExpiration) {
        this.accessExpiration = accessExpiration;
    }

    public long getRefreshExpiration() {
        return refreshExpiration;
    }

    public void setRefreshExpiration(long refreshExpiration) {
        this.refreshExpiration = refreshExpiration;
    }

    public long getRememberMeRefreshExpiration() {
        return rememberMeRefreshExpiration;
    }

    public void setRememberMeRefreshExpiration(long rememberMeRefreshExpiration) {
        this.rememberMeRefreshExpiration = rememberMeRefreshExpiration;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }

    public String getAudience() {
        return audience;
    }

    public void setAudience(String audience) {
        this.audience = audience;
    }

    public boolean isSecureCookies() {
        return secureCookies;
    }

    public void setSecureCookies(boolean secureCookies) {
        this.secureCookies = secureCookies;
    }
}
