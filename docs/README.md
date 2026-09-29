# Portal de Documentación del Sistema — Distribution Academy

Centro de documentación técnica y de ingeniería de software para **Distribution Academy (Smart Check-in System)**.

Este repositorio de documentación sigue estándares internacionales de ingeniería de software (ISO/IEC/IEEE 12207 para el ciclo de vida del software, IEEE 830/29148 para especificación de requisitos, C4/4+1 para arquitectura, e ISO/IEC 29119 para procesos de pruebas), garantizando trazabilidad técnica desde las necesidades operativas hasta el despliegue en producción.

---

## Mapa de Navegación Documental

```text
docs/
├── 1. Requisitos y Negocio
│   ├── Analisis_Requisitos_Sistema.md       # Especificación completa de requisitos (SRS / URS)
│   └── task_breakdown.md                    # Desglose histórico de tareas, fases y ramas Git
│
├── 2. Arquitectura y Diseño
│   ├── SystemDesignDocument.md              # Documento formal de diseño (SDD, UML, Flujos)
│   ├── architecture_decisions.md            # Registro de Decisiones de Arquitectura (ADRs)
│   └── diagrams/                            # Especificaciones PlantUML en código
│
├── 3. Catálogo de APIs e Integración
│   └── API_DOCUMENTATION.md                 # Contratos REST, WebSockets STOMP, Auth y Rate Limits
│
├── 4. Seguridad, Ciberdefensa y Privacidad
│   ├── Threat_Modeling_STRIDE.md            # Análisis de vectores de ataque y amenazas STRIDE
│   ├── OWASP_ASVS_v4_Matrix.md              # Matriz de verificación de controles ASVS L2/L3
│   ├── DPIA_RGPD_Assessment.md              # Evaluación de Impacto de Protección de Datos (EIPD / DPIA)
│   └── RAT_Registro_Actividades_Tratamiento.md # Registro formal de Actividades de Tratamiento (Art. 30 RGPD)
│
├── 5. Calidad y Estrategia de Pruebas
│   ├── plan_de_pruebas.md                   # Plan maestro de pruebas (Unit, Integration, Concurrency)
│   └── e2e_testing_report.md                # Informe de ejecución de pruebas E2E con Playwright
│
├── 6. Módulos Avanzados y Capacidades Específicas
│   ├── advanced_audit_and_hr_reports.md     # Auditoría forense SHA-256, batch reporting y alertas
│   ├── pwa_push_notifications.md            # Arquitectura Web Push VAPID en Progressive Web App
│   └── onedrive_integration_report.md       # Integración con Microsoft Azure AD / OneDrive Graph API
│
└── 7. Operaciones e Infraestructura
    └── DEPLOYMENT_DOCKER_GUIDE.md           # Despliegue en producción con contenedores Docker y Cloud Run
```

---

## Índice Detallado por Disciplina

### 1. Requisitos y Análisis Funcional
* **[Análisis de Requisitos del Sistema (SRS)](Analisis_Requisitos_Sistema.md)**:
  Catálogo canónico de requisitos funcionales (RF) y no funcionales (RNF), actores del sistema, reglas de negocio para el control horario industrial, validación biométrica/TOTP y matriz de trazabilidad con controladores y vistas.
* **[Desglose de Tareas y Fases](task_breakdown.md)**:
  Estructura de descomposición del trabajo (WBS) en iteraciones cortas, convención de ramas (`feat/`, `fix/`, `chore/`) y seguimiento de entregas.

### 2. Arquitectura de Software y Diseño
* **[Documento de Diseño del Sistema (SDD)](SystemDesignDocument.md)**:
  Diseño técnico integral con diagramas de clases UML, jerarquía de entidades (`BaseEntity`, `User`, `Checkin`, `Formation`), diagramas de secuencia para el ciclo TOTP dinámico y descomposición en capas.
* **[Registro de Decisiones Arquitectónicas (ADRs)](architecture_decisions.md)**:
  Trazabilidad de decisiones críticas: migración a PostgreSQL 15, autenticación dual JWT/Passkeys, WebSockets STOMP frente a polling, arquitectura Serverless en Cloud Run y hashing SHA-256 en reportes.
* **[Diagramas en Código (PlantUML)](diagrams/LayersUMLPackageDiagram.iuml)**:
  Representación formal de dependencias entre capas `controller` -> `service` -> `repository`.

### 3. Catálogo de APIs y Comunicación
* **[Especificación de APIs y WebSockets](API_DOCUMENTATION.md)**:
  Referencia exhaustiva de endpoints REST, esquemas de autenticación (Bearer Token, 2FA, FIDO2/WebAuthn), canales reactivos STOMP (`/topic/totp-update`, `/topic/alerts`), códigos de estado HTTP y políticas de *Rate Limiting* con `Bucket4j`.

### 4. Seguridad, Gestión de Riesgos y Cumplimiento Normativo
* **[Modelado de Amenazas STRIDE](Threat_Modeling_STRIDE.md)**:
  Identificación sistemática de vectores de amenaza (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) y sus contramedidas implementadas en el código.
* **[Matriz OWASP ASVS v4.0](OWASP_ASVS_v4_Matrix.md)**:
  Validación frente al *Application Security Verification Standard* de OWASP en niveles L2 y L3 (gestión de sesiones, criptografía, validación de entradas, control de acceso).
* **[Evaluación de Impacto RGPD (DPIA / EIPD)](DPIA_RGPD_Assessment.md)**:
  Análisis de riesgos para los derechos y libertades en el tratamiento de datos de control horario, medidas de minimización y retención temporal de registros.
* **[Registro de Actividades de Tratamiento (RAT)](RAT_Registro_Actividades_Tratamiento.md)**:
  Inventario formal conforme al Artículo 30 del RGPD para las finalidades de fichaje, formación y auditoría laboral.

### 5. Calidad del Software y Pruebas
* **[Plan Maestro de Pruebas](plan_de_pruebas.md)**:
  Estrategia integral de validación multinivel: 57 clases de test backend (320 tests unitarios y de integración con MockMvc y H2), pruebas no funcionales de concurrencia y metamórficas, y testing de frontend con React Testing Library.
* **[Informe de Pruebas End-to-End (E2E)](e2e_testing_report.md)**:
  Resultados de la batería de pruebas de navegador con Playwright, cubriendo los flujos críticos de usuario (login, 2FA, fichaje con firma digital en canvas HTML5, QR fullscreen y gestión de personal).

### 6. Extensiones y Servicios Avanzados
* **[Auditoría Forense y Reportes Programados](advanced_audit_and_hr_reports.md)**:
  Generación de reportes ejecutivos en PDF mediante `OpenPDF` y `XChart`, encadenamiento de hash criptográfico SHA-256 para prevenir manipulación y automatización periódica con `Spring Batch` y `@Scheduled`.
* **[Notificaciones Web Push y Arquitectura VAPID](pwa_push_notifications.md)**:
  Protocolo de comunicación asíncrona mediante Service Workers nativos, curvas elípticas `prime256v1` para VAPID y entrega de alertas con el navegador en segundo plano.
* **[Integración Cloud con Microsoft OneDrive](onedrive_integration_report.md)**:
  Sincronización remota y almacenamiento seguro de backups y reportes a través de OAuth2 y Microsoft Graph API.

### 7. Infraestructura y Despliegue
* **[Guía de Despliegue Docker y Cloud](DEPLOYMENT_DOCKER_GUIDE.md)**:
  Manual operativo de despliegue en entornos Linux mediante Docker Compose multicontenedor (Frontend + Backend + PostgreSQL), configuración de certificados SSL y consideraciones para Serverless (Google Cloud Run / AWS).

---

## Trazabilidad e Integración Continua

Toda la documentación se mantiene sincronizada con el ciclo de vida del repositorio mediante comprobaciones automáticas de CI/CD:
- **Calidad de Código y Deuda Técnica:** SonarCloud Quality Gate.
- **Análisis Estático de Seguridad:** GitHub CodeQL.
- **Detección de Secretos:** GitLeaks y Dependabot.
- **Vulnerabilidades en Contenedores:** Trivy Container Scan.
