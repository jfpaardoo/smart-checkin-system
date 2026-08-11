package org.springframework.samples.smartcheckin.audit;

import org.jpatterns.gof.DecoratorPattern;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark methods that should be intercepted by AuditAspect.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@DecoratorPattern.Decorator
public @interface Auditable {
    
    /**
     * The action identifier to log (e.g., "USER_CREATE").
     */
    String action();
    
    /**
     * Default details string, if applicable.
     */
    String details() default "";
}
