# Frontend — Distribution Academy (React 18 PWA)

Cliente web progresivo (PWA) de **Distribution Academy**, desarrollado con **React 18** y diseñado para proporcionar una experiencia de usuario rápida, fluida y resiliente tanto en quioscos táctiles industriales como en dispositivos móviles personales de operarios.

---

## Principios de Diseño y Experiencia de Usuario (UX)

1. **Arquitectura Liquid Glassmorphism:**
   Estética visual con orbes difuminados en segundo plano acelerados por hardware (`GPU 3D transform`), modo oscuro/claro con conmutación dinámica y superficies translúcidas con efecto cristal (`backdrop-filter: blur()`).
2. **Ergonomía Táctil y Retroalimentación Háptica:**
   Integración de respuestas sonoras y hápticas (`soundAndHaptics.js`) al interactuar con botones de acción clave, escáneres, conmutadores de idioma y notificaciones.
3. **Modo Linterna Óptica de Alto Brillo:**
   En la proyección de códigos QR en pantalla completa (`QRGeneratorAdmin.js`), el sistema permite activar un fondo blanco puro (`#FFFFFF`) y sincronizar el `<meta name="theme-color">` del sistema operativo, forzando la máxima emisión lumínica en pantallas OLED/LCD para lecturas instantáneas por lectores ópticos en entornos industriales oscuros o con reflejos.
4. **Sistema de Notificaciones 3D Apiladas (`ToastProvider.js`):**
   Alertas emergentes con relieve en capas, deduplicación interactiva (`xN`), congelación del temporizador al pasar el cursor (*Hover Freeze*) y despliegue/plegado interactivo.

---

## Estructura del Proyecto

```text
frontend/
├── e2e/                     # Especificaciones de pruebas End-to-End con Playwright
│   ├── auth.spec.js         # Flujos de login, registro, logout y 2FA
│   ├── checkin.spec.js      # Fichaje QR con firma digital en canvas HTML5
│   ├── formations.spec.js   # Gestión y asistencia a formaciones
│   └── qr-generator.spec.js # Proyección y actualización en tiempo real de QR
├── public/
│   ├── locales/             # Traducciones i18n (es, en, pt, fr, de, pl, bg, ro)
│   ├── manifest.json        # Manifiesto de aplicación PWA (instalabilidad)
│   └── sw.js                # Service Worker para caché offline y Web Push
├── scripts/
│   └── generate-version.js  # Script prebuild para inyección de hash de versión
└── src/
    ├── components/          # Componentes reutilizables (Navbar, Footer, Modales, Toast)
    ├── context/             # Contextos de React (AuthContext, ThemeContext, SoundContext)
    ├── hooks/               # Custom hooks (useWebSocket, usePushNotifications, useHaptics)
    ├── mocks/               # Mock Service Worker (MSW) para pruebas de integración aisladas
    ├── services/            # Clientes HTTP Axios y adaptadores de API
    ├── util/                # Utilidades criptográficas, formato de fechas y exportaciones
    ├── views/               # Vistas principales de la aplicación (Admin, Operario, Login)
    ├── App.js               # Enrutador principal (React Router v6) y límites de error
    └── index.js             # Punto de entrada de React 18 (createRoot)
```

---

## Tecnologías Clave

* **Núcleo:** [React 18.2](https://react.dev/) + [React Router 6.30](https://reactrouter.com/)
* **Estilos y Animación:** [TailwindCSS 3.4](https://tailwindcss.com/) + [Framer Motion 13](https://www.framer.com/motion/)
* **Internacionalización:** [i18next](https://www.i18next.com/) con 8 idiomas europeos y carga diferida (*lazy loading*).
* **Escaneo y Códigos QR:** [html5-qrcode](https://github.com/mebjas/html5-qrcode) + [qrcode.react](https://github.com/zpao/qrcode.react)
* **Firma Digital:** [react-signature-canvas](https://github.com/agilgur5/react-signature-canvas)
* **Comunicación en Tiempo Real:** [@stomp/stompjs](https://stomp-js.github.io/) + [sockjs-client](https://github.com/sockjs/sockjs-client)
* **Gestión de Datos y Caché:** [SWR 2.3](https://swr.vercel.app/)
* **Gráficos Estadísticos:** [Recharts 3.10](https://recharts.org/)
* **Protección Anti-Bot:** [@marsidev/react-turnstile](https://github.com/marsidev/react-turnstile) (Cloudflare Turnstile)
* **Pruebas:** [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/) + [Playwright](https://playwright.dev/) + [MSW](https://mswjs.io/)

---

## Scripts Disponibles

En el directorio `frontend/`, puedes ejecutar los siguientes comandos:

### Desarrollo Local
```bash
npm start
```
Inicia la aplicación en modo desarrollo en `http://localhost:3000` con proxy automático apuntando al backend en `http://localhost:8080`.

### Compilación para Producción
```bash
npm run build
```
Compila y optimiza la aplicación para producción en la carpeta `build/`. Minimiza el código JavaScript y CSS, genera nombres con hashes para invalidación de caché y deja los archivos listos para servir desde un CDN o contenedor Nginx.

### Pruebas Unitarias y de Componentes
```bash
# Ejecutar tests unitarios en modo interactivo
npm test

# Ejecutar tests unitarios una sola vez (modo CI)
npm test -- --watchAll=false

# Generar informe de cobertura de código
npm run coverage
```

### Pruebas End-to-End (E2E) con Playwright
```bash
# Ejecutar todas las suites E2E en modo headless
npm run test:e2e

# Ejecutar con interfaz gráfica interactiva (UI Mode)
npx playwright test --ui

# Ver reporte visual de la última ejecución E2E
npx playwright show-report
```

### Análisis de Rendimiento y Paquetes
```bash
# Analizar el tamaño del bundle generado
npm run analyze

# Diagnóstico de buenas prácticas y salud del código
npm run doctor
```

---

## Configuración de Proxy y Variables de Entorno

El archivo `package.json` incluye `"proxy": "http://localhost:8080"` para redirigir peticiones API locales. Adicionalmente, se pueden configurar variables en un archivo `.env.local`:

| Variable | Descripción | Valor por Defecto |
|---|---|---|
| `REACT_APP_BACKEND_URL` | URL base del servidor backend | `/` (usa el proxy local o mismo dominio) |
| `REACT_APP_TURNSTILE_SITE_KEY` | Clave pública del widget Cloudflare Turnstile | Clave de test pública |
| `REACT_APP_ENABLE_HAPTICS` | Habilitar/deshabilitar vibración háptica | `true` |
