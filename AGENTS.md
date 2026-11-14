# Agent Guide — Distribution Academy (Smart Check-in System)

Bienvenido/a al repositorio de **Distribution Academy — Smart Check-in System**.  
Este documento actúa como la guía operativa y de contexto técnico principal para agentes de inteligencia artificial y desarrolladores que colaboren en el mantenimiento, evolución y aseguramiento de la calidad de este proyecto.

---

## 1. Visión General del Proyecto

**Distribution Academy (Smart Check-in System)** es una plataforma empresarial orientada a entornos industriales, logísticos y corporativos de alta concurrencia. Su objetivo es:
- **Control de Asistencia Anti-Fraude:** Erradicación del *buddy punching* mediante códigos QR efímeros y dinámicos basados en algoritmos criptográficos TOTP (caducidad configurable de 15–30 segundos).
- **Gestión Integral del Ciclo Formativo:** Convocatorias de cursos, asignación de instructores, control de aforo, control de asistencia en tiempo real y emisión de certificados.
- **Trazabilidad y Cumplimiento Normativo (RGPD / ASVS L3):** Firma digital en canvas HTML5 para confirmación de horas, exportaciones de auditoría inmutables selladas con hashes criptográficos SHA-256, y flujos de supresión de datos conforme al derecho al olvido.
- **PWA de Planta:** Aplicación web progresiva con dock de navegación *Liquid Glass*, capacidad de sincronización offline con cola IndexedDB y soporte háptico/sonoro.

---

## 2. Stack Tecnológico

| Capa / Dominio | Tecnologías Principales |
|---|---|
| **Backend** | Java 21, Spring Boot 3.5.16, Spring Security 6.5.11, Spring Data JPA / Hibernate, MapStruct 1.6.3, Lombok 1.18.46 |
| **Bases de Datos** | PostgreSQL 15 (producción / Docker), H2 Database (entornos de pruebas) |
| **Frontend** | React 18, Tailwind CSS, Framer Motion, HTML5-QRCode, HTML5 Canvas (Firma digital), Axios, STOMP/WebSocket (`@stomp/stompjs`) |
| **Internacionalización** | `react-i18next` con soporte para 8 idiomas oficiales (`es`, `en`, `fr`, `de`, `pt`, `pl`, `ro`, `bg`) |
| **Testing Backend** | JUnit 5, Mockito, Spring Test (`@WebMvcTest`, `@SpringBootTest`), JaCoCo, Pitest (mutaciones), Allure Report |
| **Testing Frontend** | Jest, React Testing Library, Playwright (E2E) |
| **Seguridad & Calidad** | OWASP ASVS v4.0 Nivel 3, SonarCloud / SonarQube, CodeQL, GitLeaks, Trivy |
| **Infraestructura** | Docker, Docker Compose, Nginx (reverse proxy en producción), GitHub Actions (CI/CD) |

---

## 3. Estructura del Repositorio

```text
smart-checkin-system/
├── .github/                      # Canalizaciones de CI/CD (auto-release, tests, linters, seguridad)
├── docs/                         # Documentación técnica, matrices ASVS, RGPD, STRIDE y diagramas
├── frontend/                     # Aplicación React 18 PWA
│   ├── e2e/                      # Suites de pruebas E2E con Playwright
│   ├── public/                   # Recursos estáticos, manifest PWA, version.json y locales i18n
│   │   └── locales/              # Archivos de traducción JSON por código de idioma
│   └── src/
│       ├── components/           # Componentes UI reutilizables (BottomTabBar, Toast, QR, etc.)
│       ├── context/              # Proveedores de contexto (AuthContext, WebSocketProvider, etc.)
│       ├── home/                 # Hubs de inicio por rol (EmployeeTrainingHub, StaffSupervisionHub)
│       ├── services/             # Clientes de API HTTP y utilidades de cola offline (offlineQueue.js)
│       └── utils/                # Funciones de utilidad pura (formateo de fechas, localISO, etc.)
├── src/main/java/org/springframework/samples/smartcheckin/
│   ├── configuration/            # Seguridad (Spring Security 6), CORS, WebSockets, OpenAPI
│   ├── controller/               # Controladores REST organizados por dominio
│   ├── dto/                      # Data Transfer Objects y payloads de validación
│   ├── model/                    # Entidades JPA (User, Formation, CheckIn, Attendance, etc.)
│   ├── repository/               # Repositorios JPA y consultas JPQL optimizadas
│   ├── service/                  # Lógica de negocio y transaccionalidad (@Transactional)
│   └── util/                     # Criptografía TOTP, generadores QR, sellado hash
├── src/test/java/...             # Pruebas unitarias, de integración y arquitectura (ArchUnit)
├── CHANGELOG.md                  # Registro formal de cambios (Keep a Changelog + SemVer)
├── CONTRIBUTING.md               # Normas de contribución y convenciones
├── docker-compose.yml            # Orquestación de servicios locales (App + DB)
├── pom.xml                       # Descriptor Maven del proyecto backend
└── README.md                     # Documento principal del repositorio
```

---

## 4. Comandos Frecuentes y Flujos de Verificación

### Backend (Maven Wrapper)
```bash
# Compilar y ejecutar suite completa de pruebas unitarias y de integración
./mvnw clean test

# Ejecutar la aplicación Spring Boot en desarrollo local
./mvnw spring-boot:run

# Generar informe de cobertura JaCoCo
./mvnw jacoco:report

# Ejecutar análisis de pruebas de mutación (Pitest)
./mvnw pitest:mutationCoverage
```

### Frontend (npm)
```bash
cd frontend

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (puerto 3000 con proxy a :8080)
npm start

# Ejecutar pruebas unitarias (React Testing Library)
npm test -- --watchAll=false

# Ejecutar pruebas End-to-End con Playwright
npm run test:e2e
```

### Entorno Contenedorizado (Docker Compose)
```bash
# Levantar stack completo con base de datos PostgreSQL
docker-compose up -d --build

# Detener contenedores
docker-compose down
```
> **Nota de Puerto:** La variable `${POSTGRES_PORT:5432}` permite configurar puertos alternativos (p. ej. `15432`) mediante `.env`.

---

## 5. Reglas de Codificación y Estándares para Agentes

Al realizar cualquier intervención en el código base, los agentes de IA **DEBEN** adherirse a los siguientes estándares:

### 5.1 Backend (Java / Spring Boot)
1. **Aislamiento Estricto de Capas:**
   - **`Controller`:** Responsable exclusivamente de recibir la petición HTTP, validar payloads con `@Valid`, verificar autorizaciones y retornar `ResponseEntity`. Nunca alojar lógica de negocio compleja ni consultas JPA directas.
   - **`Service`:** Lógica pura de negocio encapsulada con límites transaccionales definidos (`@Transactional` para operaciones de escritura, `@Transactional(readOnly = true)` para lecturas).
   - **`Repository`:** Consultas JPA / JPQL optimizadas. Priorizar agregaciones directas en base de datos (`countActiveEmployees()`, proyecciones) sobre iteraciones en memoria de colecciones completas (`findAll()`).
2. **Complejidad Cognitiva y SonarQube:**
   - Mantener la complejidad cognitiva de métodos estrictamente por debajo de **15**.
   - Evitar ternarios anidados (`java:S3358`).
   - Fusionar condicionales idénticos o redundantes (`java:S1066`).
3. **Seguridad Defensiva y Protección de Datos:**
   - **Prohibido registrar información sensible:** Nunca registrar contraseñas, tokens JWT, secretos TOTP/2FA o datos personales identificables (PII) en los logs (`LOGGER.info/debug`).
   - **Inyección de Secretos:** Utilizar variables de entorno inyectadas (`@Value("${...}")`), nunca valores por defecto inseguros ni credenciales en código.
   - **Control de Acceso Basado en Roles:** Validar estrictamente los roles (`ADMIN`, `HR_MANAGER`, `EMPLOYEE`) mediante anotaciones `@PreAuthorize("hasAuthority('...')")` tanto en endpoints de consulta como de mutación.

### 5.2 Frontend (React 18 / PWA)
1. **Componentes y Hooks:**
   - Utilizar componentes funcionales limpios con Hooks de React (`useState`, `useEffect`, `useCallback`, `useMemo`).
   - Evitar renderizados innecesarios memoizando callbacks pasados como props a componentes hijos.
2. **Internacionalización Obligatoria (i18n):**
   - **Jamás escribir texto visible directamente en JSX.** Todo texto debe usar la función `t('clave.subclave')` de `useTranslation()`.
   - Al agregar o modificar una clave, sincronizarla en los **8 archivos de traducción oficiales** en `frontend/public/locales/{es,en,fr,de,pt,pl,ro,bg}/translation.json`.
3. **PWA y Manejo de Tiempo Offline:**
   - Para registros y lotes offline (`offlineQueue.js`), utilizar la utilidad `formatLocalISO` (`YYYY-MM-DDTHH:mm:ss`) para preservar la hora local real del dispositivo y evitar desajustes provocados por conversiones UTC incorrectas.
4. **Diseño y Estilos:**
   - Utilizar utilidades Tailwind CSS consistentes con la estética *Liquid Glass* (soporte adaptativo para modo claro y oscuro, `backdrop-blur`, transiciones con aceleración por hardware).

---

## 6. Convenciones de Git, Ramas y Versionado

### 6.1 Convención de Ramas
- Rama principal protegida: `main`.
- Ramas de versión / lanzamiento: `feat/vX.Y.Z` (ejemplo: `feat/v1.4.2`).
- Ramas de funcionalidades o correcciones:
  - `feat/<nombre-en-kebab-case>`
  - `fix/<nombre-en-kebab-case>`
  - `refactor/<nombre-en-kebab-case>`
  - `test/<nombre-en-kebab-case>`
  - `chore/<nombre-en-kebab-case>`

### 6.2 Convención de Commits (Conventional Commits v1.0.0)
Todos los commits deben seguir el formato:
```text
<tipo>[ámbito opcional]: <descripción concisa en imperativo>

[cuerpo explicativo opcional]

[pie de commit opcional]
```
*Ejemplos:*
- `feat(release): v1.4.2 - Implement agent operational guide and version baseline`
- `fix(auth): prevent session timeout race condition during offline sync`
- `refactor(ui): modularize employee training hub card metrics`

### 6.3 Protocolo de Lanzamiento y Versionado Semántico (SemVer)
Al preparar una nueva versión, se deben sincronizar en un único commit atómico los siguientes 5 artefactos:
1. `pom.xml`: Etiqueta `<version>X.Y.Z</version>`.
2. `frontend/package.json`: Campo `"version": "X.Y.Z"`.
3. `frontend/package-lock.json`: Campo `"version": "X.Y.Z"`.
4. `frontend/public/version.json`:
   ```json
   {
     "version": "X.Y.Z",
     "buildTime": "<ISO-8601-UTC>",
     "timestamp": <milisegundos-epoch>
   }
   ```
5. `CHANGELOG.md`: Entrada de versión en la cabecera siguiendo la especificación [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/):
   ```markdown
   ## [X.Y.Z](https://github.com/jfpaardoo/smart-checkin-system/releases/tag/vX.Y.Z) - AAAA-MM-DD
   ```

El flujo de GitHub Actions `.github/workflows/auto-release.yml` detectará automáticamente el nuevo bloque en `CHANGELOG.md` al integrarse en `main`, creará el tag `vX.Y.Z` y publicará la GitHub Release correspondiente con las notas asociadas.

---

## 7. Referencias y Documentación Clave

- [Documentación Técnica del Sistema](docs/README.md)
- [Catálogo y Especificación de APIs REST](docs/API_DOCUMENTATION.md)
- [Matriz de Cumplimiento OWASP ASVS v4.0](docs/OWASP_ASVS_v4_Matrix.md)
- [Evaluación de Impacto RGPD / DPIA](docs/DPIA_RGPD_Assessment.md)
- [Guía de Despliegue con Docker y Nginx](docs/DEPLOYMENT_DOCKER_GUIDE.md)
