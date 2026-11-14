package org.springframework.samples.smartcheckin.configuration;

import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Contact;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.info.License;
import io.swagger.v3.oas.annotations.security.SecurityScheme;

@Configuration
@OpenAPIDefinition(
  info = @Info(
    title = "Distribution Academy APIs — Smart Check-in System",
    version = "${api.version:1.4.2}",
    contact = @Contact(
      name = "Equipo de Desarrollo Distribution Academy",
      email = "support@distributionacademy.local",
      url = "https://github.com/jfpaardoo/smart-checkin-system"
    ),
    license = @License(
      name = "MIT License",
      url = "https://opensource.org/licenses/MIT"
    ),
    termsOfService = "${tos.uri:/terms-and-conditions}",
    description = "${api.description}"
  )
)
@SecurityScheme(
    name = "bearerAuth",
    type = SecuritySchemeType.HTTP,
    bearerFormat = "JWT",
    scheme = "bearer"
)
public class OpenApiConfiguration {
    
}
