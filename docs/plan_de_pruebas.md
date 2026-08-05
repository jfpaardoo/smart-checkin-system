# Plan de Pruebas

**Nombre del proyecto:** BA Distribution Academy — Smart Check-in System

**Repositorio:** https://github.com/jfpaardoo/smart-checkin-system

**Integrantes:**
- Juan Felipe Pardo Carrillo

## Historial de versiones

| Fecha | Versión | Descripción de los cambios | Sprint |
|---|---|---|---|
| <!-- fecha --> | v1.0 | Redacción inicial del Plan de Pruebas a partir del análisis exhaustivo del repositorio (backend Spring Boot + frontend React), cubriendo pruebas unitarias, de integración y End-to-End. | <!-- sprint --> |

---

## 1. Introducción

Este documento describe el plan de pruebas para el proyecto **BA Distribution Academy — Smart Check-in System**. El sistema es una plataforma de control de asistencia para **BA Glass**, empresa fabricante de envases de vidrio con presencia en 7 países y más de 4.500 empleados, y da soporte a tres capacidades núcleo:

- **Fichaje seguro mediante QR dinámico (TOTP):** códigos de un solo uso que expiran cada 15-30 segundos, generados y validados en el backend, para evitar suplantaciones en los cambios de turno de planta.
- **Gestión de formaciones:** alta de jornadas formativas, registro de asistencia (por escaneo de QR + código personal) y checkout con firma digital capturada en un `<canvas>` HTML5.
- **Panel de administración:** CRUD de usuarios y formaciones, aprobación de altas, analítica de asistencia, exportación de informes (CSV/Excel/PDF/certificados) e integración con almacenamiento en la nube (OneDrive) y copias de seguridad de base de datos.

El objetivo de este plan es garantizar que la implementación cumple los requisitos funcionales del sistema (autenticación y roles, fichaje TOTP, formaciones, auditoría/anti-fraude, notificaciones push, exportación e integración cloud) mediante una estrategia de pruebas verificable, repetible y automatizada tanto en el **backend** (Spring Boot 3.5.5 / Java 21) como en el **frontend** (React 18, PWA).

El análisis directo del repositorio (código fuente en `src/main`, suite de pruebas en `src/test`, y suite E2E en `frontend/e2e`) evidencia una cobertura multinivel real:

- **Capa de API (Controladores):** pruebas `@WebMvcTest` + `MockMvc` que cubren 12 controladores REST (`AuthController`, `UserRestController`, `CheckinRestController`, `FormationRestController`, `TotpRestController`, `AnalyticsRestController`, `AuditController`, `ExportRestController`, `CertificateController`, `PushNotificationController`, `CloudSettingsRestController`, `RateLimitFilter`).
- **Capa de lógica de negocio (Servicios):** pruebas aisladas con Mockito sobre 14 clases de servicio (`UserService`, `CheckinService`, `TotpService`, `FormationService`, `AnomalyDetectionService`, `PdfReportGenerator`, `EmailService`, `OneDriveService`, `DatabaseBackupService`, `StatisticsScheduler`, `PushNotificationService`, `AuthoritiesService`, `CloudSettingsService`, `TotpBroadcastService`).
- **Seguridad transversal:** `JwtUtils`, `JwtBlacklistService`, `AuthTokenFilter`, `AuthEntryPointJwt`, `RateLimitFilter`, `UserDetailsServiceImpl`, cubriendo la generación/validación de tokens RSA/HMAC, la lista negra de tokens revocados y el *rate limiting* con `bucket4j`.
- **Pruebas no funcionales dedicadas:** pruebas de **concurrencia** (`ConcurrentCheckinConcurrencyTests`, fichajes simultáneos con `ExecutorService`/`CountDownLatch`) y pruebas **metamórficas** (`MetamorphicCheckinServiceTests`, invariantes sobre el cálculo de duración de turnos).
- **Frontend:** pruebas unitarias de componentes React con Jest + React Testing Library, y **7 suites End-to-End con Playwright** que validan los flujos críticos de usuario final sobre el navegador (registro, 2FA, aprobación admin, fichaje con firma, GDPR, gestión de formaciones y proyección de QR).

En total, la suite de pruebas documentada en el repositorio consta de **57 clases de test en el backend con 320 casos de prueba** (`@Test`/`@ParameterizedTest`), **2 suites de test unitario de componentes React con 5 casos**, y **7 especificaciones End-to-End de Playwright con 8 escenarios de usuario completos**, lo que arroja un total de **333 casos de prueba automatizados** sobre el sistema.

## 2. Alcance

El alcance de este plan de pruebas incluye:

- **Pruebas unitarias de backend:** validación aislada de controladores (capa web) y servicios (lógica de negocio), incluyendo la lógica criptográfica de generación/validación TOTP, el ciclo de vida de tokens JWT (emisión, blacklist, expiración), la detección de anomalías de acceso (`AnomalyDetectionService`), la generación de certificados PDF y la programación de tareas por lotes (`StatisticsScheduler`, Spring Batch).
- **Pruebas unitarias de frontend:** componentes React aislados (`AppNavbar`, `UserListAdmin`) usando **Jest** y **React Testing Library**, con mocking de red mediante **MSW** (`mocks/handlers.js`, `mocks/server.js`).
- **Pruebas de integración de backend:** ejecutadas con JUnit 5 y `MockMvc` contra los 12 controladores REST del sistema, verificando el flujo completo API → Servicio → Repositorio/JPA, la correcta aplicación de la seguridad (`@WithMockUser`, roles `ADMIN`/`EMPLOYEE`) y el formato de las respuestas JSON.
- **Pruebas de integración con contexto completo (`@SpringBootTest`):** pruebas que arrancan el contexto de Spring completo contra la base de datos en memoria **H2**, usadas para validar concurrencia real (`ConcurrentCheckinConcurrencyTests`), tareas programadas (`JwtBlacklistScheduledIntegrationTests`) y el arranque de la aplicación (`SmartcheckinApplicationTests`, `SmartcheckinInitializerTests`).
- **Pruebas End-to-End (E2E):** automatizadas con **Playwright** sobre Chromium, simulando la interacción real del navegador para los roles `EMPLOYEE` y `ADMIN`, con interceptación de red (`page.route()`) para garantizar determinismo sin depender del backend real.
- **Pruebas no funcionales:** concurrencia (condiciones de carrera en fichajes simultáneos) y pruebas metamórficas (invariantes de negocio).

Quedan fuera del alcance de este documento las pruebas de carga/rendimiento a gran escala y las pruebas de penetración de seguridad, si bien se documentan en el apartado 3 las medidas relacionadas con seguridad (JWT, *rate limiting*, auditoría) que sí están cubiertas por la suite actual.

## 3. Estrategia de Pruebas

### 3.1 Tipos de Pruebas

#### 3.1.1 Pruebas Unitarias de Backend

Siguiendo la arquitectura en capas del proyecto (`controller` → `service` → `repository`), las pruebas unitarias del backend se dividen en dos grandes bloques:

**Pruebas de Controladores (Capa Web):**
- **Objetivo:** verificar que la API REST responde correctamente a las peticiones HTTP, serializa/deserializa JSON correctamente y aplica las reglas de seguridad (roles `ADMIN`/`EMPLOYEE`) sin depender de la lógica de negocio real.
- **Implementación:** se utiliza `@WebMvcTest` para levantar un contexto de Spring MVC ligero centrado en la capa web, junto con `MockMvc` para simular peticiones `GET`/`POST`/`PUT`/`DELETE`. Las dependencias de servicio se sustituyen mediante `@MockBean` (p. ej. `AuditControllerTests`, `AnalyticsRestControllerTests`, `PushNotificationControllerTests`).
- **Ejemplo real:** `UserControllerTests.java` (30 casos) cubre desde el login y el registro hasta la aprobación de usuarios pendientes, el cambio de contraseña, la activación de 2FA y el borrado de cuentas (GDPR), verificando en cada caso el código de estado HTTP y, cuando aplica, la restricción por rol.
- **Ejemplo real:** `FormationRestControllerTests.java` (24 casos) valida la creación, edición, listado, checkout con firma y eliminación de formaciones, así como el control de acceso para operaciones administrativas.

**Pruebas de Servicios (Capa de Lógica de Negocio):**
- **Objetivo:** validar la lógica de negocio, los cálculos y la orquestación de llamadas a repositorios sin acoplarse al framework de Spring.
- **Implementación:** se prescinde de `@SpringBootTest` en favor de `@ExtendWith(MockitoExtension.class)`, instanciando manualmente el servicio bajo prueba (constructor manual o `ReflectionTestUtils` para inyectar dependencias/propiedades internas, como se observa en `OneDriveServiceTests.java`).
- **Dobles de prueba (Mockito):**
  - *Mocks*: para verificar interacciones, p. ej. comprobar con `verify()` que `CheckinService` invoca al repositorio tras un fichaje válido.
  - *Stubs*: mediante `when(...).thenReturn(...)` para forzar respuestas controladas de dependencias externas (`RestTemplate` en `OneDriveServiceTests`, `JavaMailSender` en `EmailServiceTests`).
  - *Spies/ReflectionTestUtils*: usados en servicios con estado interno o configuración inyectada por propiedades (`CloudSettingsService`, `TotpService`).
- **Aserciones:** `org.junit.jupiter.api.Assertions` (`assertEquals`, `assertTrue`, `assertThrows`) combinadas con matchers de Mockito (`ArgumentMatchers.any()`, `eq()`).
- **Ejemplo real:** `FormationServiceTests.java` (23 casos) y `UserServiceTests.java` (19 casos) concentran la mayor parte de la lógica de negocio validada de forma aislada.
- **Ejemplo real:** `AuditAspectTests.java` (20 casos) valida, mediante mocks de `JoinPoint`, `HttpServletRequest` y `SecurityContext`, que el aspecto de auditoría (AOP) registra correctamente cada operación sensible sin necesidad de levantar el contexto de Spring.

**Pruebas Unitarias de Interfaz de Usuario (Frontend):**
- **Objetivo:** verificar que los componentes React renderizan correctamente y responden a interacciones del usuario (clics, formularios) de forma aislada.
- **Implementación:** **Jest** (vía `react-scripts test`) + **React Testing Library** (`render`, `screen`, `userEvent`), con un `test-utils.jsx` propio que envuelve el `render` por defecto (proveedores de contexto, i18n, etc.) y utilidades como `testRenderList`. El mocking de red de estas pruebas se apoya en **MSW** (`src/mocks/handlers.js` y `src/mocks/server.js`), y los assets estáticos (imágenes, CSS) se sustituyen mediante `__mocks__/fileMock.js` y `__mocks__/styleMock.js` configurados en `jest.moduleNameMapper` del `package.json`.
- **Ejemplo real:** `AppNavbar.test.js` (2 casos) comprueba que los enlaces públicos (`Docs`, `BA Distribution Academy`) y el enlace de `Login` se renderizan correctamente cuando no hay sesión iniciada.
- **Ejemplo real:** `UserListAdmin.test.js` (3 casos) comprueba el renderizado de la tabla de usuarios, la correcta cardinalidad de botones de edición/borrado por fila, y el flujo de borrado de usuario (incluyendo el mockeo de `window.confirm` y la aparición de una alerta de confirmación accesible).

#### 3.1.2 Pruebas de Integración

Aunque en el apartado anterior las pruebas `@WebMvcTest` se describen por su enfoque en el controlador, constituyen también una forma de prueba de integración de la capa web, ya que verifican que el controlador se integra correctamente con Spring MVC, con `Spring Security` (filtros, roles) y con la serialización JSON, aunque la capa de servicio esté simulada.

Además, el repositorio incluye pruebas de integración con contexto completo:

- **`@SpringBootTest` con base de datos en memoria H2:** usadas cuando es necesario validar el comportamiento real de la persistencia JPA o la concurrencia entre componentes reales. Ejemplo: `ConcurrentCheckinConcurrencyTests.java`, anotada con `@SpringBootTest` y `@DirtiesContext`, que lanza fichajes concurrentes reales contra `CheckinService`, `UserService` y `AuthoritiesService` usando `ExecutorService`/`CountDownLatch`/`AtomicInteger` para comprobar que no se corrompe el estado de la base de datos ni se producen condiciones de carrera en cambios de turno con cientos de empleados fichando en el mismo instante.
- **`JwtBlacklistScheduledIntegrationTests.java`:** valida de extremo a extremo que la tarea programada de limpieza de tokens revocados (`JwtBlacklistService`) se ejecuta correctamente contra el repositorio real.
- **`SmartcheckinApplicationTests.java` / `SmartcheckinInitializerTests.java`:** pruebas de arranque que garantizan que el contexto de Spring Boot completo (incluyendo la carga de datos inicial `data.sql`) levanta sin errores.

#### 3.1.3 Pruebas No Funcionales

- **Pruebas de Concurrencia:** `ConcurrentCheckinConcurrencyTests.java` simula fichajes simultáneos de múltiples hilos sobre el mismo usuario/turno para detectar condiciones de carrera y garantizar la integridad de los datos de asistencia, un riesgo real dado el volumen de +4.500 empleados fichando en ventanas de tiempo muy estrechas en los cambios de turno.
- **Pruebas Metamórficas:** `MetamorphicCheckinServiceTests.java` comprueba invariantes de negocio (p. ej. que desplazar uniformemente las horas de entrada y salida de un fichaje no altera la duración total calculada del turno), una técnica útil cuando no existe un oráculo exacto para validar el resultado pero sí propiedades que deben conservarse.

#### 3.1.4 Pruebas End-to-End (Frontend E2E con Playwright)

Las pruebas E2E verifican la interacción real del usuario con el navegador (Chromium), interceptando y mockeando (`page.route()`) las respuestas del backend para asegurar un comportamiento **determinista y reproducible**, sin depender de la disponibilidad real del servidor ni de datos persistidos.

- **Configuración (`frontend/playwright.config.js`):** ejecución **secuencial** (`workers: 1`, `fullyParallel: false`) para evitar colisiones de estado entre pruebas que comparten `localStorage`/rutas interceptadas; `timeout` global de 60s y `expect.timeout` de 10s; capturas de pantalla solo en fallo (`screenshot: 'only-on-failure'`) y trazas en el primer reintento (`trace: 'on-first-retry'`); arranque contra un servidor de desarrollo React ya iniciado (`webServer.reuseExistingServer: true`, `npm start`).
- **Técnica de simulación de sesión:** inyección de un JWT válido en `localStorage` mediante `page.addInitScript()` antes de cada navegación, evitando así tener que pasar por el flujo de login real en cada test.
- **Las 7 especificaciones E2E documentadas cubren:**
  1. **`auth-registration.spec.js`** — Autorregistro público de empleados (2 casos: envío exitoso y validación de contraseñas no coincidentes).
  2. **`2fa-flow.spec.js`** — Configuración y activación de 2FA/TOTP desde el perfil del empleado (escaneo/visualización de QR y secreto, validación de código de 6 dígitos).
  3. **`admin-approval.spec.js`** — Aprobación de solicitudes de registro pendientes por parte de un `ADMIN`.
  4. **`checkin-signature-flow.spec.js`** — Fichaje manual por código de 4-6 dígitos y captura de firma digital sobre `<canvas>` HTML5 mediante simulación de trazos de ratón, para fichajes de tipo `SALIDA`.
  5. **`admin-formations-flow.spec.js`** — Gestión de formaciones por parte del administrador (creación vía `POST` y consulta del listado).
  6. **`gdpr-deletion-flow.spec.js`** — Ejercicio del derecho al olvido (GDPR): eliminación de cuenta propia e invalidación inmediata de la sesión (blacklist del JWT y logout forzado).
  7. **`qr-generator-flow.spec.js`** — Proyección del código QR dinámico TOTP en la vista de supervisor de turno y verificación de la interfaz de escaneo en tiempo real.

Cabe destacar que el propio repositorio documenta en `docs/e2e_testing_report.md` un caso real de *debugging* post-mortem sobre dos de estas suites (`2fa-flow.spec.js` y `admin-approval.spec.js`), que fallaban por un bucle infinito de peticiones `fetch` ejecutado fuera de un `useEffect` en `PrivateRoute`, combinado con una comparación estricta (`isValid === true`) incompatible con el objeto JSON devuelto por el mock. La corrección (encapsular el `fetch` en `useEffect` con bandera de cancelación, y ajustar los mocks para devolver el booleano primitivo) es un ejemplo real de cómo la suite E2E permitió detectar un defecto de arquitectura en el frontend que las pruebas unitarias, al no ejecutar el ciclo de vida completo del componente en el navegador, no habían detectado.

## 4. Herramientas y Entorno de Pruebas

### 4.1 Herramientas

| Herramienta | Uso en el proyecto |
|---|---|
| **Maven** (`mvnw`) | Gestión de dependencias y ejecución de la suite de pruebas del backend. |
| **JUnit 5** (`spring-boot-starter-test`, excluyendo `junit-vintage-engine`) | Framework de pruebas unitarias y de integración del backend. |
| **Mockito** (incluido en `spring-boot-starter-test`) | Creación de dobles de prueba (mocks, stubs) para aislar servicios y controladores. |
| **Spring Security Test** | Simulación de usuarios autenticados y roles (`ADMIN`/`EMPLOYEE`) en pruebas `@WebMvcTest`. |
| **JaCoCo** (v0.8.13) | Generación de informes de cobertura de código. El `jacoco-maven-plugin` está configurado con los *goals* `prepare-agent` y `report` en la fase `prepare-package`; el `maven-resources-plugin` copia automáticamente el `jacoco.xml` resultante a la carpeta `/coverage` del repositorio en cada `mvn install`. |
| **Allure** (`allure-junit5` v2.29.1, `allure-maven` v2.15.2) | El proyecto incluye la dependencia y el plugin de Allure configurados para generar, en la fase `verify`, un informe único (`singleFile=true`) en `target/site/test-status`, pensado como base para la trazabilidad de pruebas por módulo/épica. |
| **Pitest** (`pitest-maven` v1.15.0 + `pitest-junit5-plugin`) | Plugin de **mutation testing** declarado en el `pom.xml`, disponible para reforzar la calidad de los asserts de la suite más allá de la cobertura de líneas. |
| **H2 Database** | Base de datos en memoria usada durante la ejecución de la suite de pruebas del backend, evitando dependencias externas y garantizando tests reproducibles. |
| **Jest** (vía `react-scripts test`) | Framework de pruebas unitarias en JavaScript para el frontend. |
| **React Testing Library** (`@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`) | Librería para pruebas de componentes React centradas en el comportamiento observable por el usuario. |
| **MSW (Mock Service Worker)** | Interceptación de peticiones de red en las pruebas unitarias de frontend (`src/mocks/handlers.js`, `src/mocks/server.js`). |
| **Playwright** (`@playwright/test` v1.62.1) | Framework de automatización E2E sobre navegador (proyecto `chromium`), configurado en `frontend/playwright.config.js`. Genera un reporte HTML interactivo en `frontend/playwright-report/index.html`. |
| **SonarCloud** (`.github/workflows/sonarcloud.yml`) | Análisis estático de código y detección de vulnerabilidades, ejecutado automáticamente en cada `push`/`pull_request` a `main`/`master` mediante GitHub Actions (JDK 21, `mvn verify sonar:sonar`). |

### 4.2 Entorno de Pruebas

El desarrollo se realiza sobre **Visual Studio Code**, con **Git**/**GitHub** para el control de versiones y la resolución de conflictos en equipo.

El entorno de **Integración Continua** corresponde a **GitHub Actions** (`sonarcloud.yml`), donde el proyecto se compila (`mvn -B verify`) y se analiza en un runner `ubuntu-latest` aislado con JDK 21 (distribución Zulu), tras cada `push` o `pull_request`, deteniendo el flujo si la compilación o las pruebas fallan.

La suite de backend se ejecuta contra la base de datos en memoria **H2**, mientras que en despliegue (`Dockerfile`, `docker-compose.yml`) el sistema usa **PostgreSQL**, tal y como confirma la dependencia `postgresql` declarada con `scope=runtime` en el `pom.xml`. El proyecto además define una imagen Docker multi-stage (`maven:3.9.9-eclipse-temurin-21` → `eclipse-temurin:21-jre-alpine`) con *healthcheck* sobre `/actuator/health`.

Para ejecutar la suite completa de tests del backend:
```
./mvnw test
```

Para generar el informe de cobertura JaCoCo:
```
mvn clean test
mvn jacoco:report
# informe disponible en target/site/jacoco/index.html
# copia automática (mvn install) en /coverage/jacoco.xml
```

Para las pruebas de frontend:
```
npm test                # Jest en modo watch
npm run coverage        # Jest con --coverage
npm run test:e2e        # Playwright test --test-dir=e2e
```

## 5. Planificación de Pruebas

### 5.1 Estado y Trazabilidad de Pruebas por Módulo y Épica (Backend)

El siguiente desglose se ha construido analizando directamente el árbol `src/test/java/org/springframework/samples/smartcheckin/` del repositorio y contando las anotaciones `@Test`/`@ParameterizedTest` presentes en cada clase, agrupadas por el paquete/épica funcional al que pertenecen. Todos los casos listados están **implementados**; la infraestructura de Allure (`allure-junit5`) está declarada en el `pom.xml` y lista para anotar progresivamente las clases con `@Epic`/`@Feature`/`@Story` y así generar automáticamente esta misma trazabilidad en `target/site/test-status`.

| Épica | Módulo / Clase de Test | Nº de Casos |
|---|---|---|
| **Autenticación y Seguridad** | `AuthControllerTests` | 14 |
| Autenticación y Seguridad | `JwtUtilsTests` | 8 |
| Autenticación y Seguridad | `JwtBlacklistServiceTests` | 7 |
| Autenticación y Seguridad | `AuthTokenFilterTests` | 4 |
| Autenticación y Seguridad | `GenericIdToEntityConverterTests` | 5 |
| Autenticación y Seguridad | `RateLimitFilterTests` | 2 |
| Autenticación y Seguridad | `ExceptionHandlerControllerTests` | 4 |
| Autenticación y Seguridad | `AccessDeniedExceptionTests` | 2 |
| Autenticación y Seguridad | `UserDetailsServiceImplTests` | 3 |
| Autenticación y Seguridad | `UserDetailsImplTests` | 1 |
| Autenticación y Seguridad | `JwtBlacklistScheduledIntegrationTests` (integración) | 1 |
| Autenticación y Seguridad | `AuthEntryPointJwtTests` | 1 |
| Autenticación y Seguridad | `WebConfigTests` | 1 |
| Autenticación y Seguridad | `ExceptionHandlerConfigurationTests` | 1 |
| **Subtotal Autenticación y Seguridad** | | **54** |
| **Fichajes y TOTP** | `CheckinRestControllerTests` | 8 |
| Fichajes y TOTP | `TotpServiceTests` | 6 |
| Fichajes y TOTP | `TotpBroadcastServiceTests` | 4 |
| Fichajes y TOTP | `CheckinServiceTests` | 2 |
| Fichajes y TOTP | `TotpRestControllerTests` | 2 |
| Fichajes y TOTP | `ConcurrentCheckinConcurrencyTests` (concurrencia) | 1 |
| Fichajes y TOTP | `MetamorphicCheckinServiceTests` (metamórfica) | 1 |
| **Subtotal Fichajes y TOTP** | | **24** |
| **Gestión de Formaciones** | `FormationRestControllerTests` | 24 |
| Gestión de Formaciones | `FormationServiceTests` | 23 |
| Gestión de Formaciones | `FormationValidationTests` | 3 |
| **Subtotal Gestión de Formaciones** | | **50** |
| **Gestión de Usuarios** | `UserControllerTests` | 30 |
| Gestión de Usuarios | `UserServiceTests` | 19 |
| Gestión de Usuarios | `AuthoritiesServiceTests` | 4 |
| Gestión de Usuarios | `UserEntityTests` | 3 |
| Gestión de Usuarios | `UserValidationTests` | 3 |
| **Subtotal Gestión de Usuarios** | | **59** |
| **Auditoría y Detección de Anomalías** | `AuditAspectTests` | 20 |
| Auditoría y Detección de Anomalías | `LoginFailureListenerTests` | 3 |
| Auditoría y Detección de Anomalías | `AuditControllerTests` | 3 |
| Auditoría y Detección de Anomalías | `AnomalyDetectionServiceTests` | 2 |
| **Subtotal Auditoría** | | **28** |
| **Exportación e Informes** | `ExportRestControllerTests` | 10 |
| Exportación e Informes | `PdfReportGeneratorTests` | 5 |
| Exportación e Informes | `CertificateControllerTests` | 4 |
| Exportación e Informes | `EmailServiceTests` | 4 |
| Exportación e Informes | `CertificateGeneratorServiceTests` | 3 |
| **Subtotal Exportación** | | **26** |
| **Integración Cloud y Backups** | `OneDriveServiceTests` | 17 |
| Integración Cloud y Backups | `CloudSettingsRestControllerTests` | 5 |
| Integración Cloud y Backups | `CloudSettingsServiceTests` | 5 |
| Integración Cloud y Backups | `DatabaseBackupServiceTests` | 1 |
| **Subtotal Integración Cloud** | | **28** |
| **Analítica y Estadísticas** | `AnalyticsRestControllerTests` | 7 |
| Analítica y Estadísticas | `StatisticsSchedulerTests` | 4 |
| Analítica y Estadísticas | `AnalyticsServiceTests` | 4 |
| Analítica y Estadísticas | `StatisticsBatchConfigTests` | 2 |
| **Subtotal Analítica** | | **17** |
| **Notificaciones Push y Tiempo Real** | `PushNotificationServiceTests` | 8 |
| Notificaciones Push y Tiempo Real | `PushNotificationControllerTests` | 6 |
| **Subtotal Push** | | **14** |
| **Modelo y Validación (SpEL)** | `SpelConstraintValidatorTests` | 5 |
| Modelo y Validación | `ModelTests` | 3 |
| Modelo y Validación | `ValidatorTests` | 1 |
| **Subtotal Modelo y Validación** | | **9** |
| **Utilidades y Framework Transversal** | `CallMonitoringAspectTests` | 3 |
| Utilidades y Framework Transversal | `RestPreconditionsTests` | 3 |
| Utilidades y Framework Transversal | `EntityUtilsTests` | 2 |
| **Subtotal Utilidades** | | **8** |
| **Arranque de la Aplicación** | `SmartcheckinApplicationTests` | 2 |
| Arranque de la Aplicación | `SmartcheckinInitializerTests` | 1 |
| **Subtotal Arranque** | | **3** |
| **TOTAL BACKEND** | **57 clases de test** | **320** |

### 5.2 Estado y Trazabilidad de Pruebas Unitarias de Frontend (Jest)

| Componente | Clase de Test | Casos Implementados | Descripción |
|---|---|---|---|
| Navegación | `AppNavbar.test.js` | 2 | Renderizado de enlaces públicos (`Docs`, nombre de la app) y del enlace `Login` cuando no hay sesión iniciada. |
| Panel Admin — Usuarios | `UserListAdmin.test.js` | 3 | Renderizado de la lista/tabla de usuarios, cardinalidad correcta de botones de edición/borrado por fila, y flujo completo de eliminación de usuario con confirmación accesible (`role="alert"`). |
| **TOTAL FRONTEND (Jest)** | **2 suites** | **5** | |

### 5.3 Estado y Trazabilidad de Pruebas End-to-End (Playwright)

| Épica / Flujo | Archivo Playwright | Rol Simulado | Vista Probada | Casos | Estado |
|---|---|---|---|---|---|
| Autorregistro Público | `auth-registration.spec.js` | Anónimo | `/register` | 2 | Implementada |
| Seguridad 2FA / TOTP | `2fa-flow.spec.js` | `EMPLOYEE` | `/profile` (pestaña Seguridad) | 1 | Implementada |
| Aprobación de Administración | `admin-approval.spec.js` | `ADMIN` | `/users` (pestaña Pendientes) | 1 | Implementada |
| Fichaje Manual y Firma | `checkin-signature-flow.spec.js` | `EMPLOYEE` | `/checkin` | 1 | Implementada |
| Gestión de Formaciones | `admin-formations-flow.spec.js` | `ADMIN` | `/formations` | 1 | Implementada |
| Derecho al Olvido (GDPR) | `gdpr-deletion-flow.spec.js` | `EMPLOYEE` | `/profile` (Privacidad) | 1 | Implementada |
| Proyección de QR (Quiosco) | `qr-generator-flow.spec.js` | `ADMIN` | `/qr-generator` | 1 | Implementada |
| **TOTAL E2E (Playwright)** | **7 especificaciones** | | | **8** | |

### 5.4 Resumen Global de la Suite de Pruebas

| Nivel | Nº de Archivos de Test | Nº de Casos de Prueba |
|---|---|---|
| Backend — Unitarias e Integración (JUnit 5) | 57 | 320 |
| Frontend — Unitarias de componentes (Jest) | 2 | 5 |
| Frontend — End-to-End (Playwright) | 7 | 8 |
| **TOTAL** | **66** | **333** |

### 5.5 Cobertura de Pruebas

La cobertura de pruebas representa el porcentaje del código fuente ejercitado por la suite de tests, y se mide en cuatro dimensiones: clases, métodos, líneas y ramas de decisión.

- **Backend:** la herramienta de medición es **JaCoCo** (v0.8.13), integrada en el ciclo de construcción Maven. La ejecución de `mvn clean test` seguida de `mvn jacoco:report` genera el informe HTML en `target/site/jacoco/index.html`; adicionalmente, el `maven-resources-plugin` copia automáticamente el fichero `jacoco.xml` a la carpeta `/coverage` del propio repositorio en cada `mvn install`, dejando el histórico versionado junto al código.
- **Backend (robustez de los asserts):** el proyecto declara además el plugin **Pitest** (`pitest-maven` + `pitest-junit5-plugin`) en el `pom.xml`, orientado a *mutation testing*: mide no solo qué líneas se ejecutan, sino si los asserts de la suite son capaces de detectar mutaciones (defectos inyectados) en el código de producción, una validación de calidad más exigente que la cobertura de líneas.
- **Frontend:** `npm run coverage` ejecuta `react-scripts test --coverage`, excluyendo explícitamente del cálculo los ficheros de arranque no testeables de forma unitaria (`index.js`, `reportWebVitals.js`, `error-page.jsx`, `App.js`).
- **E2E:** Playwright no mide cobertura de código por defecto, pero el `playwright-report/index.html` generado tras `npm run test:e2e` documenta de forma trazable qué flujos de usuario han sido verificados y su resultado paso a paso (incluyendo capturas en caso de fallo).

> **Nota:** dado que la ejecución de la suite completa (`mvn test` + `npm test` + `npm run test:e2e`) requiere un entorno con acceso a los repositorios de Maven Central y npm y a un navegador Chromium instalado, los porcentajes exactos de cobertura (líneas/ramas/clases) deben obtenerse ejecutando los comandos anteriores en el entorno de desarrollo o en el pipeline de CI del propio repositorio (`.github/workflows/sonarcloud.yml`), y consultando el informe HTML resultante en `target/site/jacoco/index.html` o el fichero versionado en `/coverage/jacoco.xml`. Los recuentos de **casos de prueba** de este documento (apartados 5.1 a 5.4), por el contrario, están verificados de forma exacta a partir del código fuente real del repositorio.

### 5.6 Matriz de Trazabilidad entre Funcionalidades y Suite de Pruebas

A partir del desglose de fases funcionales documentado en `docs/task_breakdown.md`, se establece la siguiente trazabilidad entre las capacidades del sistema y los paquetes de test que las validan:

| Funcionalidad | Paquetes / Clases Asociadas | Cobertura de Test |
|---|---|---|
| Dominio de Usuario y Autenticación (JWT, roles ADMIN/EMPLOYEE) | `auth`, `configuration.jwt`, `configuration.services`, `user` | `AuthControllerTests`, `JwtUtilsTests`, `JwtBlacklistServiceTests`, `AuthTokenFilterTests`, `UserControllerTests`, `UserServiceTests`, `AuthoritiesServiceTests` |
| Dominio de Fichajes (Check-ins) y TOTP dinámico | `checkin`, `totp` | `CheckinRestControllerTests`, `CheckinServiceTests`, `TotpServiceTests`, `TotpRestControllerTests`, `TotpBroadcastServiceTests`, `ConcurrentCheckinConcurrencyTests`, `MetamorphicCheckinServiceTests` |
| Dominio de Formaciones y asistencia | `formation` | `FormationRestControllerTests`, `FormationServiceTests`, `FormationValidationTests` |
| Interfaz de administración: CRUD usuarios/formaciones, aprobación de altas | `user`, `formation` (controladores) | `UserControllerTests`, `FormationRestControllerTests` |
| Generador de QR en tiempo real (WebSocket) | `totp` | `TotpBroadcastServiceTests`, `TotpRestControllerTests`; flujo E2E `qr-generator-flow.spec.js` |
| Portal de empleado: escáner QR y feedback de fichaje | Frontend (`user/checkin`) | E2E `checkin-signature-flow.spec.js` |
| Firma digital de checkout | Frontend (`user/checkin/components/SignatureStep.js`) | E2E `checkin-signature-flow.spec.js` |
| Dashboard y gráficas de asistencia / analítica | `analytics`, `statistics` | `AnalyticsRestControllerTests`, `AnalyticsServiceTests`, `StatisticsSchedulerTests`, `StatisticsBatchConfigTests` |
| Exportación de reportes (CSV/Excel/PDF/certificados) | `exports` | `ExportRestControllerTests`, `PdfReportGeneratorTests`, `CertificateControllerTests`, `CertificateGeneratorServiceTests`, `EmailServiceTests` |
| Auditoría y detección de anomalías de acceso | `audit` | `AuditAspectTests`, `AuditControllerTests`, `AnomalyDetectionServiceTests`, `LoginFailureListenerTests` |
| Notificaciones push en tiempo real | `push` | `PushNotificationServiceTests`, `PushNotificationControllerTests` |
| Integración con OneDrive / backups de BD | `settings` | `OneDriveServiceTests`, `CloudSettingsServiceTests`, `CloudSettingsRestControllerTests`, `DatabaseBackupServiceTests` |
| Autorregistro público de empleados | `auth` (controlador) | `AuthControllerTests`; flujo E2E `auth-registration.spec.js` |
| Autenticación en dos factores (2FA) | `user` (endpoints 2FA) | `UserControllerTests`; flujo E2E `2fa-flow.spec.js` |
| Aprobación de registros por administrador | `user` (endpoints de aprobación) | `UserControllerTests`; flujo E2E `admin-approval.spec.js` |
| Derecho al olvido (GDPR) | `user` (borrado de cuenta), `configuration.jwt` (blacklist) | `UserControllerTests`, `JwtBlacklistServiceTests`; flujo E2E `gdpr-deletion-flow.spec.js` |
| Rate limiting y protección anti-fraude en endpoints críticos | `configuration` (`RateLimitFilter`) | `RateLimitFilterTests` |
| Validaciones declarativas basadas en SpEL | `validation.spel` | `SpelConstraintValidatorTests` |
| Modelo de dominio base (`BaseEntity`, `NamedEntity`, `Person`) | `model` | `ModelTests`, `ValidatorTests` |
| Aspectos transversales de monitorización | `util` | `CallMonitoringAspectTests`, `RestPreconditionsTests`, `EntityUtilsTests` |
| Arranque e inicialización de datos de demostración | paquete raíz | `SmartcheckinApplicationTests`, `SmartcheckinInitializerTests` |

## 6. Criterios de Aceptación

- El **100%** de las pruebas unitarias y de integración del backend (`./mvnw test`, 320 casos sobre 57 clases) deben pasar con éxito antes de la entrega del proyecto.
- El **100%** de las pruebas unitarias de frontend (`npm test`, 5 casos) deben completarse sin errores.
- El **100%** de las pruebas End-to-End en Playwright (`npm run test:e2e`, 8 escenarios sobre 7 especificaciones) deben completarse exitosamente en el navegador Chromium simulado.
- La cobertura de código medida por JaCoCo debe ser, como mínimo, del **70%** en líneas para los paquetes de lógica de negocio y controladores críticos (`checkin`, `totp`, `formation`, `user`, `auth`, `audit`), verificable en `target/site/jacoco/index.html` tras ejecutar `mvn jacoco:report`.
- El análisis estático de **SonarCloud** ejecutado en cada `push`/`pull_request` no debe reportar vulnerabilidades de seguridad (`Vulnerabilities = 0`) ni *bugs* de severidad alta o crítica.
- Las pruebas de concurrencia (`ConcurrentCheckinConcurrencyTests`) no deben evidenciar corrupción de datos, *deadlocks* ni condiciones de carrera en fichajes simultáneos.
- No debe haber fallos críticos que impidan los flujos de negocio esenciales: fichaje TOTP, gestión de formaciones, autenticación/autorización y exportación de informes.

## 7. Conclusión

Este plan de pruebas establece la estructura, el inventario real y los criterios necesarios para garantizar la calidad de **BA Distribution Academy — Smart Check-in System**. El análisis directo del repositorio confirma una arquitectura de validación multinivel y consistente con las buenas prácticas de la asignatura: aislamiento de dependencias mediante Mockito en el backend, pruebas de integración de la capa web con `MockMvc`, pruebas de contexto completo (`@SpringBootTest`) para los escenarios que lo requieren (concurrencia, tareas programadas), y una suite End-to-End con Playwright que valida los flujos críticos desde la perspectiva real del usuario en el navegador, incluyendo la interacción con elementos avanzados como la firma digital sobre `<canvas>`. Con **333 casos de prueba** distribuidos entre backend, frontend unitario y E2E, y con infraestructura ya preparada para *mutation testing* (Pitest) y trazabilidad automatizada (Allure), el equipo dispone de una base sólida sobre la que seguir ampliando la cobertura a medida que evolucione el sistema. Es responsabilidad del equipo de desarrollo mantener este plan actualizado, completar la anotación Allure (`@Epic`/`@Feature`/`@Story`) para automatizar por completo la trazabilidad del apartado 5.1, y ejecutar los comandos de cobertura descritos en el apartado 5.5 antes de cada entrega para documentar los porcentajes reales alcanzados.
