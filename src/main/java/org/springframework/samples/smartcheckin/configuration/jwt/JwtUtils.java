package org.springframework.samples.smartcheckin.configuration.jwt;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.time.Instant;
import java.nio.charset.StandardCharsets;

import javax.crypto.SecretKey;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseCookie;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
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
@SuppressWarnings({ "java:S6466", "java:S2143", "null" })
public class JwtUtils {
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    private static final String CLAIM_PURPOSE = "purpose";
    private static final String PURPOSE_MFA_PENDING = "mfa_pending";

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

    @Value("${badistributionacademy.app.jwtCookieSecure:${smartcheckin.app.jwtCookieSecure:false}}")
    private boolean jwtCookieSecure;

    public String generateJwtToken(Authentication authentication) {
        UserDetailsImpl userPrincipal = (UserDetailsImpl) authentication.getPrincipal();
        Map<String, Object> claims = new HashMap<>();
        claims.put("authorities",
                userPrincipal.getAuthorities().stream().map(auth -> auth.getAuthority()).toList());

        Instant now = Instant.now();
        return Jwts.builder()
                .claims(claims)
                .subject(userPrincipal.getUsername())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(jwtExpirationMs)))
                .signWith(getSigningKey())
                .compact();
    }

    public boolean isRequestSecure(HttpServletRequest req) {
        if (jwtCookieSecure) return true;
        HttpServletRequest currentReq = req;
        if (currentReq == null) {
            RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
            if (attrs instanceof ServletRequestAttributes servletRequestAttributes) {
                currentReq = servletRequestAttributes.getRequest();
            }
        }
        if (currentReq == null) return false;
        return currentReq.isSecure() || "https".equalsIgnoreCase(currentReq.getHeader("X-Forwarded-Proto"));
    }

    public ResponseCookie generateJwtCookie(Authentication authentication, HttpServletRequest request) {
        String jwt = generateJwtToken(authentication);
        return ResponseCookie.from("jwt", jwt)
                .path("/")
                .maxAge(jwtExpirationMs / 1000)
                .httpOnly(true)
                .secure(isRequestSecure(request))
                .sameSite("Lax")
                .build();
    }

    public ResponseCookie generateJwtCookie(Authentication authentication) {
        return generateJwtCookie(authentication, null);
    }

    public ResponseCookie getCleanJwtCookie(HttpServletRequest request) {
        return ResponseCookie.from("jwt", "")
                .path("/")
                .maxAge(0)
                .httpOnly(true)
                .secure(isRequestSecure(request))
                .sameSite("Lax")
                .build();
    }

    public ResponseCookie getCleanJwtCookie() {
        return getCleanJwtCookie(null);
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
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(jwtExpirationMs)))
                .signWith(getSigningKey())
                .compact();
    }

    public String generateMfaChallengeToken(String username) {
        Map<String, Object> claims = new HashMap<>();
        claims.put(CLAIM_PURPOSE, PURPOSE_MFA_PENDING);
        Instant now = Instant.now();
        // Expiración estricta de 5 minutos para el desafío 2FA
        return Jwts.builder()
                .claims(claims)
                .subject(username)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(300_000L)))
                .signWith(getSigningKey())
                .compact();
    }

    public boolean validateMfaChallengeToken(String token) {
        try {
            var payload = Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
            return PURPOSE_MFA_PENDING.equals(payload.get(CLAIM_PURPOSE));
        } catch (Exception e) {
            logger.warn("Invalid or expired MFA challenge token: {}", e.getMessage());
            return false;
        }
    }

    public String getUserNameFromMfaToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
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
            var claims = Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(authToken).getPayload();
            if (PURPOSE_MFA_PENDING.equals(claims.get(CLAIM_PURPOSE))) {
                logger.warn("MFA challenge token cannot be used as standard authorization token");
                return false;
            }
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