# Informe Técnico Exhaustivo: Suite de Pruebas E2E (Playwright)

## Resumen Ejecutivo

La suite de pruebas End-to-End (E2E) del proyecto **Smart Check-in System** está construida sobre **Playwright** (`@playwright/test` v1.62.1) en el directorio `frontend/e2e/`. Su objetivo es garantizar la calidad funcional y la resiliencia de los flujos críticos de la plataforma web:

1. **Autorregistro de Usuarios** (`auth-registration.spec.js`)
2. **Configuración y Verificación TOTP / 2FA** (`2fa-flow.spec.js`)
3. **Flujo de Aprobación por Administrador** (`admin-approval.spec.js`)
4. **Fichaje Manual con Código y Firma Digital en Canvas** (`checkin-signature-flow.spec.js`)

Recientemente se resolvió un bloqueo crítico que afectaba a `2fa-flow.spec.js` y `admin-approval.spec.js`, causado por la superposición de **dos bugs independientes en la capa de autenticación (`PrivateRoute`)**. Este documento analiza en detalle la arquitectura global de pruebas, cada uno de los 4 ficheros de prueba, la infraestructura de ejecución de Playwright y el desglose post-mortem del proceso de debugging.

---

## Infraestructura y Configuración (`playwright.config.js`)

El archivo de configuración centraliza los parámetros de ejecución para mantener un entorno determinista y reproducible:

```javascript
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  testMatch: /\.spec\.js$/,
  timeout: 60 * 1000,          // 60s timeout global por test
  expect: { timeout: 10000 },  // 10s timeout por aserción
  fullyParallel: false,         // Ejecución secuencial determinista
  workers: 1,                   // Un solo worker para evitar colisiones de puerto/estado
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

### Características destacadas de la configuración:
- **`workers: 1` & `fullyParallel: false`**: Evita conflictos de concurrencia al interceptar rutas de API en `localhost:3000`.
- **`webServer.reuseExistingServer: true`**: Permite ejecutar los tests contra un servidor dev React ya iniciado (`npm start`), reduciendo drásticamente el tiempo de arranque.
- **Trazabilidad en fallos**: Configurado para guardar capturas de pantalla (`screenshot: 'only-on-failure'`) y trazas completas de Playwright en reintentos (`trace: 'on-first-retry'`).

---

## Análisis Detallado de las Suites de Pruebas E2E

### 1. `auth-registration.spec.js` — Flujo de Autorregistro de Usuario

**Propósito**: Valida la vista pública de registro de nuevos empleados (`/register`), verificando tanto el envío exitoso del formulario como las reglas de validación en el cliente.

#### Diagrama de Secuencia del Flujo:

```text
  [ Usuario ]                 [ Frontend (/register) ]            [ Playwright Route Mock ]
       │                                 │                                    │
   1.  ├────────── Navega a /register ──>│                                    │
       │                                 │ 2. Formulario (Soporte ES/EN)      │
       │<── Renderiza formulario ────────┤                                    │
   3.  ├────────── Rellena datos ───────>│                                    │
   4.  ├────────── Clic en "Enviar" ────>│                                    │
       │                                 │ 5. POST /api/v1/auth/signup        │
       │                                 ├───────────────────────────────────>│
       │                                 │ 6. 200 OK (User registered ok)     │
       │                                 │<───────────────────────────────────┤
       │ 7. ¡Solicitud Enviada!          │                                    │
       │<── Pantalla de Confirmación ────┤                                    │
```

#### Casos de prueba incluidos:
1. **Envío exitoso de registro**:
   - Rellena todos los campos obligatorios (`firstName`, `lastName`, `username`, `personalCode`, `password`, `confirmPassword`).
   - Intercepta `POST /api/v1/auth/signup` retornando `200 OK`.
   - Comprueba la transición a la pantalla de confirmación con coincidencia regex bilingüe (`/¡Solicitud Enviada!|Request Sent!/i`).
2. **Validación de contraseñas no coincidentes**:
   - Introduce `password: "securePass123"` y `confirmPassword: "differentPass"`.
   - Comprueba que el formulario detiene el envío y permanece en `/register` sin enviar la petición al backend.

---

### 2. `2fa-flow.spec.js` — Flujo de Activación 2FA y Verificación TOTP

**Propósito**: Prueba la experiencia completa de un empleado que entra a su perfil, navega a la pestaña de seguridad, inicia la configuración de autenticación de dos factores (2FA), escanea/visualiza el código QR y valida la activación mediante código TOTP de 6 dígitos.

#### Diagrama de Secuencia del Flujo:

```text
 [ Empleado ]          [ Playwright / LocalStorage ]          [ PrivateRoute / Profile ]          [ Route Mock ]
      │                              │                                    │                               │
  1.  │─── Inyecta JWT ─────────────>│                                    │                               │
  2.  │─── Navega a /profile ───────>│                                    │                               │
      │                              │ 3. GET /api/v1/auth/validate ──────┼──────────────────────────────>│
      │                              │ 4. 200 OK (true) ──────────────────┼<──────────────────────────────┤
      │                              │                                    │ 5. Renderiza Perfil           │
  6.  ├──────────────────────────────┼── Clic en "Seguridad" ────────────>│                               │
  7.  ├──────────────────────────────┼── Clic en "Configurar 2FA" ────────>│                               │
      │                              │                                    │ 8. GET /api/v1/users/2fa/setup│
      │                              │                                    ├──────────────────────────────>│
      │                              │                                    │ 9. 200 OK (Secreto + QR URI)  │
      │                              │                                    │<──────────────────────────────┤
      │                              │ 10. Muestra Secreto JBSWY3DPEHPK3  │                               │
      │<─────────────────────────────┼─── Muestra Código QR ──────────────┤                               │
 11.  ├──────────────────────────────┼── Introduce 123456 y "Activar" ───>│                               │
      │                              │                                    │ 12. POST /api/v1/users/2fa/enable
      │                              │                                    ├──────────────────────────────>│
      │                              │                                    │ 13. 200 OK (2FA enabled)      │
      │                              │                                    │<──────────────────────────────┤
      │ 14. Toast: Activado con éxito│                                    │                               │
      │<─────────────────────────────┼────────────────────────────────────┤                               │
```

#### Endpoints mockeados:
- `**/api/v1/auth/validate**` $\rightarrow$ `true`
- `**/api/v1/users/me` $\rightarrow$ Perfil de `juanperez` (`twoFactorEnabled: false`, `EMPLOYEE`)
- `**/api/v1/users/me/formations` $\rightarrow$ `[]`
- `**/api/v1/users/2fa/setup` $\rightarrow$ `{ secret: 'JBSWY3DPEHPK3PXP', qrUri: '...' }`
- `**/api/v1/users/2fa/enable` $\rightarrow$ `{ message: '2FA enabled successfully' }`

---

### 3. `admin-approval.spec.js` — Flujo de Aprobación por Administrador

**Propósito**: Verifica el panel de administración (`/users`), permitiendo a un usuario con rol `ADMIN` revisar la lista de solicitudes de registro pendientes y aprobar a un nuevo empleado.

#### Diagrama de Secuencia del Flujo:

```text
   [ Admin ]                  [ Frontend (/users) ]               [ Playwright Route Mock ]
       │                                 │                                    │
   1.  ├────────── Inicia sesión ───────>│                                    │
   2.  ├────────── Navega a /users ─────>│                                    │
       │                                 │ 3. GET /api/v1/auth/validate       │
       │                                 ├───────────────────────────────────>│
       │                                 │ 4. 200 OK (true)                   │
       │                                 │<───────────────────────────────────┤
       │                                 │ 5. GET /api/v1/users/pending       │
       │                                 ├───────────────────────────────────>│
       │                                 │ 6. 200 OK ([nuevoempleado])        │
       │                                 │<───────────────────────────────────┤
   7.  ├────────── Pestaña Pendientes ──>│                                    │
       │<── Tabla con "nuevoempleado" ───┤                                    │
   8.  ├────────── Clic en "Aprobar" ───>│                                    │
       │                                 │ 9. POST /api/v1/users/2/approve    │
       │                                 ├───────────────────────────────────>│
       │                                 │ 10. 200 OK (User approved)         │
       │                                 │<───────────────────────────────────┤
       │ 11. Empleado Aprobado           │                                    │
       │<── Actualiza lista ─────────────┤                                    │
```

#### Endpoints mockeados:
- `**/api/v1/auth/validate**` $\rightarrow$ `true`
- `**/api/v1/users/me` $\rightarrow$ Usuario `admin` con autoridad `ADMIN`.
- `**/api/v1/users/pending` $\rightarrow$ Array con usuario id: 2 (`nuevoempleado`, `isApproved: false`).
- `**/api/v1/users/2/approve` $\rightarrow$ `{ message: 'User approved successfully' }`.

---

### 4. `checkin-signature-flow.spec.js` — Fichaje Manual y Firma Digital en Salida

**Propósito**: Evalúa la experiencia de fichaje de un empleado en `/checkin`. Demuestra la interacción dinámica con el elemento HTML5 `<canvas>` simulando trazos de ratón para la firma digital requerida en los fichajes de salida (`SALIDA`).

#### Diagrama de Secuencia del Flujo:

```text
  [ Empleado ]               [ Frontend Canvas Component ]          [ Playwright Route Mock ]
       │                                 │                                    │
   1.  ├────────── Navega a /checkin ───>│                                    │
   2.  ├────────── Modo Manual (654321)─>│                                    │
   3.  ├────────── Clic "Confirmar" ────>│                                    │
       │                                 │ 4. POST /qr-fichaje (Sin Firma)    │
       │                                 ├───────────────────────────────────>│
       │                                 │ 5. 202 Accepted (needsSignature)   │
       │                                 │<───────────────────────────────────┤
       │ 6. Modal "Firma Requerida"      │                                    │
       │<── Despliega Canvas HTML5 ──────┤                                    │
   7.  ├────────── Trazo Mouse en Canvas>│                                    │
   8.  ├────────── Clic "Confirmar Firma"│                                    │
       │                                 │ 9. POST /qr-fichaje (Con Firma)    │
       │                                 ├───────────────────────────────────>│
       │                                 │ 10. 200 OK (Fichaje SALIDA ok)     │
       │                                 │<───────────────────────────────────┤
       │ 11. ¡Fichaje de Salida Ok!      │                                    │
       │<── Modal Confirmado ────────────┤                                    │
```

---

## Informe Técnico Post-Mortem: Debugging de `2fa-flow.spec.js` y `admin-approval.spec.js`

### 1. Resumen Ejecutivo del Incidente

Dos de los cuatro tests de Playwright (`2fa-flow.spec.js` y `admin-approval.spec.js`) fallaban de manera consistente con el siguiente error de tiempo de espera:

```text
Error: expect(locator).toBeVisible() failed
Locator: getByRole('tab', { name: /seguridad|security/i })
Timeout: 15000ms
```

Los snapshots de accesibilidad mostraron que la aplicación **redirigía a la pantalla de Login** justo después de que el test intentaba acceder a la ruta protegida (`/profile` o `/users`), a pesar de haber inyectado un token JWT válido en `localStorage`.

### 2. Causa Raíz #1: Bucle Infinito de Peticiones HTTP en `PrivateRoute`

#### Diagnóstico del código defectuoso
En `frontend/src/privateRoute/index.js`:

```javascript
// ❌ CÓDIGO ANTERIOR INVENTADO/DEFECTUOSO
const PrivateRoute = ({ children }) => {
    const jwt = tokenService.getLocalAccessToken();
    const [isLoading, setIsLoading] = useState(true);
    const [isValid, setIsValid] = useState(null);
    const [message, setMessage] = useState(null);

    if (jwt) {
        // ERROR: Petición fetch ejecutada directamente en el cuerpo de render del componente
        fetch(`/api/v1/auth/validate?token=${jwt}`, { ... })
            .then(response => response.json())
            .then(isValid => {
                setMessage("Your token has expired. Please, sign in again.");
                setIsValid(isValid);
                setIsLoading(false);
            });
    } else return <Login message={message} navigation={false} />;
    ...
};
```

#### Mecánica del fallo:
1. En React, cualquier llamada a `setState` (`setIsValid`, `setIsLoading`) desencadena un re-renderizado del componente.
2. Al estar la llamada `fetch` fuera de un hook `useEffect`, **cada re-render ejecutaba nuevamente el `fetch`**.
3. En producción o desarrollo con latencia de red, el ciclo tardaba milisegundos en repetirse. Pero al interceptar las rutas en Playwright con respuestas inmediatas, la aplicación entró en una **cascada de bucle infinito (miles de peticiones por segundo)** a `/api/v1/auth/validate`.
4. La saturación de estado terminaba desestabilizando el componente y haciendo fallback a `<Login />`.

#### La Solución Aplicada:
Encapsular la llamada `fetch` dentro de un `useEffect` con arreglo de dependencias `[jwt]` y una bandera de cancelación (`cancelled`) para evitar carreras de estado al desmontar el componente:

```javascript
// ✅ CÓDIGO CORREGIDO (frontend/src/privateRoute/index.js)
useEffect(() => {
    if (!jwt) {
        setIsLoading(false);
        setIsValid(false);
        return;
    }

    let cancelled = false;

    fetch(`/api/v1/auth/validate?token=${jwt}`, {
        headers: {
            "Authorization": `Bearer ${jwt}`,
            "Content-Type": "application/json",
        },
    })
    .then(response => response.json())
    .then(result => {
        if (cancelled) return;
        setMessage("Your token has expired. Please, sign in again.");
        setIsValid(result);
        setIsLoading(false);
    })
    .catch(() => {
        if (cancelled) return;
        setIsValid(false);
        setIsLoading(false);
    });

    return () => { cancelled = true; };
}, [jwt]);
```

---

### 3. Causa Raíz #2: Incompatibilidad de Tipos en la Validación de Respuesta (`isValid === true`)

#### Diagnóstico del código
En `frontend/src/privateRoute/index.js`:

```javascript
} else return isValid === true ? children : <Login message={message} navigation={true} />;
```

#### Mecánica del fallo:
El frontend evaluaba la condición con **igualdad estricta contra el booleano `true`** (`isValid === true`). 

Sin embargo, los mocks originales de los tests en Playwright retornaban un objeto JSON:
```javascript
// ❌ Mock incorrecto
body: JSON.stringify({ valid: true })
```
Al hacer `response.json()`, `result` recibía el objeto `{ valid: true }`. La expresión `{ valid: true } === true` evaluaba siempre como `false`. Como resultado, a pesar de solucionar el bucle infinito, la aplicación **seguía redirigiendo a la pantalla de Login**.

#### La Solución Aplicada:
Ajustar los mocks en los archivos `.spec.js` para que retornen el booleano primitivo `true`:

```javascript
// ✅ Mock corregido en 2fa-flow.spec.js y admin-approval.spec.js
await page.route('**/api/v1/auth/validate**', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(true),
  });
});
```

---

## Cuadro Comparativo de los 4 Tests E2E

| Archivo Test | Rol Simulado | Vistas Probadas | Estrategia de Mocking | Puntos Críticos Verificados |
|---|---|---|---|---|
| `auth-registration.spec.js` | Anónimo | `/register` | Route mock de `POST /signup` | Formularios, validación de matching passwords, pantalla de confirmación. |
| `2fa-flow.spec.js` | `EMPLOYEE` | `/profile` (Pestaña Seguridad) | Route mocks + `addInitScript` JWT | Menú desplegable Navbar, generación de QR/secreto TOTP, activación con código de 6 dígitos. |
| `admin-approval.spec.js` | `ADMIN` | `/users` (Pestaña Pendientes) | Route mocks + `addInitScript` Admin JWT | Control de acceso por rol, filtrado de solicitudes pendientes, acción de aprobación. |
| `checkin-signature-flow.spec.js` | `EMPLOYEE` | `/checkin` | Route mocks (handling 202 vs 200) | Entrada manual TOTP, modal de firma digital, trazado sobre `<canvas>` con ratón, confirmación de fichaje `SALIDA`. |

---

## Lecciones Aprendidas y Buenas Prácticas Recomendadas

1. **Efectos Secundarios en React**: Las llamadas a APIs externas (`fetch`, `axios`) **nunca** deben situarse en el cuerpo de un componente funcional sin `useEffect`.
2. **Coherencia en el Mapeo de Mocks**: Los mocks en tests E2E deben reflejar con precisión milimétrica la respuesta del backend (`true` vs `{ valid: true }`).
3. **Diagnóstico con Loggers de Red**: Ante fallos opacos en Playwright (`toBeVisible timeout`), añadir temporalmente listeners `page.on('request', ...)` permite detectar bucles o errores 500 no capturados.
4. **Ejecución Determinista**: Mantener `workers: 1` y `fullyParallel: false` en configuraciones E2E con mocks de red garantiza estabilidad y previene colisiones entre pruebas.
