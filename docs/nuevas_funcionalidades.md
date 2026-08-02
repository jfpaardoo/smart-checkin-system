# Nuevas Funcionalidades: Sistema de Auditoría y Reportes Programados

Este documento detalla el funcionamiento interno, la arquitectura y las decisiones de diseño de las dos nuevas grandes funcionalidades implementadas en el sistema Smart Check-in:
1. **Sistema de Auditoría y Trazabilidad Avanzada (Exportaciones PDF y Alertas en Tiempo Real)**
2. **Exportaciones e Informes de Recursos Humanos con Envío Programado**

---

## 1. Sistema de Auditoría y Trazabilidad Avanzada

El sistema de auditoría se ha mejorado para no solo registrar eventos (inicios de sesión, cambios de configuración, etc.), sino también para ofrecer exportación inmutable y notificaciones proactivas.

### 1.1 Exportación a PDF con Firma de Integridad
Para cumplir con los estándares de cumplimiento y seguridad, los administradores pueden exportar el registro de auditoría en formato PDF.

- **Generación del PDF**: Se utiliza la librería `iText` (Java) para construir un documento bien formateado y profesional. El servicio `PdfReportGenerator` se encarga de definir el estilo corporativo, tablas y la estructura del documento.
- **Firma de Integridad**: Para garantizar que los registros no han sido alterados (inmutabilidad), se calcula un hash (SHA-256) del contenido completo del documento o de los datos exportados y se incrusta en el pie de página del PDF como un sello de integridad. Si se altera un solo byte de los registros, el hash no coincidirá, probando la manipulación.
- **Endpoint**: El controlador `ExportRestController` expone la ruta `GET /api/v1/exports/audit/pdf`.

### 1.2 Alertas de Seguridad en Tiempo Real (WebSockets)
Se ha implementado un sistema reactivo para notificar a los administradores instantáneamente si ocurre un evento anómalo, como un ataque de fuerza bruta.

- **Detección**: `LoginFailureListener` escucha los eventos `AuthenticationFailureBadCredentialsEvent` de Spring Security.
- **Lógica de Alerta**: Registra el evento fallido en la base de datos de auditoría (`AuditRepository`) y comprueba el número de fallos recientes desde la misma dirección IP. Si supera el umbral (por ejemplo, 5 fallos en 10 minutos), dispara una alerta.
- **Distribución (STOMP/WebSockets)**: La alerta se envía al broker de mensajería configurado en `WebSocketConfig` a través de `SimpMessagingTemplate` hacia el tópico `/topic/alerts`.
- **Recepción en el Frontend**: En `AuditDashboard.js`, un cliente `stompjs` y `SockJS` se suscriben al tópico `/topic/alerts`. Cuando reciben el mensaje, muestran una notificación flotante (toast) y refrescan la tabla de logs automáticamente sin necesidad de que el usuario recargue la página.

---

## 2. Exportaciones e Informes de Recursos Humanos con Envío Programado

Se ha automatizado el proceso de reporting para descargar a Recursos Humanos del trabajo manual.

### 2.1 Informes Ejecutivos en PDF
Además de la exportación a CSV existente, RRHH puede descargar un informe ejecutivo completo.
- **Contenido**: El informe PDF cruza datos de las entidades `Checkin` (fichajes) y `FormationAttendance` (asistencia a formaciones), calculando horas trabajadas y porcentajes de asistencia por usuario.
- **Generador Compartido**: Se aprovecha el mismo motor `PdfReportGenerator` utilizado en la auditoría, aplicando una plantilla orientada a métricas y estadísticas.

### 2.2 Envío Automático y Programado (Spring Scheduling & JavaMail)
Para que los supervisores o responsables de RRHH reciban los reportes periódicamente, se ha configurado un cron job interno.

- **Programación (Quartz / Spring @Scheduled)**: La clase `StatisticsScheduler` está anotada con `@EnableScheduling`. Utiliza `@Scheduled(cron = "...")` para ejecutarse automáticamente (ej. el primer día de cada mes a las 08:00 AM, o cada lunes).
- **Recolección de Datos**: Al activarse el trigger, el Scheduler recopila las estadísticas de la base de datos (`JdbcTemplate` o `CheckinRepository`).
- **Generación en Memoria**: Construye el PDF directamente en memoria (como un `ByteArrayOutputStream`) para no saturar el sistema de archivos del servidor.
- **Envío de Correos (JavaMailSender)**: Se inyecta la dependencia `EmailService`, que utiliza `MimeMessageHelper` para construir un correo electrónico con formato HTML e incrustar el PDF generado como archivo adjunto (`addAttachment`).
- **Configuración de Correo**: En `application.properties`, se han definido las propiedades de `spring.mail` (host, puerto, credenciales TLS/SSL) para conectar con el servidor SMTP corporativo.

---

## 3. Consideraciones Técnicas

* **Desacoplamiento**: El envío de correos y la generación de PDFs son servicios independientes, de forma que se pueden reusar en otros lugares del sistema.
* **Manejo de Errores en Background**: Los métodos programados (`@Scheduled`) no tienen contexto HTTP. Por tanto, todas las excepciones son capturadas e impresas en el log del servidor para evitar que el hilo del scheduler muera silenciosamente.
* **Seguridad (CORS y CSRF)**: Las nuevas llamadas para las exportaciones en `/api/v1/exports/**` están securizadas en `SecurityConfiguration.java` y requieren rol de `ADMIN` (para auditoría) o al menos roles con permisos adecuados.
* **Testing**: Se ha provisto un conjunto completo de pruebas unitarias (`EmailServiceTests`, `LoginFailureListenerTests`, `StatisticsSchedulerTests`) utilizando Mockito para aislar las dependencias como la base de datos o el servidor SMTP real.
