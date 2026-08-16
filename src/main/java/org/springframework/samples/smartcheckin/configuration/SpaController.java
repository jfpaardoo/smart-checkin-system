package org.springframework.samples.smartcheckin.configuration;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    /**
     * Reenvía todas las rutas del cliente (React Router) que no sean peticiones de API
     * ni recursos estáticos al index.html para permitir navegación directa y recarga de página.
     */
    @GetMapping(value = {
        "/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/qr-generator",
        "/users",
        "/users/**",
        "/formations",
        "/formations/**",
        "/companies",
        "/companies/**",
        "/analytics",
        "/analytics/**",
        "/audit",
        "/audit/**",
        "/profile",
        "/profile/**",
        "/admin",
        "/admin/**",
        "/cloud-settings",
        "/cloud-settings/**"
    })
    public String forwardSpaRoutes() {
        return "forward:/index.html";
    }
}
