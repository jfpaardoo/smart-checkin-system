package org.springframework.samples.smartcheckin.configuration;

import java.io.IOException;
import java.time.Duration;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import java.util.concurrent.TimeUnit;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.lang.NonNull;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import org.jpatterns.gof.ChainOfResponsibilityPattern;

@Component
@ChainOfResponsibilityPattern.ConcreteHandler
public class RateLimitFilter extends OncePerRequestFilter {

    private final Cache<String, Bucket> cacheStrict = Caffeine.newBuilder()
            .maximumSize(10_000)
            .expireAfterAccess(10, TimeUnit.MINUTES)
            .build();

    private final Cache<String, Bucket> cacheGlobal = Caffeine.newBuilder()
            .maximumSize(20_000)
            .expireAfterAccess(10, TimeUnit.MINUTES)
            .build();

    private Bucket resolveBucketStrict(String ip) {
        return cacheStrict.get(ip, this::newBucketStrict);
    }

    private Bucket resolveBucketGlobal(String ip) {
        return cacheGlobal.get(ip, this::newBucketGlobal);
    }

    private Bucket newBucketStrict(String ip) {
        // 10 requests per minute per IP for sensitive endpoints
        Bandwidth limit = Bandwidth.builder().capacity(10).refillGreedy(10, Duration.ofMinutes(1)).build();
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket newBucketGlobal(String ip) {
        // 200 requests per minute per IP for global endpoints
        Bandwidth limit = Bandwidth.builder().capacity(200).refillGreedy(200, Duration.ofMinutes(1)).build();
        return Bucket.builder().addLimit(limit).build();
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        // X-Forwarded-For puede contener múltiples IPs si hay varios proxies. La primera es la del cliente original.
        return xfHeader.split(",")[0].trim();
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String uri = request.getRequestURI();
        String ip = getClientIP(request);
        Bucket bucket;

        if (uri.startsWith("/api/v1/auth/signin") 
                || uri.startsWith("/api/v1/checkins/qr-fichaje")
                || uri.startsWith("/api/v1/auth/verify-2fa")
                || uri.startsWith("/api/v1/auth/forgot-password")
                || uri.startsWith("/api/v1/auth/reset-password")
                || uri.startsWith("/api/v1/auth/webauthn/login")) {
            bucket = resolveBucketStrict(ip);
        } else {
            bucket = resolveBucketGlobal(ip);
        }

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.getWriter().write("Too many requests. Please try again later.");
        }
    }
}