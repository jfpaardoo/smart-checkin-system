# Especificación de APIs y Canales de Comunicación

Este documento define la interfaz de programación de aplicaciones (API REST) y la infraestructura de comunicación bidireccional en tiempo real (WebSockets STOMP) para **Distribution Academy (Smart Check-in System)**.

---

## 1. Convenciones y Estándares Globales

### 1.1 Formato de URLs y Protocolo
- **Protocolo Base:** `HTTPS` (en producción) / `HTTP` (en entorno de desarrollo local).
- **Prefijo Global de API:** `/api/v1/`
- **Punto de Entrada WebSocket:** `/ws` (con soporte para transporte nativo WebSocket y fallback a `SockJS`).
- **Codificación de Caracteres:** `UTF-8`.
- **Formato de Carga Útil (Payload):** `application/json` (excepto descargas binarias en `application/pdf`, `text/csv` o `application/vnd.ms-excel`).

### 1.2 Formato Estándar de Errores (RFC 7807)
Todas las respuestas de error siguen una estructura JSON unificada procesada por `GlobalExceptionHandler`:

```json
{
  "timestamp": "2026-09-23T12:00:00.000Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Descripción detallada del motivo del fallo",
  "path": "/api/v1/checkins/qr-fichaje"
}
```

### 1.3 Políticas de Rate Limiting (Bucket4j)
Para prevenir ataques de denegación de servicio (DoS) y fuerza bruta contra credenciales o códigos TOTP, se aplican dos niveles de control por dirección IP cliente:

| Nivel | Límite | Endpoints Protegidos | Comportamiento al Exceder |
|---|---|---|---|
| **Estricto** | 10 peticiones / minuto | `/api/v1/auth/login`, `/verify-2fa`, `/forgot-password`, `/reset-password`, `/webauthn/login/**` | HTTP `429 Too Many Requests` |
| **Estándar** | 120 peticiones / minuto | Resto de rutas de la API (`/api/v1/**`) | HTTP `429 Too Many Requests` |

---

## 2. Esquemas de Autenticación y Seguridad

### 2.1 Autenticación Basada en Tokens JWT (Stateless)
- **Cabecera requerida:** `Authorization: Bearer <TOKEN_JWT>`
- **Algoritmo de firma:** HMAC-SHA256 (`HS256`) o RSA (`RS256`).
- **Validez del Token:** 24 horas (configurable en `app.jwtExpirationMs`).
- **Revocación Inmediata:** Integración con `JwtBlacklistService`. Cuando un usuario cierra sesión o actualiza su contraseña, el identificador único del token (`jti`) es incorporado a una lista negra en memoria/persistencia, invalidándolo instantáneamente para cualquier petición subsiguiente.

### 2.2 Doble Factor de Autenticación (2FA / TOTP)
- Implementación de RFC 6238 con un paso temporal de 30 segundos y 6 dígitos numéricos.
- Los secretos compartidos se almacenan cifrados en la base de datos utilizando el conversor de atributos JPA `StringCryptoConverter` con algoritmo AES-256 en modo GCM.
- El atributo `twoFactorSecret` cuenta con la anotación `@JsonIgnore` para prevenir cualquier divulgación involuntaria en las respuestas de la API.

### 2.3 Autenticación Biométrica y Passkeys (FIDO2 / WebAuthn)
- Integración nativa con WebAuthn para inicio de sesión sin contraseñas y registro de llaves de seguridad físicas (YubiKey) o biometría de dispositivo (Touch ID, Face ID, Windows Hello).
- Validación obligatoria del parámetro `origin` en `clientDataJSON` para prevenir ataques de *cross-origin phishing*.

---

## 3. Catálogo de Endpoints REST

### 3.1 Módulo de Autenticación (`/api/v1/auth`)

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Público | Autenticación con `username` y `password`. Devuelve el JWT o un indicador `{ requires2fa: true }`. |
| `POST` | `/api/v1/auth/verify-2fa` | Público | Verificación del código de 6 dígitos para completar el inicio de sesión con 2FA activo. |
| `POST` | `/api/v1/auth/signup` | Público / Admin | Registro inicial de empleados (sujeto a validación de código de personal). |
| `POST` | `/api/v1/auth/forgot-password` | Público | Solicitud de enlace o token de restablecimiento de clave vía correo electrónico SMTP. |
| `POST` | `/api/v1/auth/reset-password` | Público | Aplicación de nueva contraseña asociada a un token válido no expirado. |
| `POST` | `/api/v1/auth/webauthn/login/options` | Público | Generación del desafío criptográfico (*challenge*) para inicio de sesión con Passkey. |
| `POST` | `/api/v1/auth/webauthn/login/verify` | Público | Comprobación matemática de la aserción de autenticación firmada por el dispositivo. |
| `POST` | `/api/v1/auth/webauthn/register/options`| Autenticado | Generación del desafío para vincular una nueva credencial biométrica a la cuenta activa. |
| `POST` | `/api/v1/auth/webauthn/register/verify` | Autenticado | Registro y almacenamiento de la clave pública FIDO2 del dispositivo. |
| `GET`  | `/api/v1/auth/webauthn/credentials` | Autenticado | Listado de credenciales y dispositivos biométricos vinculados al usuario. |
| `DELETE`| `/api/v1/auth/webauthn/credentials/{id}` | Autenticado | Eliminación o revocación de una credencial Passkey específica. |

---

### 3.2 Módulo de Usuarios y Perfil (`/api/v1/users`)

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/users` | `ADMIN` | Listado paginado de usuarios con soporte para filtros por estado y rol. |
| `POST` | `/api/v1/users` | `ADMIN` | Alta manual de empleados con generación de código personal de 4 dígitos. |
| `GET` | `/api/v1/users/{id}` | `ADMIN` | Detalle completo de la ficha de un empleado. |
| `PUT` | `/api/v1/users/{id}` | `ADMIN` | Actualización de datos administrativos o de contacto. |
| `DELETE` | `/api/v1/users/{id}` | `ADMIN` | Eliminación lógica o física de una cuenta de usuario. |
| `PUT` | `/api/v1/users/{id}/status` | `ADMIN` | Cambio de estado de la cuenta (`ACTIVE`, `PENDING`, `SUSPENDED`). |
| `GET` | `/api/v1/users/me` | Autenticado | Obtención de los datos del perfil del usuario actualmente autenticado. |
| `PUT` | `/api/v1/users/me` | Autenticado | Modificación de datos personales (nombre, apellidos, email). |
| `PUT` | `/api/v1/users/me/password` | Autenticado | Actualización de contraseña propia (revoca automáticamente todas las demás sesiones activas). |
| `POST` | `/api/v1/users/2fa/generate` | Autenticado | Generación de nuevo secreto TOTP y URI de código QR para Google Authenticator. |
| `POST` | `/api/v1/users/2fa/enable` | Autenticado | Confirmación de activación de 2FA tras verificar un código correcto. |
| `POST` | `/api/v1/users/2fa/disable` | Autenticado | Desactivación de 2FA previa validación de la contraseña actual. |

---

### 3.3 Módulo de Fichajes y Códigos QR (`/api/v1/checkins` y `/api/v1/totp`)

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/totp/current` | `ADMIN` | Obtención del token TOTP vigente para renderizar el código QR en la pantalla de recepción. |
| `POST` | `/api/v1/checkins/qr-fichaje` | Autenticado / Empleado | Envío de `personalCode` y `totpToken`. Si se trata de una salida que exige conformidad, devuelve `202 Accepted` solicitando firma digital en Base64. |
| `GET` | `/api/v1/checkins/status/{personalCode}` | Autenticado | Consulta del estado actual del operario (`isWorking: true/false`, fecha de última entrada). |
| `GET` | `/api/v1/checkins/history` | Autenticado | Historial cronológico de registros de entrada y salida del propio operario. |
| `GET` | `/api/v1/checkins/all` | `ADMIN` | Registro maestro consolidado de todos los fichajes de la planta industrial. |

---

### 3.4 Módulo de Formaciones y Certificados (`/api/v1/formations` y `/api/v1/certificates`)

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/formations` | Autenticado | Catálogo de jornadas formativas activas, planificadas o concluidas. |
| `POST` | `/api/v1/formations` | `ADMIN` | Creación de una nueva jornada formativa (título, fechas, horas, cupo). |
| `GET` | `/api/v1/formations/{id}` | Autenticado | Detalle, programa y estadísticas de asistencia de una formación. |
| `PUT` | `/api/v1/formations/{id}` | `ADMIN` | Actualización de datos o reprogramación de fechas. |
| `DELETE` | `/api/v1/formations/{id}` | `ADMIN` | Cancelación o borrado de una jornada formativa. |
| `POST` | `/api/v1/formations/{id}/attend` | Autenticado | Registro de asistencia del empleado a una sesión formativa. |
| `GET` | `/api/v1/formations/{id}/attendees` | `ADMIN` | Listado nominal de empleados inscritos y firmas de asistencia registradas. |
| `GET` | `/api/v1/certificates/formation/{fid}/user/{uid}` | Autenticado | Generación al vuelo y descarga del diploma acreditativo en PDF con firma digital. |

---

### 3.5 Módulo de Analítica, Auditoría y Exportaciones (`/api/v1/analytics`, `/audit`, `/exports`)

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/analytics/overview` | `ADMIN` | Indicadores clave (KPIs): operarios activos, índice de puntualidad y formaciones en curso. |
| `GET` | `/api/v1/analytics/work-hours` | `ADMIN` | Desglose acumulado de horas ordinarias y extraordinarias por planta y departamento. |
| `GET` | `/api/v1/audit/logs` | `ADMIN` | Registro de eventos del sistema (login, logout, cambios de permisos, accesos denegados). |
| `GET` | `/api/v1/exports/checkins/csv` | `ADMIN` | Descarga de fichajes en formato plano delimitado por comas (`CSV`). |
| `GET` | `/api/v1/exports/checkins/excel` | `ADMIN` | Descarga de informe estructurado en formato Microsoft Excel (`.xlsx`). |
| `GET` | `/api/v1/exports/audit/pdf` | `ADMIN` | Exportación forense de auditoría en PDF con **firma de integridad SHA-256**. |
| `GET` | `/api/v1/exports/hr/report/pdf` | `ADMIN` | Generación de reporte ejecutivo mensual de RRHH con gráficos nativos `XChart`. |
| `GET` | `/api/v1/exports/me/export` | Autenticado | Derecho a la portabilidad (Art. 20 RGPD): descarga de todos los datos personales del usuario. |

---

### 3.6 Módulo de Notificaciones Push y Almacenamiento Cloud (`/api/v1/push` y `/cloud-settings`)

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| `GET` | `/api/v1/push/vapid-public-key` | Público | Obtención de la clave pública VAPID para inicializar el Service Worker en el cliente. |
| `POST` | `/api/v1/push/subscribe` | Autenticado | Registro de un endpoint Push del navegador para recibir notificaciones del sistema. |
| `POST` | `/api/v1/push/unsubscribe` | Autenticado | Baja voluntaria de notificaciones Push en el dispositivo actual. |
| `GET` | `/api/v1/cloud-settings` | `ADMIN` | Estado de la conexión con OneDrive / Microsoft Graph. |
| `PUT` | `/api/v1/cloud-settings` | `ADMIN` | Configuración de credenciales de cliente Azure (`clientId`, `tenantId`, carpetas). |
| `GET` | `/api/v1/cloud-settings/oauth/authorize` | `ADMIN` | Inicio del flujo de consentimiento OAuth2 con Microsoft Identity Platform. |
| `GET` | `/api/v1/cloud-settings/oauth/callback` | Público | Redirección de retorno OAuth2 para almacenar los tokens de refresco cifrados. |
| `POST` | `/api/v1/cloud-settings/backup` | `ADMIN` | Disparo manual de copia de seguridad de la base de datos hacia OneDrive. |

---

## 4. Canales de Comunicación en Tiempo Real (WebSockets STOMP)

El backend expone un broker de mensajería STOMP sobre el endpoint SockJS `/ws`.

### 4.1 Tópico `/topic/totp-update`
- **Direccionalidad:** Servidor -> Clientes suscritos (Unidireccional / Broadcast).
- **Frecuencia:** Cada 15–30 segundos.
- **Payload:**
  ```json
  {
    "token": "489215",
    "expiresInSeconds": 28,
    "timestamp": 1727092800000
  }
  ```
- **Consumidor:** Vista de Quiosco / Supervisor de Turno (`QRGeneratorAdmin.js`). Renderiza instantáneamente el nuevo código QR visualizado por los empleados sin requerir sondeo HTTP (*polling*).

### 4.2 Tópico `/topic/alerts`
- **Direccionalidad:** Servidor -> Clientes suscritos (Administradores / Seguridad).
- **Disparador:** Detección de patrones anómalos (ej. más de 3 intentos fallidos consecutivos de login desde la misma IP en menos de 10 minutos).
- **Payload:**
  ```json
  {
    "severity": "CRITICAL",
    "eventType": "BRUTE_FORCE_DETECTED",
    "ipAddress": "192.168.1.150",
    "username": "operario123",
    "message": "Se han detectado múltiples intentos fallidos de autenticación.",
    "timestamp": 1727092812000
  }
  ```
- **Consumidor:** Panel de control de administradores (`AuditDashboard.js`). Despliega alertas emergentes tridimensionales con retroalimentación háptica y refresca los registros en tiempo real.

---

## 5. Acceso a la Interfaz Interactiva Swagger / OpenAPI

Para tareas de integración interna y pruebas interactivas:
- **Consola Swagger UI:** `http://localhost:8080/swagger-ui/index.html`
- **Especificación OpenAPI v3 (JSON):** `http://localhost:8080/v3/api-docs`

> [!NOTE]
> Por directriz de seguridad (`SecurityConfiguration.java`), el acceso a Swagger UI y a la definición OpenAPI está restringido exclusivamente a usuarios autenticados con rol `ADMIN`.
