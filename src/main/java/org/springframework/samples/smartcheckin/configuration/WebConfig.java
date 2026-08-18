package org.springframework.samples.smartcheckin.configuration;

import java.util.concurrent.TimeUnit;
import org.springframework.context.annotation.Configuration;
import org.springframework.format.FormatterRegistry;
import org.springframework.http.CacheControl;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

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
        // Garantizar que Service Worker, Manifest e index.html NO se queden cacheados
        registry.addResourceHandler("/sw.js", "/index.html", "/manifest.json")
                .addResourceLocations("classpath:/static/")
                .setCacheControl(CacheControl.noStore().mustRevalidate());

        // Recursos estáticos empaquetados con hash único (JS/CSS)
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/static/")
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic());
    }
}