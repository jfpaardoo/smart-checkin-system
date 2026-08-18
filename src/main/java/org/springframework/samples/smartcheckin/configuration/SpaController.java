package org.springframework.samples.smartcheckin.configuration;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    /**
     * Reenvía todas las rutas del cliente (React Router) que no sean peticiones de API
     * ni recursos estáticos al index.html para permitir navegación directa y recarga de página (F5).
     */
    @GetMapping(value = {
        "/",
        "/{path:^(?!api|ws|actuator|swagger|v3|static|locales|h2-console).*$}/**",
        "/{path:^(?!api|ws|actuator|swagger|v3|static|locales|h2-console)[^\\.]*}"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
