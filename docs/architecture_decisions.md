# Decisiones de Diseño y Arquitectura (Smart Check-in System)

Este documento es un registro vivo (*Architecture Decision Record* o ADR) de las decisiones arquitectónicas y tecnológicas tomadas durante el desarrollo de la aplicación de fichaje de empleados, con el fin de tener trazabilidad de nuestro diseño frente a futuras consultas técnicas.

## 1. Visión Global de la Arquitectura
**Decisión:** Arquitectura Cloud-Native Híbrida / Serverless (Contenedores Escalables)

*   **Frontend (React PWA):** Preparado para ser desplegado como archivos estáticos en un CDN (ej. Vercel, Netlify, Cloudflare Pages o AWS Amplify). Esto ofrece entrega ultrarrápida al dispositivo móvil del jefe de planta sin latencia de backend.
*   **Backend (Spring Boot 3):** Empaquetado en un contenedor Docker (`Dockerfile`) orientado a ser ejecutado en entornos Serverless (Google Cloud Run, AWS App Runner). Esto permite escalar automáticamente el servicio a 0 para ahorrar costes cuando no hay cambios de turno, o escalar masivamente a decenas de instancias de forma automática si miles de empleados fichan a la misma hora en múltiples fábricas.
*   **Base de Datos (PostgreSQL):** Base de datos relacional para garantizar ACID en los fichajes laborales. Despliegue orientado a bases de datos gestionadas (Google Cloud SQL, AWS RDS).

## 2. Decisiones por Fase

### Fase 1: Configuración Inicial
*   **Migración de Base de Datos:** Pasamos de MySQL/H2 (legacy de Smartcheckin) a **PostgreSQL 15**. Se justifica por ser la base de datos relacional *open source* con mayor madurez para entornos cloud, con soporte robusto de geolocalización (si hiciese falta a futuro con PostGIS) y alta fiabilidad para el almacenamiento de registros inmutables como las horas de trabajo.
*   **Despliegue Local:** Uso de `docker-compose.yml` para garantizar que todos los desarrolladores levanten exactamente la misma versión de PostgreSQL de forma aislada, evitando el síndrome de *"en mi máquina funciona"*.
*   **Seguridad y Credenciales:** Todas las configuraciones sensibles (`application.properties` y `application-postgres.properties`) han sido parametrizadas con **variables de entorno** (`${POSTGRES_USER}`, `${JWT_SECRET}`). Esto garantiza que el repositorio sea seguro de compartir y que en Producción (Cloud Run) se inyecten estas variables desde un gestor de secretos (Secret Manager).

### Fase 2: Modelado del Usuario y Fichajes (Completada)
*   **Identidad de Usuario**: Se ha definido la entidad `User` para utilizar un código personal único de 4 dígitos, adaptando el sistema de login y seguridad (JWT) para que valide bajo este identificador.
*   **Diseño de Fichajes (Check-ins)**:
    *   Se ha optado por implementar un `Enum` (`CheckinType` con valores `ENTRADA` / `SALIDA`) para registrar la dirección del fichaje en lugar de un booleano. Esto aporta flexibilidad ante futuras extensiones (ej. descansos, pausas de comida, etc.).
    *   La entidad `Checkin` se relaciona con `User` mediante una clave foránea (`@ManyToOne`), guardando la fecha y hora mediante `LocalDateTime`.
    *   Se ha integrado la lógica de sincronización: al registrarse una `ENTRADA`, el estado `isWorking` del usuario pasa automáticamente a `true` (y viceversa para una `SALIDA`), optimizando las consultas de estado en tiempo real.
    *   Exposición mediante `CheckinRestController` para permitir el fichaje y consultar el historial propio.
*   **Diseño de Formaciones (Formations)**:
    *   Entidad `Formation` con relación `@ManyToMany` bidireccional con `User` a través de tabla intermedia `formation_attendees`.
    *   Endpoint `POST /formations/{id}/attend` recibe únicamente el `personalCode` de 4 dígitos (validado con `@NotBlank @Size(4,4)`), devolviendo solo mensajes de éxito/fracaso sin datos del empleado (privacidad).
    *   Creación de formaciones restringida a ADMIN mediante doble capa de seguridad: regla en `SecurityFilterChain` + `@PreAuthorize("hasAuthority('ADMIN')")` con `@EnableMethodSecurity`.

### Fase 2 — Auditoría de Seguridad (Completada)
*   **Protección de datos sensibles:** `@JsonIgnore` en el campo `password` de `User` para evitar la exposición del hash bcrypt en cualquier respuesta JSON.
*   **Protección contra recursión infinita:** `@EqualsAndHashCode(exclude)` aplicado en `User` y `Formation` para evitar StackOverflow en las colecciones bidireccionales ManyToMany.
*   **Validación de entrada:** `AttendRequest.personalCode` validado con `@NotBlank @Size(min=4, max=4)` y `@Valid` en el controlador.
*   **Defensa en profundidad:** Toda ruta nueva protegida explícitamente en `SecurityFilterChain` (evitando la herencia silenciosa de `denyAll()`), más anotaciones `@PreAuthorize` como segunda barrera.

### Fase 2 — Refuerzo de Seguridad de Grado Empresarial (Completada)
*   **Mitigación de Fuerza Bruta (Rate Limiting):** Implementación de un `RateLimitFilter` (utilizando **Bucket4j**) antes de la cadena de autenticación. Limita los intentos en `/api/v1/auth/signin` a 10 peticiones por minuto por IP para bloquear ataques de *credential stuffing* o diccionario.
*   **Bloqueo de Cuentas (Account Lockout):** La entidad `User` incluye lógica para suspender temporalmente el acceso (15 minutos) tras registrar 5 intentos fallidos de contraseña (`BadCredentialsException`).
*   **Defensa Anti-Enumeración:** El endpoint de autenticación absorbe silenciosamente excepciones de `ResourceNotFoundException` durante el login. Esto evita revelar información sobre la existencia (o inexistencia) de cuentas en el sistema.
*   **Trazabilidad Automática (JPA Auditing):** Se aplicó `@EnableJpaAuditing` a nivel global con `@EntityListeners` en la clase `BaseEntity`. Todos los registros (Usuarios, Fichajes, Formaciones) registran automáticamente las marcas inmutables de `@CreatedDate` y `@LastModifiedDate`.
*   **Endurecimiento Perimetral (CORS & CSP):** Configuración manual y explícita de `CorsConfigurationSource` limitando orígenes, métodos y cabeceras permitidas. Sustitución de cabeceras anticuadas por un robusto **Content Security Policy (CSP)** configurado a `default-src 'self'`.

### Fase 3: Fichaje por QR Dinámico (TOTP) (Completada)
*   **Lógica Criptográfica:** Integración de `dev.samstevens.totp:totp` para generar tokens TOTP de 6 dígitos con vigencia de 30 segundos. Esto asegura que los QR generados no pueden ser fotografiados y compartidos remotamente por los empleados (previene el fraude horario).
*   **Diseño de Endpoints Invertidos:** A diferencia de sistemas tradicionales, el escáner del empleado llama a una ruta pública (`/api/v1/checkins/qr-fichaje`). El empleado no necesita hacer login ni llevar un JWT en su dispositivo personal.
*   **Defensa Perimetral Específica:** Al ser un endpoint público, está fuertemente protegido con `RateLimitFilter` (Bucket4j) que previene ataques de adivinación (fuerza bruta) del código personal de 4 dígitos o del token TOTP de 6 dígitos limitando las peticiones concurrentes por IP.

### Fase 4: Restricción de Registro (Control de Acceso Cerrado) (Completada)
*   **Decisión:** Eliminación del autorregistro público (`POST /api/v1/auth/signup`).
*   **Justificación:** Al tratarse de un sistema corporativo para el control de asistencia y fichaje laboral dentro de una planta industrial (BA Glass), no debe permitirse que un usuario externo o empleado se cree una cuenta de forma autónoma. Esto previene el registro de identidades falsas o duplicadas y centraliza el control de altas/bajas en el departamento de Recursos Humanos (Admin) a través del Panel de Gestión de Usuarios.
*   **Implicación:** El endpoint `/api/v1/auth/signup` ha sido desactivado y los flujos frontend correspondientes a la pantalla de registro se han eliminado por completo de la aplicación.

### Fase 5: Sincronización en Tiempo Real mediante WebSockets (STOMP / SockJS) (Completada)
*   **Decisión:** Integración de Spring WebSocket (`@EnableWebSocketMessageBroker`) con protocolo STOMP sobre SockJS y canal `/topic/totp-update`.
*   **Justificación:** Elimina la necesidad de peticiones HTTP en bucle (*polling*) desde el quiosco de fichaje. El servidor emite automáticamente el nuevo token TOTP cada 10 segundos a todos los paneles de administración conectados, reduciendo el tráfico de red y garantizando la sincronización instantánea del código QR y la barra de progreso animada.
*   **Implementación Frontend:** Creación de un contexto global `WebSocketProvider` y el hook reactivo `useSubscription` para gestionar la reconexión automática y el ciclo de vida de la suscripción STOMP.

### Fase 6: Sistema de Diseño Visual "Liquid Glass" y UX Reactiva (Completada)
*   **Sistema de Diseño Corporativo:** Rediseño íntegro de la interfaz de usuario bajo la estética de **Vidrio Líquido (Liquid Glassmorphism)** de BA Glass:
    *   Cápsula de navegación flotante (`#2d2d2d`) con opacidad controlada (`rgba(40, 40, 40, 0.85)`) y refracción óptica `backdrop-filter: blur(60px)`.
    *   Tarjetas, tablas y botones estilizados con bordes traslúcidos, sombras proyectadas y paleta cromática corporativa (verde pistacho `#cce364`, blanco brillante y grises industriales).
    *   Inclusión de iconografía descriptiva FontAwesome (`react-icons/fa`) en menús de navegación y acciones.
    *   Favicon circular transparente (`ba-logo-circle.png`) y metadatos PWA adaptados (`ShiftSync | BA Glass Smart Check-in`).
*   **Carga Mediante Contenedores Fantasma (Skeleton Loaders):**
    *   **Decisión:** Sustitución global de textos planos y spinners de carga anticuados (`Loading...`) por el componente reutilizable `GhostLoader.js` (`TableGhostLoader`, `CardGhostLoader`, `QRGhostLoader`).
    *   **Justificación:** Implementa un efecto animado de brillo (*shimmer*) que respeta la forma de la interfaz durante la obtención de datos REST, eliminando el desplazamiento brusco de maquetación (*Cumulative Layout Shift - CLS*) y mejorando la fluidez percibida.

### Fase 7: Purga de Código Muerto y Deuda Técnica (Completada)
*   **Decisión:** Eliminación completa de todos los módulos, paquetes y componentes residuales del proyecto semilla (Spring Petclinic).
*   **Justificación:** Se han purgado del backend y del frontend los paquetes `pet`, `vet`, `visit`, `owner`, `consultation`, vistas JSP antiguas y clases react obsoletas. Esto optimiza el tiempo de compilación, elimina la deuda técnica y garantiza que el 100% de la base de código responda exclusivamente al dominio funcional de **Smart Check-in**.
