# Registro de Cambios (Changelog)

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/), y este proyecto sigue [Versionado Semántico (SemVer)](https://semver.org/lang/es/).

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
- **Notificaciones Multi-Canal**: Notificaciones Web Push (VAPID) en segundo plano y notificaciones en tiempo real vía WebSocket (STOMP).
- **Progressive Web App (PWA)**: Aplicación web instalable en móviles y escritorios con soporte offline y caché de recursos esenciales.
- **Internacionalización (i18n)**: Soporte completo de interfaz en 8 idiomas (español, inglés, francés, alemán, italiano, portugués, ruso y búlgaro).

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
