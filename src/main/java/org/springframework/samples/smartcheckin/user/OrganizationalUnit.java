package org.springframework.samples.smartcheckin.user;

public interface OrganizationalUnit {

    /**
     * Devuelve el nombre de la unidad (ej: el nombre completo del usuario, o el nombre del departamento).
     */
    String getName();

    /**
     * Devuelve el número total de empleados en esta unidad.
     * Para un User devolverá 1, para un Department devolverá la suma de todos sus nodos internos.
     */
    int getTotalEmployees();

    /**
     * Devuelve el número total de empleados que están actualmente trabajando.
     */
    int getCurrentlyWorkingCount();
}
