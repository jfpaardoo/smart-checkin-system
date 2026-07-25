# Decisiones de Diseño y Arquitectura (Smart Check-in System)

Este documento es un registro vivo (*Architecture Decision Record* o ADR) de las decisiones arquitectónicas y tecnológicas tomadas durante el desarrollo de la aplicación de fichaje de empleados, con el fin de tener trazabilidad de nuestro diseño frente a futuras consultas técnicas.

## 1. Visión Global de la Arquitectura
**Decisión:** Arquitectura Cloud-Native Híbrida / Serverless (Contenedores Escalables)

*   **Frontend (React PWA):** Preparado para ser desplegado como archivos estáticos en un CDN (ej. Vercel, Netlify, Cloudflare Pages o AWS Amplify). Esto ofrece entrega ultrarrápida al dispositivo móvil del jefe de planta sin latencia de backend.
*   **Backend (Spring Boot 3):** Empaquetado en un contenedor Docker (`Dockerfile`) orientado a ser ejecutado en entornos Serverless (Google Cloud Run, AWS App Runner). Esto permite escalar automáticamente el servicio a 0 para ahorrar costes cuando no hay cambios de turno, o escalar masivamente a decenas de instancias de forma automática si miles de empleados fichan a la misma hora en múltiples fábricas.
*   **Base de Datos (PostgreSQL):** Base de datos relacional para garantizar ACID en los fichajes laborales. Despliegue orientado a bases de datos gestionadas (Google Cloud SQL, AWS RDS).

## 2. Decisiones por Fase

### Fase 1: Configuración Inicial
*   **Migración de Base de Datos:** Pasamos de MySQL/H2 (legacy de Petclinic) a **PostgreSQL 15**. Se justifica por ser la base de datos relacional *open source* con mayor madurez para entornos cloud, con soporte robusto de geolocalización (si hiciese falta a futuro con PostGIS) y alta fiabilidad para el almacenamiento de registros inmutables como las horas de trabajo.
*   **Despliegue Local:** Uso de `docker-compose.yml` para garantizar que todos los desarrolladores levanten exactamente la misma versión de PostgreSQL de forma aislada, evitando el síndrome de *"en mi máquina funciona"*.
*   **Seguridad y Credenciales:** Todas las configuraciones sensibles (`application.properties` y `application-postgres.properties`) han sido parametrizadas con **variables de entorno** (`${POSTGRES_USER}`, `${JWT_SECRET}`). Esto garantiza que el repositorio sea seguro de compartir y que en Producción (Cloud Run) se inyecten estas variables desde un gestor de secretos (Secret Manager).

### Fase 2: Modelado del Usuario y Fichajes (Completada)
*   **Identidad de Usuario**: Se ha definido la entidad `User` para utilizar un código personal único de 4 dígitos, adaptando el sistema de login y seguridad (JWT) para que valide bajo este identificador.
*   **Diseño de Fichajes (Check-ins)**:
    *   Se ha optado por implementar un `Enum` (`CheckinType` con valores `ENTRADA` / `SALIDA`) para registrar la dirección del fichaje en lugar de un booleano. Esto aporta flexibilidad ante futuras extensiones (ej. descansos, pausas de comida, etc.).
    *   La entidad `Checkin` se relaciona con `User` mediante una clave foránea (`@ManyToOne`), guardando la fecha y hora mediante `LocalDateTime`.
    *   Se ha integrado la lógica de sincronización: al registrarse una `ENTRADA`, el estado `isWorking` del usuario pasa automáticamente a `true` (y viceversa para una `SALIDA`), optimizando las consultas de estado en tiempo real.
    *   Exposición mediante `CheckinRestController` para permitir el fichaje y consultar el historial propio.

