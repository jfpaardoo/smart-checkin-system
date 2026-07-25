# ShiftSync - Sistema Integrado de Fichaje y Formaciones para BA Glass

Sistema de control de asistencia, fichajes diarios mediante códigos QR dinámicos temporales y gestión de formaciones con panel de analítica para administradores, diseñado específicamente para las necesidades operativas de **BA Glass**.

BA Glass es una empresa líder en la producción de envases de vidrio para alimentación y bebidas, con más de 110 años de historia. Con presencia en 7 países y 13 plantas de producción donde se fabrican más de 12 billones de envases al año, este sistema está pensado para escalar y gestionar eficientemente a sus más de 4,500 empleados, garantizando un fichaje seguro y rápido en sus instalaciones.

## Características Principales

* **Fichaje Seguro mediante QR Dinámico:** Generación de códigos QR de un solo uso que expiran cada 15-30 segundos (TOTP) para evitar suplantaciones o fraude entre empleados en cualquiera de las plantas de producción.
* **Portal de Empleados Minimalista (PWA):** Escaneo rápido e introducción del número de personal (XXXX) recibiendo únicamente confirmación de Éxito o Fracaso. Optimizado para entornos industriales donde la velocidad en los cambios de turno es clave.
* **Gestión de Formaciones:** Registro de jornadas formativas, control de asistencia de usuarios y seguimiento de fechas/horas, vital para la mejora continua del personal y programas como Futura.
* **Panel de Administración Completo:**
  * CRUD completo de usuarios (Formato identificador: `XXXX_nombre_apellidos`).
  * Visualización de métricas y gráficos de porcentaje de asistencia globales y por planta.
  * Exportación de informes en formatos CSV y XLS (Excel) para su integración con sistemas de RRHH o ERP existentes en BA Glass.
  * Interfaz de generación del QR diario para el supervisor de turno.

## Estructura del Proyecto

El proyecto toma como base una arquitectura moderna, robusta y modular, dividida en:

* `/backend`: API REST en **Spring Boot** (Gestión de autenticación JWT, generación/validación de TOTP para QR, lógica de negocio y acceso a base de datos relacional).
* `/frontend`: Aplicación web progresiva (PWA) en **React** (Vista de administrador con gráficos y cliente escáner ligero).
* `/docs`: Especificaciones del modelo de datos, diagramas de arquitectura y manuales de despliegue.

## Formato de Registro
Todos los fichajes persisten la fecha y hora bajo el formato estandarizado: `YYYYMMDD HH:mm`.
