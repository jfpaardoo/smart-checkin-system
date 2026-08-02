# Sistema de Auditoría Avanzada y Reportes Automatizados de RRHH

Este documento describe la arquitectura, diseño y funcionamiento de los dos módulos avanzados implementados para la gestión de seguridad (Auditoría y Alertas) y generación de informes estadísticos en el sistema **Smart Check-in**.

---

## 1. Auditoría Avanzada y Trazabilidad

El sistema original de auditoría registraba eventos básicos en base de datos. Para adecuarlo a un entorno industrial de alta seguridad, se han implementado alertas en tiempo real contra ataques de fuerza bruta y exportación inmutable en PDF.

### 1.1. Detección de Ataques (Fuerza Bruta) y Alertas
- **Componente**: `LoginFailureListener` (implementa `ApplicationListener<AuthenticationFailureBadCredentialsEvent>`).
- **Funcionamiento**: Spring Security emite eventos automáticamente tras un intento fallido de autenticación. Este Listener captura dichos eventos, extrae el nombre de usuario y la dirección IP desde el contexto web (`RequestContextHolder`).
- **Caché/Estado**: Utiliza un `ConcurrentHashMap` en memoria para registrar el número de intentos fallidos por usuario.
- **Disparo de Alertas**: Si un usuario alcanza **3 intentos fallidos consecutivos**, el sistema:
  1. Registra de inmediato un evento crítico (`SECURITY ALERT TRIGGERED`) en la base de datos de Auditoría (`AuditLogRepository`).
  2. Envía un mensaje STOMP por el canal WebSocket (`/topic/alerts`) indicando la alerta de seguridad.
- **Recepción en Frontend**: El componente `AuditDashboard.js` se encuentra suscrito al canal `/topic/alerts` mediante el hook global `useWebSocket()`. Al recibir el mensaje, muestra un **Toast de Error (rojo)** instantáneamente en pantalla a los administradores conectados, sin necesidad de refrescar la página.

### 1.2. Exportación de Logs de Auditoría con Firma de Integridad
- **Componente**: `ExportRestController` y `PdfReportGenerator`.
- **Funcionamiento**: Se expone el endpoint `GET /api/v1/exports/audit/pdf`. 
- **Generación del PDF**: Utiliza la librería **OpenPDF** (`com.github.librepdf:openpdf`) para iterar todos los registros de la tabla `audit_logs` y tabularlos con fuentes y colores corporativos.
- **Firma Criptográfica**: Para asegurar la inmutabilidad de los registros, `PdfReportGenerator` concatena todos los datos auditados (acción, usuario, detalles, IP y timestamp) en un único texto y le aplica una función hash **SHA-256** mediante `MessageDigest`. Este hash se imprime de forma visible al final del PDF, permitiendo a los auditores comprobar matemáticamente si los logs han sido alterados posteriormente.

---

## 2. Reportes Estadísticos Automatizados para RRHH

El objetivo de este módulo es procesar las métricas críticas del sistema de personal (estado de check-ins, horas trabajadas y progreso de formaciones) y enviarlas automáticamente por correo electrónico a Recursos Humanos de forma periódica, acompañadas de gráficos generados en el servidor.

### 2.1. Recopilación de Estadísticas en Tiempo Real
- **Componente**: `StatisticsBatchConfig` (Spring Batch).
- **Funcionamiento**: El *Tasklet* principal lee en tiempo real el estado de las tablas operativas:
  - Total de check-ins (`checkinRepository.count()`).
  - Trabajadores activos en este instante (check-ins donde `out_date IS NULL` mediante consulta SQL nativa en `JdbcTemplate`).
  - Formaciones activas (`end_date > CURRENT_TIMESTAMP`).
  - Promedio global de horas trabajadas utilizando funciones de fecha de Postgres (`EXTRACT(EPOCH FROM ...)`).
- **Almacenamiento**: Los resultados se persisten en la tabla `statistics` a través de `StatisticsRepository`.

### 2.2. Generación de Gráficos Nativos (Server-Side)
- Dado que las alertas de RRHH se ejecutan sin intervención de un navegador (procesos en segundo plano o *cron jobs*), no se pueden usar librerías de gráficos de frontend (como Recharts).
- **Solución Técnica**: Se utiliza la librería **XChart** (`org.knowm.xchart:xchart`).
- **Componente**: `PdfReportGenerator.generateHrReportPdf()`.
- **Funcionamiento**: Toma las métricas recolectadas, construye un objeto `PieChart` con los datos (por ejemplo, Personal Activo vs. Inactivo) y llama a `BitmapEncoder` para rasterizar el gráfico en memoria (array de bytes). Posteriormente, el gráfico se incrusta como imagen (`Image.getInstance()`) dentro del documento OpenPDF.

### 2.3. Programación y Notificación por Correo
- **Planificador**: `StatisticsScheduler`.
- **Funcionamiento**: Emplea la anotación `@Scheduled` de Spring.
  - El método `runJob()` (ejecutado cada hora) orquesta el flujo de Spring Batch para mantener las estadísticas actualizadas.
  - El método `sendHrReport()` está configurado para dispararse periódicamente (por ejemplo, cada viernes). Éste recupera las últimas métricas, llama a `PdfReportGenerator` para crear el PDF en memoria.
- **Envío**: Finalmente, invoca a `EmailService`, que utiliza `JavaMailSender` (vía SMTP) para adjuntar el byte-array del PDF bajo el nombre `HR_Report.pdf` y enviarlo a los responsables de área en un correo MIME (*Multipurpose Internet Mail Extensions*).

---

## Resumen de Flujo Completo

1. Un **ataque de fuerza bruta** o error masivo ocurre.
2. `LoginFailureListener` lo detecta, manda una alerta STOMP que el Frontend muestra a Recursos Humanos/Seguridad inmediatamente.
3. Las **estadísticas de horas trabajadas y operarios activos** se actualizan automáticamente de fondo con `Spring Batch`.
4. Llega la **fecha programada** (ej. viernes a final de turno).
5. `StatisticsScheduler` extrae los datos, `XChart` dibuja los gráficos, `OpenPDF` ensambla un reporte ejecutivo, y `JavaMailSender` lo envía directamente al buzón del responsable sin que nadie deba entrar en la aplicación.
6. Si Seguridad lo necesita en cualquier momento, puede ir a la web, pulsar "Exportar PDF" y obtener una **Auditoría inmutable protegida por un Hash SHA-256**.
