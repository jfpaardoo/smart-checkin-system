package org.springframework.samples.petclinic.configuration;

import static org.springframework.security.config.Customizer.withDefaults;
/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.samples.petclinic.configuration.jwt.AuthEntryPointJwt;
import org.springframework.samples.petclinic.configuration.jwt.AuthTokenFilter;
import org.springframework.samples.petclinic.configuration.services.UserDetailsServiceImpl;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.boot.autoconfigure.security.servlet.PathRequest;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration {

	private static final String ADMIN = "ADMIN";

	@Bean
	@SuppressWarnings({ "null", "java:S4502" })
	protected SecurityFilterChain configure(HttpSecurity http, AuthEntryPointJwt unauthorizedHandler,
			AuthTokenFilter authTokenFilter) throws Exception {

		http
				.cors(withDefaults())
				.csrf(AbstractHttpConfigurer::disable)
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.headers(headers -> headers.frameOptions(
						org.springframework.security.config.annotation.web.configurers.HeadersConfigurer.FrameOptionsConfig::disable))
				.exceptionHandling(exepciontHandling -> exepciontHandling.authenticationEntryPoint(unauthorizedHandler))

				.authorizeHttpRequests(auth -> auth
						// Recursos estáticos comunes (css, js, images, webjars…) públicos
						.requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()
						// H2 Console accesible
						.requestMatchers(PathRequest.toH2Console()).permitAll()
						.requestMatchers("/h2-console/**").permitAll()

						// Raíz / páginas públicas
						.requestMatchers("/", "/oups").permitAll()

						// Swagger / OpenAPI accesible
						.requestMatchers(
								"/v3/api-docs/**",
								"/swagger-ui.html",
								"/swagger-ui/**",
								"/swagger-resources/**")
						.permitAll()

						// API pública
						.requestMatchers("/api/v1/auth/**").permitAll()

						// Rutas de administración y HR
						.requestMatchers("/api/v1/users/**").hasAuthority(ADMIN)

						// Otras reglas de acceso para el Check-in System:
						.requestMatchers("/api/v1/checkins/**").authenticated()

						// El resto denegado
						.anyRequest().denyAll())

				.addFilterBefore(authTokenFilter, UsernamePasswordAuthenticationFilter.class);
		return http.build();
	}

	@Bean
	public AuthTokenFilter authenticationJwtTokenFilter(
			org.springframework.samples.petclinic.configuration.jwt.JwtUtils jwtUtils,
			UserDetailsServiceImpl userDetailsService) {
		return new AuthTokenFilter(jwtUtils, userDetailsService);
	}

	@Bean
	public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
		return config.getAuthenticationManager();
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

}
