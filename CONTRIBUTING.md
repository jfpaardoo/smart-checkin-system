# Guía de Contribución al Proyecto

Distribution Academy (Smart Check-in System) se rige por principios de ingeniería de software orientados a la calidad, seguridad, mantenibilidad y cobertura de pruebas.

Este documento establece las directrices y estándares técnicos que rigen el repositorio.

---

## Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Flujo de Trabajo con Git (Git Workflow)](#flujo-de-trabajo-con-git-git-workflow)
- [Convención de Ramas](#convención-de-ramas)
- [Convención de Commits (Conventional Commits)](#convención-de-commits-conventional-commits)
- [Estándares de Código y Calidad](#estándares-de-código-y-calidad)
  - [Backend (Java / Spring Boot)](#backend-java--spring-boot)
  - [Frontend (React 18 / PWA)](#frontend-react-18--pwa)
- [Estrategia de Testing Obligatoria](#estrategia-de-testing-obligatoria)
- [Proceso de Envío y Revisión de Pull Requests (PR)](#proceso-de-envío-y-revisión-de-pull-requests-pr)

---

## Código de Conducta

Todos los colaboradores deben adherirse al [Código de Conducta](CODE_OF_CONDUCT.md) basado en el estándar *Contributor Covenant v2.1*.

---

## Flujo de Trabajo con Git (Git Workflow)

Se implementa una variante estructurada de **Trunk-Based Development** con ramas de ciclo corto:

1. **Crear una rama de trabajo** a partir de la rama principal (`main`).
2. **Implementar los cambios** con commits atómicos y mensajes conformes al estándar.
3. **Ejecutar la batería de pruebas local** (backend y frontend) verificando la ausencia de regresiones.
4. **Abrir un Pull Request** completando la lista de comprobación de la plantilla.
5. **Revisión de código y comprobaciones automáticas de CI/CD** (GitHub Actions).
6. **Integración** mediante *Squash and Merge* o *Rebase* preservando un historial lineal.

---

## Convención de Ramas

Las ramas deben utilizar prefijos normalizados según el tipo de cambio y un identificador en kebab-case:

| Prefijo | Propósito | Ejemplo |
|---|---|---|
| `feat/` | Nueva funcionalidad o módulo | `feat/passkeys-webauthn-support` |
| `fix/` | Corrección de un defecto o fallo | `fix/totp-time-window-drift` |
| `docs/` | Cambios en la documentación técnica | `docs/update-api-reference` |
| `refactor/` | Reestructuración interna sin cambios de comportamiento | `refactor/toast-provider-animation` |
| `test/` | Adición o corrección de pruebas automatizadas | `test/add-concurrency-checkin-cases` |
| `chore/` | Tareas de mantenimiento, dependencias o configuración | `chore/upgrade-bouncycastle-1.85` |

---

## Convención de Commits (Conventional Commits)

Se requiere el cumplimiento de la especificación [Conventional Commits v1.0.0](https://www.conventionalcommits.org/es/v1.0.0/):

```text
<tipo>[ámbito opcional]: <descripción en modo imperativo>

[cuerpo explicativo opcional con justificación técnica]

[pie opcional con referencias a incidencias, ej. Closes #42]
```

### Ejemplos Válidos:
* `feat(auth): integrate WebAuthn FIDO2 biometric authentication`
* `fix(security): prevent twoFactorSecret exposure in user profile serialization`
* `docs(api): document rate limiting policies and STOMP topics`
* `refactor(ui): extract toast animation style functions to reduce cognitive complexity`
* `test(backend): add metamorphic tests for checkin shift durations`

---

## Estándares de Código y Calidad

### Backend (Java / Spring Boot)
1. **Complejidad Cognitiva:** Mantener la complejidad cognitiva de SonarQube por debajo de 15 en métodos y controladores.
2. **Aislamiento en Capas:**
   - `Controller`: Gestión de peticiones HTTP, validación `@Valid`, respuestas `ResponseEntity`.
   - `Service`: Lógica pura de negocio, límites transaccionales con `@Transactional`.
   - `Repository`: Consultas JPA o SQL nativas en `JdbcTemplate`.
3. **Seguridad Defensiva:**
   - Prohibido registrar credenciales, contraseñas, secretos TOTP o datos personales sensibles en logs (`LOGGER.info`).
   - Todos los secretos deben inyectarse mediante variables de entorno (`@Value("${...}")`), nunca en texto plano.
   - Las consultas dinámicas deben emplear parámetros ligados para mitigar inyecciones SQL.

### Frontend (React 18 / PWA)
1. **Componentes Funcionales:** Uso de componentes funcionales y Hooks estándar de React (`useState`, `useEffect`, `useCallback`, `useMemo`).
2. **Optimización de Renderizado:** Memoizar funciones de devolución de llamada costosas y desacoplar lógica visual de estado global.
3. **Estilos:** Utilizar utilidades de TailwindCSS consistentes con la guía de estilos de la aplicación.
4. **Internacionalización:** Cualquier cadena de texto visible al usuario final debe internacionalizarse a través de `useTranslation()` de `react-i18next`.

---

## Estrategia de Testing Obligatoria

Toda contribución debe acompañarse de sus pruebas automatizadas correspondientes:

- **Correcciones de fallos:** Deben incluir una prueba de regresión que reproduzca el fallo antes de la corrección y valide su resolución.
- **Nuevos endpoints:** Requieren al menos una prueba unitaria `@WebMvcTest` con `MockMvc` validando códigos HTTP 200, 400 y 403 (control de acceso por roles).
- **Lógica de negocio:** Pruebas unitarias de servicios aisladas con Mockito.
- **Flujos críticos de interfaz:** Nuevas vistas de usuario deben validarse en `frontend/e2e/` con Playwright.

Comandos de verificación previa:
```bash
# Backend
./mvnw clean test

# Frontend
cd frontend && npm test -- --watchAll=false && npm run test:e2e
```

---

## Proceso de Envío y Revisión de Pull Requests (PR)

1. Abre el Pull Request completando la plantilla estándar.
2. Verifica la superación de las comprobaciones automáticas de CI/CD:
   - **CodeQL:** Sin vulnerabilidades en el análisis estático.
   - **SonarCloud:** Quality Gate en estado "Passed" (cobertura adecuada, 0 vulnerabilidades, 0 code smells bloqueantes).
   - **GitLeaks:** Sin filtraciones de credenciales ni claves criptográficas.
   - **Trivy:** Sin dependencias vulnerables de severidad alta o crítica.
3. Se requiere la aprobación de al menos un revisor antes de la integración a la rama principal.
