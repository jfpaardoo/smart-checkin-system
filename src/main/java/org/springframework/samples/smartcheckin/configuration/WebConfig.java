package org.springframework.samples.smartcheckin.configuration;

import org.springframework.format.FormatterRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.lang.NonNull;

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
    
}