package org.springframework.samples.smartcheckin.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.samples.smartcheckin.configuration.jwt.AuthEntryPointJwt;
import org.springframework.samples.smartcheckin.configuration.jwt.AuthTokenFilter;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtBlacklistService;
import org.springframework.samples.smartcheckin.configuration.jwt.JwtUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;
import org.springframework.samples.smartcheckin.configuration.services.UserDetailsServiceImpl;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.beans.factory.annotation.Value;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfiguration {

    private static final String ADMIN = "ADMIN";
    private static final String FORMATIONS_BASE = "/api/v1/formations";
    private static final String FORMATIONS_WILDCARD = "/api/v1/formations/**";

    @Bean
    @SuppressWarnings({ "null", "java:S4502" })
    protected SecurityFilterChain configure(HttpSecurity http, AuthEntryPointJwt unauthorizedHandler,
            AuthTokenFilter authTokenFilter) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .headers(headers -> headers
                    .frameOptions(HeadersConfigurer.FrameOptionsConfig::disable)
                    .xssProtection(HeadersConfigurer.XXssConfig::disable)
                    .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self' https: data: blob:; script-src 'self' https:; style-src 'self' https: 'unsafe-inline'; object-src 'none'"))
                )
                .exceptionHandling(exceptionHandling -> exceptionHandling.authenticationEntryPoint(unauthorizedHandler))

                .authorizeHttpRequests(auth -> auth
                        // 1. Peticiones CORS Preflight (OPTIONS)
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // 2. Recursos estáticos, consolas, Service Worker y rutas del frontend/errores
                        .requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()
                        .requestMatchers("/", "/oups", "/index.html", "/manifest.json", "/favicon.ico", "/*.png", "/static/**", "/locales/**", "/error", "/login", "/sw.js").permitAll()

                        // 3. Swagger / OpenAPI (solo ADMIN)
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/swagger-resources/**")
                        .hasAuthority(ADMIN)

                        // 4. Endpoints públicos
                        .requestMatchers("/api/v1/auth/**").permitAll()

                        // 5. Perfil personal del usuario y configuración de 2FA
                        .requestMatchers(
                                "/api/v1/users/me",
                                "/api/v1/users/me/**",
                                "/api/v1/users/2fa/setup",
                                "/api/v1/users/2fa/enable",
                                "/api/v1/users/2fa/disable",
                                "/api/v1/exports/me/export"
                        ).authenticated()

                        // 6. Administración y HR
                        .requestMatchers("/api/v1/users/pending", "/api/v1/users/*/approve").hasAuthority(ADMIN)
                        .requestMatchers("/api/v1/users", "/api/v1/users/**").hasAuthority(ADMIN)
                        .requestMatchers("/api/v1/analytics/**").hasAuthority(ADMIN)
                        .requestMatchers("/api/v1/exports/**").hasAuthority(ADMIN)
                        .requestMatchers("/api/v1/audit/**").hasAuthority(ADMIN)
                        .requestMatchers("/api/v1/cloud-settings/**").hasAuthority(ADMIN)
                        .requestMatchers(PathRequest.toH2Console()).hasAuthority(ADMIN)
                        .requestMatchers("/h2-console/**").hasAuthority(ADMIN)

                        // 7. Formaciones (POST, PUT, DELETE restringidos a ADMIN)
                        .requestMatchers(HttpMethod.POST, FORMATIONS_BASE).hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.PUT, FORMATIONS_BASE, FORMATIONS_WILDCARD).hasAuthority(ADMIN)
                        .requestMatchers(HttpMethod.DELETE, FORMATIONS_BASE, FORMATIONS_WILDCARD).hasAuthority(ADMIN)
                        
                        // 8. Formaciones GET y checkout permitidos para autenticados
                        .requestMatchers(FORMATIONS_BASE, FORMATIONS_WILDCARD).authenticated()

                        // 9. Otros endpoints autenticados
                        .requestMatchers("/api/v1/totp/**").authenticated()
                        .requestMatchers("/api/v1/checkins/**").authenticated()
                        .requestMatchers("/api/v1/certificates/**").authenticated()
                        .requestMatchers("/api/v1/push/**").authenticated()
                        .requestMatchers("/api/v1/signatures/**").authenticated()

                        // 10. Denegar lo demás por defecto
                        .anyRequest().denyAll())

                .addFilterBefore(new RateLimitFilter(), UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(authTokenFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter(
            JwtUtils jwtUtils,
            UserDetailsServiceImpl userDetailsService,
            JwtBlacklistService jwtBlacklistService) {
        return new AuthTokenFilter(jwtUtils, userDetailsService, jwtBlacklistService);
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Value("${app.cors.allowed-origins}")
    private String[] allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public RoleHierarchy roleHierarchy() {
        return RoleHierarchyImpl.fromHierarchy("ADMIN > HR_MANAGER \n HR_MANAGER > EMPLOYEE");
    }
}