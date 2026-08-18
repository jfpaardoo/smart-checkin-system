package org.springframework.samples.smartcheckin.configuration;

import java.io.IOException;
import java.util.concurrent.TimeUnit;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.format.FormatterRegistry;
import org.springframework.http.CacheControl;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

@Configuration
@SuppressWarnings("null")
public class WebConfig implements WebMvcConfigurer {
	
	private final GenericIdToEntityConverter idToEntityConverter;
	
	public WebConfig(GenericIdToEntityConverter idToEntityConverter) {
		this.idToEntityConverter = idToEntityConverter;
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