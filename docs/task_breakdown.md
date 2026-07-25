# Desglose de Tareas: ShiftSync (BA Glass)

Este documento detalla la división del proyecto en pequeñas tareas abordables en jornadas máximas de 24 horas de esfuerzo. Cada tarea define una rama de Git utilizando los prefijos estándar de la industria (Conventional Commits):
* `feat/`: Nuevas funcionalidades.
* `fix/`: Corrección de errores.
* `chore/`: Tareas de mantenimiento, configuración o limpieza.
* `refactor/`: Refactorización de código existente sin añadir funcionalidades.

---

## FASE 1: Configuración Inicial y Limpieza (Día 1)

### Tarea 1.1: Limpieza del dominio Petclinic
* **Descripción:** Eliminar del backend de Spring Boot y del frontend en React las entidades, controladores y vistas que no usaremos (Vet, Pet, Owner, Visit). Dejar únicamente la infraestructura core (configuración, excepciones, base).
* **Rama:** `chore/cleanup-petclinic-entities`

### Tarea 1.2: Configuración de Base de Datos
* **Descripción:** Actualizar `application.properties` y `docker-compose.yml` para asegurar la conexión con la base de datos relacional (PostgreSQL/MariaDB) que usaremos en desarrollo.
* **Rama:** `chore/db-configuration`

---

## FASE 2: Modelado de Datos y Seguridad (Días 2-3)

### Tarea 2.1: Dominio de Usuario y Autenticación
* **Descripción:** Crear la entidad `Usuario` (número personal 4 dígitos, nombre, apellidos, password, rol ADMIN/USER). Adaptar Spring Security y JWT para autenticar bajo este nuevo modelo.
* **Rama:** `feat/user-domain-security`

### Tarea 2.2: Dominio de Fichajes (Check-ins)
* **Descripción:** Crear la entidad `Fichaje` relacionada con `Usuario`. Añadir lógica para almacenar fechaHora en formato `YYYYMMDD HH:mm` y tipo (Entrada/Salida).
* **Rama:** `feat/checkin-domain`

### Tarea 2.3: Dominio de Formaciones
* **Descripción:** Crear entidad `Formacion` y la tabla intermedia (Many-To-Many) para gestionar la asistencia de usuarios a las jornadas formativas.
* **Rama:** `feat/training-domain`

---

## FASE 3: Lógica Core de Fichaje Seguro (Día 4)

### Tarea 3.1: Servicio TOTP (QR Dinámico)
* **Descripción:** Implementar la lógica criptográfica en Spring Boot para generar tokens basados en tiempo (TOTP) que expiran cada 15-30 segundos.
* **Rama:** `feat/totp-service`

### Tarea 3.2: API Endpoints para Fichajes
* **Descripción:** Crear los endpoints REST que el frontend consumirá: uno para que el Admin obtenga el token actual (y generar el QR), y otro para que el Empleado envíe su número de personal y el token leído.
* **Rama:** `feat/checkin-endpoints`

---

## FASE 4: Frontend - Panel de Administración (Días 5-7)

### Tarea 4.1: Interfaz CRUD de Usuarios y Formaciones
* **Descripción:** Desarrollar en React las tablas y formularios para crear, editar, listar y eliminar Usuarios y Formaciones.
* **Rama:** `feat/ui-admin-management`

### Tarea 4.2: Interfaz Generadora de QR
* **Descripción:** Crear la vista en React donde el supervisor de turno abre el sistema. Debe hacer *polling* a la API cada 15 segundos para renderizar visualmente un nuevo código QR.
* **Rama:** `feat/ui-admin-qr-generator`

---

## FASE 5: Frontend - Portal de Empleado (Días 8-9)

### Tarea 5.1: Escáner QR Web (PWA)
* **Descripción:** Implementar la librería `html5-qrcode` para acceder a la cámara desde el navegador. Crear la interfaz minimalista donde el usuario escanea y pone su número de 4 dígitos.
* **Rama:** `feat/ui-user-scanner`

### Tarea 5.2: Feedback Visual de Fichaje
* **Descripción:** Conectar el escáner al endpoint de validación y mostrar pantallas limpias de ÉXITO (verde) o FRACASO (rojo) tras la lectura.
* **Rama:** `feat/ui-user-feedback`

---

## FASE 6: Analítica y Exportación (Día 10)

### Tarea 6.1: Dashboard y Gráficas de Asistencia
* **Descripción:** Integrar la librería `recharts` en React para mostrar en el Panel de Admin gráficas sobre el porcentaje de asistencia (fichajes diarios y formaciones).
* **Rama:** `feat/ui-admin-analytics`

### Tarea 6.2: Exportación de Reportes a CSV/Excel
* **Descripción:** Añadir endpoints en el backend y botones en el frontend para exportar todos los datos estructurados a formato Excel/CSV.
* **Rama:** `feat/export-reports`
