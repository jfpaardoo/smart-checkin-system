package org.springframework.samples.smartcheckin.validation.spel;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.expression.Expression;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;

import java.util.Collection;

public class SpelConstraintValidator implements ConstraintValidator<ValidateElementIn, Object> {

    private String elementExpression;
    private String collectionExpression;
    private final ExpressionParser parser = new SpelExpressionParser();

    @Override
    public void initialize(ValidateElementIn constraintAnnotation) {
        this.elementExpression = constraintAnnotation.element();
        this.collectionExpression = constraintAnnotation.collection();
    }

    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        String elemExpStr = elementExpression;
        String collExpStr = collectionExpression;
        
        if (value == null || elemExpStr == null || collExpStr == null) {
            return true;
        }

        StandardEvaluationContext evalContext = new StandardEvaluationContext(value);
        try {
            Expression elemExp = parser.parseExpression(elemExpStr);
            Object element = elemExp.getValue(evalContext);

            Expression collExp = parser.parseExpression(collExpStr);
            Object collectionObj = collExp.getValue(evalContext);

            if (collectionObj instanceof Collection) {
                Collection<?> collection = (Collection<?>) collectionObj;
                return collection.contains(element);
            }
            
            return false;
        } catch (Exception e) {
            return false;
        }
    }
}
