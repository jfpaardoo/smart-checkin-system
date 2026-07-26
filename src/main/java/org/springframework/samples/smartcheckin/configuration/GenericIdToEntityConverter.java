package org.springframework.samples.smartcheckin.configuration;

import java.util.HashSet;
import java.util.Set;
import jakarta.persistence.EntityManager;
import org.springframework.lang.Nullable;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.convert.ConversionService;
import org.springframework.core.convert.TypeDescriptor;
import org.springframework.core.convert.converter.ConditionalGenericConverter;
import org.springframework.core.convert.support.DefaultConversionService;
import org.springframework.samples.smartcheckin.model.BaseEntity;
import org.springframework.stereotype.Component;

@Component
@SuppressWarnings({"null", "java:S2638", "java:S2637"})
public final class GenericIdToEntityConverter implements ConditionalGenericConverter {
    private static final Logger log = LoggerFactory.getLogger(GenericIdToEntityConverter.class);

    private final ConversionService conversionService=new DefaultConversionService();
    
    private final EntityManager entityManager;

    public GenericIdToEntityConverter(@Autowired(required = false) EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Override
    @Nullable
    public Set<ConvertiblePair> getConvertibleTypes() {
    	Set<ConvertiblePair> result=new HashSet<>();
        result.add(new ConvertiblePair(Number.class, BaseEntity.class));
        result.add(new ConvertiblePair(CharSequence.class, BaseEntity.class));
        return result;
    }

    @Override
    public boolean matches(TypeDescriptor sourceType, TypeDescriptor targetType) {
        return BaseEntity.class.isAssignableFrom(targetType.getType())
        && this.conversionService.canConvert(sourceType, TypeDescriptor.valueOf(Integer.class));
    }

    @Override
    @Nullable
    public Object convert(@Nullable Object source, TypeDescriptor sourceType, TypeDescriptor targetType) {
        if (source == null || entityManager==null) {
            return null;
        }

        Integer id = (Integer) this.conversionService.convert(source, sourceType, TypeDescriptor.valueOf(Integer.class));

        Object entity = entityManager.find(targetType.getType(), id);
        if (entity == null) {
            log.info("Did not find an entity with id {} of type {}", id,  targetType.getType());
            return null;
        }

        return entity;
    }

}
