package org.springframework.samples.smartcheckin.configuration.jwt;

import java.util.HashMap;
import java.util.Map;
import java.time.Instant;
import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseCookie;
import org.springframework.web.util.WebUtils;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsImpl;
import org.springframework.samples.smartcheckin.user.Authorities;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;

import org.jpatterns.gof.SingletonPattern;

@Component
@SingletonPattern.Singleton
@SuppressWarnings({ "java:S6466", "null" })
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${badistributionacademy.app.jwtExpirationMs:${smartcheckin.app.jwtExpirationMs:86400000}}")
    private int jwtExpirationMs;

    @Value("${badistributionacademy.app.jwtSecret:${JWT_SECRET}}")
    private String jwtSecret;

    private SecretKey getSigningKey() {
        if (jwtSecret == null || jwtSecret.length() < 32) {
            throw new IllegalStateException("CRÍTICO: JWT_SECRET debe tener al menos 32 caracteres (256 bits) para HS256.");
        }
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateJwtToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
        Map<String, Object> claims = new HashMap<>();
        claims.put("authorities",
                userPrincipal.getAuthorities().stream().map(auth -> auth.getAuthority()).toList());

        Instant now = Instant.now();
        return Jwts.builder()
                .claims(claims)
                .subject(userPrincipal.getUsername())
                .issuedAt(java.util.Date.from(now))
                .expiration(java.util.Date.from(now.plusMillis(jwtExpirationMs)))
                .signWith(getSigningKey())
                .compact();
    }

    public ResponseCookie generateJwtCookie(Authentication authentication) {
        String jwt = generateJwtToken(authentication);
        return ResponseCookie.from("jwt", jwt)
                .path("/")
                .maxAge(jwtExpirationMs / 1000)
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .build();
    }

    public ResponseCookie getCleanJwtCookie() {
        return ResponseCookie.from("jwt", "")
                .path("/")
                .maxAge(0)
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .build();
    }

    public String getJwtFromCookies(HttpServletRequest request) {
        Cookie cookie = WebUtils.getCookie(request, "jwt");
        if (cookie != null) {
            return cookie.getValue();
        } else {
            return null;
        }
    }

    public String generateTokenFromUsername(String username, Authorities authority) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("authorities", authority.getAuthority());
        Instant now = Instant.now();
        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(java.util.Date.from(now))
                .expiration(java.util.Date.from(now.plusMillis(jwtExpirationMs)))
                .signWith(getSigningKey())
                .compact();
    }

    public String getUserNameFromJwtToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public Instant getExpirationDateFromJwtToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration()
                .toInstant();
    }

    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(authToken);
            return true;
        } catch (SignatureException e) {
            logger.error("Invalid JWT signature: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            logger.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("JWT token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("JWT token is unsupported: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string is empty: {}", e.getMessage());
        } catch (Exception e) {
            logger.error("Unexpected error validating JWT token: {}", e.getMessage());
        }

        return false;
    }
}