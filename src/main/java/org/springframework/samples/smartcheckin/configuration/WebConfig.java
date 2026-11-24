package org.springframework.samples.smartcheckin.configuration;

import java.io.IOException;
import java.util.concurrent.TimeUnit;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.format.FormatterRegistry;
import org.springframework.http.CacheControl;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.web.filter.ShallowEtagHeaderFilter;

@Configuration
@SuppressWarnings("null")
public class WebConfig implements WebMvcConfigurer {
	
	private final GenericIdToEntityConverter idToEntityConverter;
	
	public WebConfig(GenericIdToEntityConverter idToEntityConverter) {
		this.idToEntityConverter = idToEntityConverter;
	}

    @Bean
    public FilterRegistrationBean<ShallowEtagHeaderFilter> shallowEtagHeaderFilter() {
        ShallowEtagHeaderFilter filter = new ShallowEtagHeaderFilter() {
            @Override
            protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
                String uri = request.getRequestURI();
                return uri.endsWith("/documents/download") || uri.endsWith("/calendar.ics");
            }
        };
        FilterRegistrationBean<ShallowEtagHeaderFilter> registration =
                new FilterRegistrationBean<>(filter);
        // Acotar ETag a respuestas JSON ligeras; excluir /api/v1/exports/*, /api/v1/certificates/* y descargas binarias para evitar buffering OOM
        registration.addUrlPatterns(
                "/api/v1/companies",
                "/api/v1/companies/*",
                "/api/v1/formations",
                "/api/v1/formations/*",
                "/api/v1/users",
                "/api/v1/users/*",
                "/api/v1/analytics",
                "/api/v1/analytics/*");
        return registration;
    }
	
    @Override
    public void addFormatters(@NonNull FormatterRegistry registry) {
        registry.addConverter(idToEntityConverter);
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        // Recursos estáticos empaquetados con hash único (JS/CSS)
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/static/")
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic());

        // Traducciones i18n: permite revalidación condicional (304 Not Modified) sin mostrar contenido obsoleto
        registry.addResourceHandler("/locales/**")
                .addResourceLocations("classpath:/static/locales/")
                .setCacheControl(CacheControl.noCache());

        // Manejador para SPA (React Router) y recursos raíz (/sw.js, /manifest.json, /index.html)
        // Utiliza PathResourceResolver en lugar de reenvíos forward servlet para evitar cualquier StackOverflowError
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .setCacheControl(CacheControl.noStore().mustRevalidate())
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(@NonNull String resourcePath, @NonNull Resource location) throws IOException {
                        Resource requestedResource = location.createRelative(resourcePath);
                        if (requestedResource.exists() && requestedResource.isReadable()) {
                            return requestedResource;
                        }
                        return new ClassPathResource("/static/index.html");
                    }
                });
    }
}