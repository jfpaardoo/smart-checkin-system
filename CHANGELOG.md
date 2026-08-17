# Registro de Cambios (Changelog)

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/), y este proyecto sigue [Versionado Semántico (SemVer)](https://semver.org/lang/es/).

---

## [1.0.2](https://github.com/jfpaardoo/smart-checkin-system/releases/tag/v1.0.2) - 2026-08-17

### Corregido (Bug Fixes) & Mejoras
- **Permisos de Cámara y Geolocalización (`Permissions-Policy`)**:
  - Actualizada la cabecera HTTP de seguridad en `SecurityConfiguration.java` a `camera=(self), geolocation=(self), microphone=(), payment=(), usb=()`.
  - Permite al navegador solicitar y utilizar la cámara para el escaneo de códigos QR y la geolocalización GPS en los fichajes sin violaciones de política de permisos (`Permissions policy violation / NotAllowedError`).
- **Permisos y Suscripción a Notificaciones Push**:
  - Corregida la condición de registro en `NotificationBell.js` evaluando `user.username` en lugar de `user.id` (no presente en el almacenamiento de sesión), asegurando la solicitud nativa de permisos push en el navegador tras iniciar sesión.
- **Auditoría React Doctor (Puntuación 100/100 en Frontend)**:
  - **Scroll Pasivo en Móviles**: Incorporada la opción `{ passive: true }` a los eventos `touchstart` en `GlassDropdown.js` y `AnalyticsExportMenu.js` para navegación táctil fluida sin bloquear el hilo principal.
  - **Accesibilidad (a11y)**: Eliminado `autoFocus` invasivo en `TwoFactorLoginForm.js` y añadida etiqueta `<label htmlFor="disable2faCode">` con `aria-label` en `TwoFactorSettings.js`.
  - **Rendimiento de Componentes**: Sustituido `useState` por `useRef` para eventos internos (`beforeinstallprompt` y Service Worker) en `PwaInstallPrompt.js`, eliminando re-renderizados innecesarios.
  - Configuración de reglas de análisis estático en `package.json`.
- **Estabilidad en Tests E2E Playwright**:
  - Interceptados endpoints secundarios de credenciales WebAuthn y sesiones en `2fa-flow.spec.js` para evitar redirecciones `401 Unauthorized` a la pantalla de login.

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
