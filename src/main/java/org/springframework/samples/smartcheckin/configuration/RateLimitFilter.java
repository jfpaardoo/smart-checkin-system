package org.springframework.samples.smartcheckin.configuration;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.TimeUnit;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

public class RateLimitFilter extends OncePerRequestFilter {

    private final Cache<String, Bucket> cacheStrict = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterAccess(10, TimeUnit.MINUTES)
            .build();

    private final Cache<String, Bucket> cacheQrFichaje = Caffeine.newBuilder()
            .maximumSize(20_000)
            .expireAfterAccess(10, TimeUnit.MINUTES)
            .build();

    private final Cache<String, Bucket> cacheGlobal = Caffeine.newBuilder()
            .maximumSize(20_000)
            .expireAfterAccess(10, TimeUnit.MINUTES)
            .build();

    private Bucket resolveBucketStrict(String key) {
        return cacheStrict.get(key, k -> Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(10).refillGreedy(10, Duration.ofMinutes(1)).build())
                .build());
    }

    private Bucket resolveBucketQrFichaje(String key) {
        // 30 peticiones por minuto por usuario/IP para permitir escaneos y reintentos legítimos en formaciones
        return cacheQrFichaje.get(key, k -> Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(30).refillGreedy(30, Duration.ofMinutes(1)).build())
                .build());
    }

    private Bucket resolveBucketGlobal(String key) {
        // 200 requests per minute per IP for global endpoints
        return cacheGlobal.get(key, k -> Bucket.builder()
                .addLimit(Bandwidth.builder().capacity(200).refillGreedy(200, Duration.ofMinutes(1)).build())
                .build());
    }

    private String getClientIP(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        return (remoteAddr != null && !remoteAddr.isBlank()) ? remoteAddr : "127.0.0.1";
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();
        String ip = getClientIP(request);
        Bucket bucket;

        if (uri.startsWith("/api/v1/checkins/qr-fichaje")) {
            // Evitar bloqueo por NAT/CGNAT en aulas: rate limit por usuario autenticado
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String key = (auth != null && auth.isAuthenticated() && !(auth instanceof AnonymousAuthenticationToken) && auth.getName() != null)
                    ? "user:" + auth.getName()
                    : "ip:" + ip;
            bucket = resolveBucketQrFichaje(key);
        } else if (uri.startsWith("/api/v1/auth/signin")
                || uri.startsWith("/api/v1/auth/signup")
                || uri.startsWith("/api/v1/auth/verify-2fa")
                || uri.startsWith("/api/v1/auth/forgot-password")
                || uri.startsWith("/api/v1/auth/reset-password")
                || uri.startsWith("/api/v1/auth/webauthn/login")) {
            bucket = resolveBucketStrict("ip:" + ip);
        } else {
            bucket = resolveBucketGlobal("ip:" + ip);
        }

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Too many requests. Please try again later.");
        }
    }
}
