# Registro de Cambios (Changelog)

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/), y este proyecto sigue [Versionado Semántico (SemVer)](https://semver.org/lang/es/).

---

## [1.1.0](https://github.com/jfpaardoo/smart-checkin-system/releases/tag/v1.1.0) - 2026-08-19

### Añadido (Features)
- **Control de Versiones y Migraciones de Base de Datos con Flyway**:
  - Incorporada la infraestructura de migraciones automáticas con `flyway-core` y `flyway-database-postgresql`.
  - Creado el script de migración inicial de esquema `V1__init_schema.sql` que versiona todas las tablas del sistema (`companies`, `authorities`, `appusers`, `formations`, `formation_attendances`, `checkins`, `audit_logs`, `push_subscriptions`, `user_passkeys`, `password_reset_tokens`, `jwt_blacklisted_tokens`, `cloud_settings`, `platform_statistics`) con restricciones de integridad referencial y datos semilla auditados.
- **Fichajes Offline con IndexedDB y Auto-Sincronización en PWA**:
  - Módulo `offlineQueue.js` con almacenamiento local `IndexedDB` para permitir el fichaje mediante código QR en instalaciones sin cobertura de red (almacenes, naves industriales, centros logísticos).
  - Detección automática del restablecimiento de conexión (`window.ononline`) y sincronización desatendida en segundo plano con notificación toast al usuario.
- **Filtrado Multi-Empresa en Reportes y Exportaciones de Analítica**:
  - Parámetro `companyId` integrado en el servicio de analítica (`AnalyticsService`) y en todos los endpoints de exportación en `ExportRestController` (CSV, Excel, PDF para usuarios, asistencias a formaciones y fichajes).
  - Integrado el componente `GlassDropdown` con diseño Liquid Glass en el menú de exportación del panel analítico (`AnalyticsExportMenu.js`) y en el listado de usuarios (`UserListAdmin.js`).
- **Sincronización y Persistencia de Filtros en URL**:
  - Integrado `useSearchParams` en el panel analítico (`AnalyticsDashboard.js`) para sincronizar la pestaña activa (`?tab=overview|employees|formations`), facilitando la compartición y guardado de enlaces a vistas específicas entre administradores.
- **Observabilidad Cloud y Probes para Contenedores**:
  - Habilitadas las sondas de salud `liveness` y `readiness` de Spring Boot Actuator para Kubernetes, Docker y plataformas cloud (Render).

### Mejorado (Performance, Seguridad & Refactorización)
- **Asincronía en Envíos de Correo (`@Async`)**:
  - Anotado `EmailService.sendEmailWithAttachment` con `@Async("taskExecutor")` para evitar bloqueos del hilo HTTP durante la comunicación SMTP en registros, recuperaciones de contraseña y reportes.
- **Optimización de Conexiones JPA (`open-in-view=false`)**:
  - Desactivado Open Session In View para liberar conexiones de base de datos inmediatamente tras la ejecución de los servicios, optimizando el pool HikariCP bajo alta concurrencia.
- **Sanitización Global de Excepciones del Servidor (500)**:
  - Enmascarados los mensajes crudos en `ExceptionHandlerController.java` para devolver un mensaje seguro al cliente (`"Ha ocurrido un error interno en el servidor."`) registrando la traza completa únicamente en los logs del servidor.
- **Resolución Dinámica de Conexiones WebSocket**:
  - Extraída la función `resolveSocketUrl` en `WebSocketProvider.js` para soportar `REACT_APP_WS_URL`, dominios personalizados y pruebas en redes locales sin URLs hardcodeadas ni ternarias anidadas.
- **Reducción de Complejidad Cognitiva y Limpieza de Código**:
  - Refactorizado `AnalyticsService.getAllUsersAnalytics` eliminando sentencias `continue` redundantes y reduciendo la complejidad cognitiva con métodos auxiliares `isEligibleUser` y `matchesSearchQuery`.

### Corregido (Bug Fixes) & Resiliencia Frontend
- **Auto-Recuperación de Chunks y Resiliencia en Despliegues (`lazyWithRetry`)**:
  - Creado el helper `lazyWithRetry.js` y envueltas todas las vistas perezosas en `App.js` para erradicar los fallos `Loading chunk XX failed` (`ChunkLoadError`) en dispositivos móviles (especialmente Android) tras nuevos despliegues en el servidor.
  - Añadida detección de errores de empaquetado en `ErrorFallback` con acción de recarga transparente.
- **Comportamiento Táctil en Desplegables (`GlassDropdown`)**:
  - Eliminado el listener `touchstart` en `GlassDropdown.js` y `AnalyticsExportMenu.js` que cerraba involuntariamente los menús al iniciar un desplazamiento o scroll vertical en pantallas táctiles.
- **Adaptabilidad Responsiva en Dispositivos Móviles Estrechos**:
  - Corregido el desbordamiento horizontal en `AppNavbar.js` (textos fluidos con `truncate` y `min-w-0`) y en el generador de QR (`QRGeneratorAdmin.js`, `qrScanner.css` con dimensiones fluidas `aspect-ratio: 1/1`), asegurando visualización adecuada en terminales Android de 360px o con escalado de fuente del sistema aumentado.
  - Actualizada la etiqueta `viewport` en `index.html` con `viewport-fit=cover`.
- **Persistencia de Solicitud de Instalación PWA**:
  - Ajustado `PwaInstallPrompt.js` para ofrecer siempre el aviso de instalación en Android / PC y la guía de añadir a inicio en iOS mientras la app no esté instalada en modo *standalone*.

---

## [1.0.2](https://github.com/jfpaardoo/smart-checkin-system/releases/tag/v1.0.2) - 2026-08-18

### Corregido (Bug Fixes) & Mejoras
- **Prevención de Cierre de Sesión Involuntario en Escaneo QR**:
  - Sustituido el código HTTP `401 Unauthorized` por `400 Bad Request` en `CheckinRestController.java` ante códigos QR inválidos, expirados o de formaciones ya registradas, evitando que el interceptor de seguridad de Axios interprete la respuesta como expiración del JWT del usuario y expulse la sesión al login.
- **Sincronización del Estado de Trabajo (`isWorking`) en Fichaje Global**:
  - Corregido el método `processCheckinRecord` y el endpoint `checkIn` en `CheckinRestController.java` para actualizar y persistir `user.setIsWorking(type == ENTRADA)` en base de datos, garantizando que el sistema alterne fluidamente entre fichajes de Entrada y solicitudes de Salida con firma obligatoria.
- **Validación Estricta de Formación en Checkout (Frontend & Backend)**:
  - **Frontend (`CheckoutModal.js`)**: Comprobación explícita de que el `formationId` contenido en el código QR escaneado coincida con la formación seleccionada (`selectedAtt.formation.id`), mostrando la advertencia *"Este código QR pertenece a otra formación"* y reanudando la cámara sin avanzar a la firma si se escanea un QR erróneo.
  - **Backend (`FormationService.java`, `FormationRestController.java`, `FormationCheckoutRequest.java`)**: Incorporado el parámetro `token` y validación criptográfica TOTP por ID de formación (`totpService.verifyToken(token, formationId)`) para rechazar peticiones de checkout con tokens ajenos.
- **Manejador Global de `IllegalArgumentException`**:
  - Añadido `@ExceptionHandler(IllegalArgumentException.class)` en `ExceptionHandlerController.java` para devolver `400 Bad Request` con mensaje descriptivo ante cualquier violación de regla de negocio, evitando respuestas genéricas `500 Internal Server Error`.
- **Estandarización de Zonas Horarias (UTC / Local)**:
  - Forzada la zona horaria UTC en `SmartcheckinApplication.java` mediante `@PostConstruct init() { TimeZone.setDefault(TimeZone.getTimeZone("UTC")); }`, asegurando coherencia temporal idéntica entre entornos de desarrollo local y servidores en la nube (Render).
  - Unificado el formateo de fechas con `formatDate` en `UserFormationsTable.js` (vista móvil), `ScannerCheckin.js` y `ActiveSessionsTab.js`.
- **Internacionalización y Soporte Multilingüe Completo (8 Idiomas)**:
  - Añadidas y sincronizadas todas las claves de traducción de toasts y alertas de escaneo/checkout (`wrongFormationQr`, `gpsMissingWarning`, `useFrontCamera`, `useBackCamera`, `confirmSignature`) en los 8 idiomas soportados: Español (`es`), Inglés (`en`), Portugués (`pt`), Francés (`fr`), Alemán (`de`), Polaco (`pl`), Búlgaro (`bg`) y Rumano (`ro`).
- **Cámara QR y Soporte Multilente / Multidispositivo (iOS, Android y PC)**:
  - **Selección Inteligente de Lente Trasera**: Algoritmo `findBestBackCamera` en `useQrScanner.js` que detecta y selecciona por defecto la cámara trasera estándar principal (`0 / main / principal`) en smartphones con múltiples lentes (triple/cuádruple cámara), evitando inicios involuntarios en lentes macro o ultra gran angular.
  - **Formateo Amigable de Dispositivos**: Nombres limpios y comprensibles en los selectores desplegables (`Cámara Trasera Principal`, `Gran Angular`, `Teleobjetivo`, `Cámara Frontal`).
  - **Interfaz Compacta y Centrada**: Reubicado el botón de conmutación de cámara en la fila superior junto al desplegable `GlassDropdown`, manteniendo la misma proporción centrada (`aspectRatio: '1 / 1'`) y ajuste `object-fit: cover` en el visor de vídeo tanto en Check-in como en el modal de Checkout.
  - **Eliminación de Pantallas Negras y Bloqueos de Hardware**: Liberación explícita de los `MediaStreamTrack` y neutralización de los listeners `onabort` antes de transicionar entre lentes, erradicando los errores de consola `Uncaught RenderedCameraImpl video surface onabort()` y `AbortError: The play() request was interrupted`.
  - **Contenedor Estable durante la Carga**: Establecidas dimensiones fijas e indicador giratorio integrado (*"Iniciando cámara..."*) para prevenir saltos de interfaz o que el cuadro aparezca colapsado/aplastado mientras se conecta el stream de vídeo.
  - **Protección Nula en Checkout**: Resuelto el error `Cannot read properties of undefined (reading 'length')` en `CheckoutModal.js`.
- **Enrutamiento SPA y Prevención de Error 403 Forbidden en Recarga (F5)**:
  - Configurado matcher dinámico en `SecurityConfiguration.java` y forwarder por expresiones regulares en `SpaController.java` para despachar `index.html` ante cualquier ruta web del cliente (presente o futura) sin alterar la protección estricta de los endpoints de la API (`/api/**`, `/ws/**`).
- **Deduplicación de Sesiones y Revocación en Cierre de Sesión**:
  - Implementada deduplicación automática por dispositivo en `UserSessionService.java` para evitar acumulación de entradas redundantes de una misma máquina/navegador.
  - Expiración proactiva de sesiones inactivas (>24h) y revocación explícita del registro de sesión en base de datos al invocar `/api/v1/auth/logout` en `AuthController.java`.
- **Geolocalización (GPS) Robusta y Prevención de Fichajes sin Coordenadas**:
  - Estrategia de geolocalización multi-fase en `ScannerCheckin.js` y `QRGeneratorAdmin.js`: si la fijación GPS de alta precisión excede 6 segundos (típico en interiores), conmuta automáticamente a geolocalización por red móvil y Wi-Fi (`enableHighAccuracy: false`).
  - Añadida cápsula de estado con indicador LED de alto contraste (`GPS Administrador Vinculado`) en `QRGeneratorAdmin.js` para asegurar que el QR proyectado contenga las coordenadas antes del escaneo.
- **Sistema Automático de Actualizaciones para PWA y Móviles**:
  - Detección proactiva de nuevas versiones en segundo plano en `PwaUpdateNotification.js` al abrir la app, alternar pestañas (`visibilitychange`) o mediante comprobación periódica cada 15 minutos.
  - Implementada cápsula de actualización flotante Glassmorphism que permite recargar la app con un solo toque (`SKIP_WAITING`) sin tener que borrar el acceso directo del móvil ni vaciar cachés manualmente.
  - Configurado `Cache-Control: no-cache, no-store, must-revalidate` en `WebConfig.java` e `index.html` para `index.html` y `sw.js`, permitiendo que el cliente reciba siempre los archivos empaquetados más recientes de forma inmediata.
- **Diseño Glassmorphism y Accesibilidad**:
  - Rediseñado el botón "Desconectar cuenta de OneDrive" en `CloudSettingsAdmin.js` con estilo cápsula de cristal translúcido, borde suave y contraste mejorado.
  - Pantalla de Logout (`frontend/src/auth/logout`) perfectamente centrada en móviles con altura dinámica `100dvh` y botones tipo cápsula idénticos a los de Login y Home.
- **Persistencia de Sesión y Cookies en iOS WebKit / HTTPS**:
  - Detección dinámica de HTTPS (`isRequestSecure`: `request.isSecure() || X-Forwarded-Proto: https`) en `JwtUtils.java` para asignar automáticamente el atributo `Secure` en producción, garantizando que iOS Safari y WebKit Standalone (PWA) no descarten la cookie `jwt` en las peticiones `POST` autenticadas de fichaje.
  - Configurado `SameSite=Lax` y `Path=/` en las cookies de autenticación para garantizar la persistencia de la sesión en navegaciones internas entre menús de la aplicación.
  - Añadido fallback para leer el token desde la cabecera `Authorization: Bearer` en el endpoint `/api/v1/auth/validate`.
  - **Condicional HSTS en `SecurityConfiguration.java`**: Restringido el envío de la cabecera `Strict-Transport-Security` exclusivamente a conexiones HTTPS reales.
  - **Soporte CORS y Permisos Globales**: Configurado `setAllowedOriginPatterns` y `Permissions-Policy: camera=*, geolocation=*` para garantizar acceso a cámara y GPS en contenedores PWA.
  - **Resiliencia en `PrivateRoute.js`**: Implementada caché de validación en memoria (TTL 30s) y tolerancia a micro-cortes de red/timeouts para que caídas momentáneas de conectividad en móviles no cierren la sesión del usuario.
- **Estabilidad de Arranque y Endpoints en Backend**:
  - Eliminado el mapeo duplicado del endpoint `@GetMapping("/validate")` en `AuthController.java`, solucionando el fallo `IllegalStateException: Ambiguous mapping` que impedía el despliegue de Spring Boot.
- **Corrección de Concurrencia en Sesiones y Formaciones (`NonUniqueResultException`)**:
  - Sustituido `findByTokenHash` por `findFirstByTokenHashOrderByLastActivityAtDesc` y limpieza de registros concurrentes duplicados en `UserSessionService.java`, erradicando el fallo de Hibernate `NonUniqueResultException: 2 results were returned` que provocaba expulsiones inesperadas al login durante la validación de tokens en `AuthTokenFilter`.
  - Reemplazado `findByFormationAndUser` por `findFirstByFormationAndUserOrderByCheckInDateDesc` en `FormationAttendanceRepository.java` y `FormationService.java` para prevenir errores de base de datos en asistencias duplicadas.
- **Protección y Flujo de Check-in con QR**:
  - Protegida la ruta `/checkin` mediante `<PrivateRoute>` en `App.js` para evitar envíos no autenticados (`401 Unauthorized / Full authentication is required`).
  - Sustituido `fetch` nativo por la instancia estándar de Axios (`api.post`) en `ScannerCheckin.js` para garantizar la transmisión de cookies `HttpOnly` y un formateo consistente de errores.
  - Implementado overlay de carga flotante centrado (`fixed inset-0`) con `backdrop-blur` en `ScannerCheckin.js`, evitando desplazamientos bruscos del contenedor de la cámara.
- **Corrección de Registro y Validación de Código de 4 Dígitos**:
  - Implementada verificación preventiva e individual de `username`, `email` y `personalCode` en `AuthController.java` y `UserRepository.java`.
  - Corregido el mapeo de errores en `Register.js` que erróneamente informaba de código personal duplicado cuando el conflicto era por email o usuario.
- **Limpieza Visual y Responsive de Cloudflare Turnstile**:
  - Eliminado el marco contenedor redundante alrededor de Cloudflare Turnstile en las pantallas de Login, Recuperación de Contraseña y Registro, manteniendo un renderizado limpio, centrado y adaptado a dispositivos móviles.

---

## [1.0.1](https://github.com/jfpaardoo/smart-checkin-system/releases/tag/v1.0.1) - 2026-08-17

### Corregido (Bug Fixes)
- **Desplegables Responsivos y Animaciones**:
  - Refactorizado `GlassDropdown` y `AnalyticsExportMenu` con Tailwind CSS puro.
  - Comportamiento flotante con elevación y sombras en escritorio (`md:absolute`, `sm:absolute`).
  - Expansión inline fluida con Grid (`grid-rows-[0fr]` $\rightarrow$ `grid-rows-[1fr]`) en móvil que adapta la altura y empuja suavemente el contenido inferior sin desalineaciones.
  - Aislados los estilos de menú oscuro en `navbar.css` a `.da-navbar` para evitar contaminación en selectores y parpadeos en pantalla.
- **Flujo OAuth2 de OneDrive en Servidor**:
  - Detección dinámica del host y protocolo público (`X-Forwarded-Proto`, `X-Forwarded-Host`, `Host`, `Origin`) para resolver la URI de retorno sin forzar `localhost:8080`.
  - Codificación segura de la URL del frontend dentro del parámetro `state` de OAuth para redirección transparente tras la autorización en Azure.
  - Parametrización de rutas de callback mediante `@Value` cumpliendo con la regla SonarCloud `java:S1075`.
- **Protección Antidoble-Clic en Exportaciones**:
  - Añadido registro global de descargas concurrentes en `downloadExportFile.js` para descartar peticiones simultáneas del mismo archivo.
  - Estados de carga interactivos (`exportingType` / `isExporting`), spinners animados y bloqueo de botones (`disabled`) en `UserListAdmin`, `AnalyticsExportMenu` y `AuditDashboard`.
- **Gestión de Inactividad y Avisos de Sesión**:
  - Refresco automático del temporizador de inactividad en `api.js` ante cualquier petición y respuesta HTTP.
  - Detección de retorno de flujos externos mediante `visibilitychange` en `useIdleTimeout.js`.
  - Corrección de aviso duplicado por inactividad y limpieza automática del parámetro `?reason=timeout` de la URL en la pantalla de login (`history.replaceState`).

---

## [1.0.0](https://github.com/jfpaardoo/smart-checkin-system/releases/tag/v1.0.0) - 2026-08-17

Primera versión estable de **Smart Checkin System**: plataforma integral de control de presencia laboral, gestión de formaciones, seguridad avanzada y cumplimiento del Reglamento General de Protección de Datos (RGPD) para entornos corporativos e industriales.

### Añadido — Autenticación y Seguridad
- **Autenticación JWT Robusta**: Tokens de sesión en cookies `HttpOnly`, `Secure` y `SameSite=Strict` sin exposición de tokens en almacenamiento del navegador.
- **Autenticación de Doble Factor (2FA)**:
  - Soporte para aplicaciones autenticadoras TOTP (Google Authenticator, Authy, etc.).
  - Envío de códigos temporales de verificación vía correo electrónico.
  - **Códigos de Recuperación Offline (Backup Codes)**: Generación de 8 códigos de 8 caracteres alfanuméricos (`XXXX-XXXX`) hasheados con BCrypt en base de datos para acceso de contingencia de un solo uso.
- **Passkeys / WebAuthn (FIDO2)**: Inicio de sesión sin contraseña utilizando biometría (huella dactilar, Face ID, Windows Hello) o llaves de seguridad físicas.
- **Comprobación de Contraseñas Filtradas (HaveIBeenPwned)**: Validador con protocolo *k-Anonymity* en registro, cambio y reseteo de contraseña (solo se transmiten los primeros 5 caracteres del hash SHA-1; fail-open graceful).
- **Protección contra Bots y Ataques de Fuerza Bruta**: Integración de Cloudflare Turnstile CAPTCHA en inicio de sesión, registro y recuperación de cuenta.
- **Limitación de Tasa (Rate Limiting)**: Control por dirección IP mediante Bucket4j con resolución confiable de cabeceras de proxy inverso (`X-Forwarded-For`).
- **Bloqueo Inteligente y Detección de Anomalías**: Bloqueo progresivo ante intentos fallidos y registro automatizado de accesos sospechosos (`AnomalyDetectionService`).
- **Gestión de Sesiones Concurrentes**: Panel de control para listar dispositivos conectados y revocar sesiones activas remotamente.
- **Lista Negra de Tokens Revocados (JWT Blacklist)**: Invocación en tiempo real con purga programada en memoria/base de datos.
- **Recuperación de Contraseña Segura**: Flujo por correo electrónico con tokens efímeros de un solo uso.
- **Cifrado de Datos en Reposo**: Cifrado transparente JPA de campos sensibles (claves 2FA) mediante algoritmo criptográfico `AES-256-GCM`.
- **Cabeceras de Seguridad HTTP**: Configuración estricta de `Content-Security-Policy` (CSP), `Cross-Origin-Opener-Policy` (COOP), `Cross-Origin-Resource-Policy` (CORP) y `Permissions-Policy`.
- **Divulgación Responsable de Vulnerabilidades**: Archivo `security.txt` estándar bajo la especificación RFC 9116.

### Añadido — Funcionalidad de Negocio
- **Control de Fichajes y Asistencia**:
  - Fichaje mediante códigos QR dinámicos temporales basados en algoritmo TOTP.
  - Geolocalización opcional y validación de turnos laborales.
- **Gestión Integral de Formaciones**:
  - Convocatorias, control de asistencia por sesión y firma digital del participante.
  - Generación automática de certificados de asistencia en formato PDF.
  - Almacenamiento seguro de firmas en la nube con integración Microsoft OneDrive (OAuth2 / Azure AD).
- **Arquitectura Multi-Empresa**: Aislamiento por entidad corporativa (`Company`) como base de soporte multi-tenant.
- **Panel de Analítica y RR. HH.**:
  - Métricas de puntualidad, absentismo y horas trabajadas.
  - Exportación de informes en formatos CSV, Excel (XLSX) y PDF.
- **Notificaciones Multi-Canal**: Notificaciones Web Push (VAPID) en segundo plano, eventos en tiempo real vía WebSocket (STOMP) con canales privados por usuario (`/topic/notifications/{username}`) y disparador nativo en sistema operativo.
- **Progressive Web App (PWA) e Instalador Inteligente**:
  - Aplicación web instalable en móviles (Android / iOS Safari) y escritorios con banner nativo `PwaInstallPrompt` y modo *standalone*.
  - Sistema de detección de actualizaciones en caliente (*Auto-Update*) sin intermediación de tiendas de aplicaciones.
- **Diseño Glassmorphism y Experiencia Móvil**: Interfaz moderna basada en Tailwind CSS con tarjetas translúcidas (`backdrop-blur`), paleta de colores corporativa armónica y navegación táctil adaptable.
- **Internacionalización Integral (i18n)**: Soporte completo y sincronizado de interfaz en 8 idiomas (español `es`, inglés `en`, francés `fr`, alemán `de`, portugués `pt`, rumano `ro`, polaco `pl` y búlgaro `bg`) con paridad total de 852 claves.

### Añadido — Cumplimiento Normativo, Privacidad y RGPD
- **Derecho al Olvido (Art. 17 RGPD)**: Anonimización física y técnica de datos personales sin rotura de integridad referencial ni destrucción de registros fiscales/laborales obligatorios.
- **Retención y Purga Automatizada**: Tareas programadas (`@Scheduled`) para la eliminación legal de registros de auditoría y fichajes caducados.
- **Auditoría Criptográfica e Inmutable**: Registro de eventos (`AuditLog`) con cadena de bloques criptográfica (hash-chaining SHA-256 + firma HMAC) y verificador de integridad bajo demanda.
- **Evaluación de Impacto en Protección de Datos (DPIA / EIPD)**: Documentación exhaustiva de riesgos y medidas técnicas en `docs/DPIA_RGPD_Assessment.md`.
- **Registro de Actividades de Tratamiento (RAT)**: Registro formal conforme al Art. 30 del RGPD en `docs/RAT_Registro_Actividades_Tratamiento.md`.
- **Software Bill of Materials (SBOM)**: Generación automática de inventarios de dependencias (`bom.json` y `bom.xml`) mediante CycloneDX para cumplimiento de la directiva **NIS2** y el **Cyber Resilience Act (CRA)**.
- **Modelado de Seguridad**: Matriz de cumplimiento **OWASP ASVS v4** y análisis de amenazas **STRIDE**.

### Añadido — Observabilidad, Calidad y Rendimiento
- **Métricas y Telemetría**: Integración de Spring Boot Actuator y Micrometer para Prometheus (`/actuator/prometheus`, `/actuator/metrics`).
- **Optimización de Recursos (Low-RAM / 512 MB)**: Reducción del ~58% de consumo en memoria, Virtual Threads (Java 21) y carga perezosa (`lazy`) optimizada en JPA.
- **Suite de Pruebas**: Más de 70 clases de pruebas unitarias, de integración, de concurrencia y seguridad (JUnit 5, Mockito, Spring Security Test).
- **Pruebas End-to-End**: Suite automatizada con Playwright.
- **Análisis Estático Continuo**: Integración con SonarCloud para control de deuda técnica, cobertura y calidad de código.

### Añadido — Infraestructura y Despliegue
- **Contenedorización Docker**: Build multi-stage optimizado, ejecución con usuario no-root (`appuser`) y sondas de salud (`HEALTHCHECK`).
- **Configuración Cloud-Native**: Gestión de secretos e infraestructuras mediante variables de entorno (12-Factor App) sin credenciales en el repositorio.
