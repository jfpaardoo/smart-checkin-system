# Registro de Cambios (Changelog)

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/), y este proyecto sigue [Versionado Semántico (SemVer)](https://semver.org/lang/es/).

## [1.2.1](https://github.com/jfpaardoo/smart-checkin-system/releases/tag/v1.2.1) - 2026-08-27

### Añadido (Features) & Mejoras de Seguridad
- **Previsualización y Gestión de Archivos Adjuntos Previo al Guardado (*File Upload Chips*)**:
  - Implementada lista de tarjetas/chips interactivos para archivos seleccionados en [`FormationEditAdmin.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/admin/formations/FormationEditAdmin.js) y [`useFormationEdit.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/admin/formations/hooks/useFormationEdit.js), mostrando icono de tipo de archivo (PDF, Word, Excel, Texto, Imagen), nombre, tamaño formateado (KB/MB) y botón de eliminación individual antes de subir al servidor.
- **Desbloqueo Universal de Documentación tras Finalización de Formación**:
  - Una vez que una formación es finalizada y cerrada por el formador/administrador (`status = CLOSED`), los materiales y temarios se desbloquean automáticamente para todos los empleados de la organización, permitiendo la consulta y descarga didáctica a quienes no pudieron asistir a la sesión presencial.
  - Las formaciones cerradas no desaparecen del catálogo del usuario: se muestran ordenadas con la insignia `Finalizada` y acceso completo a la visualización de documentos en [`FormationDetailsModal.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/user/dashboard/components/FormationDetailsModal.js).
- **Cierre de Convocatorias sin Asistentes (Flexibilidad Operativa)**:
  - Actualizado [`FormationService.java`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/src/main/java/org/springframework/samples/smartcheckin/formation/FormationService.java) y [`useFormationDetails.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/admin/formations/hooks/useFormationDetails.js) para permitir finalizar y certificar formaciones con 0 asistentes (sesiones desiertas), manteniendo la validación estricta de que si existen asistentes inscritos, el 100% debe tener check-out y firma digital estampada.
- **Sincronización en Tiempo Real por WebSockets en el Dashboard de Usuario**:
  - Suscripción reactiva en [`UserDashboard.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/user/dashboard/UserDashboard.js) a los canales STOMP `/topic/formations` y `/topic/notifications/{username}` con actualización silenciosa en segundo plano (*background silent revalidation*), reflejando nuevas publicaciones y cambios de estado instantáneamente sin recargar la página.
- **Botonera y Acciones Contextuales en Edición Administrativa**:
  - Simplificada la barra de acciones en [`FormationEditAdmin.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/admin/formations/FormationEditAdmin.js): al editar una formación ya publicada o cerrada se muestra un botón claro y directo *"Guardar Cambios"*, ocultando opciones redundantes de *"Guardar como Borrador"*.
- **Suite de Iconos Multiplataforma y PWA Adaptativa (PC / iOS / Android)**:
  - **PC / Escritorio (Windows / macOS / Linux)**: Generados [`logo192.png`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/public/logo192.png), [`logo512.png`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/public/logo512.png) y [`favicon.png`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/public/favicon.png) con fondo transparente a partir del diseño de alta resolución original. Al instalar la PWA o crear el acceso directo en Windows/Chrome/Edge, se visualiza la esfera circular estilizada sin marcos cuadrados artificiales.
  - **iPhone / iPad (iOS Safari)**: Diseñado [`apple-touch-icon.png`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/public/apple-touch-icon.png) de alta definición con el logotipo original centrado y fondo sólido `#1e2535`, eliminando artefactos y esquinas blancas provocadas por el squircle de Apple.
  - **Android (Chrome / Samsung Internet / Firefox)**: Creados [`maskable-icon-192.png`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/public/maskable-icon-192.png) y [`maskable-icon-512.png`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/public/maskable-icon-512.png) con zona segura del 80% (*Safe Zone*) en [`manifest.json`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/public/manifest.json) para adaptarse automáticamente a cualquier forma de launcher (círculo, squircle, lágrima).
  - **Service Worker & Caché**: Actualizado el caché del Service Worker a `da-cache-v1.2.1` en [`sw.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/public/sw.js) y sincronización de versiones con [`version.json`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/public/version.json).

### Corregido (Bug Fixes) & Refinamiento UI/UX
- **Contador Permanente en Pestaña "En Curso"**:
  - Corregido en [`UserFormationCategoryTabs.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/user/dashboard/components/UserFormationCategoryTabs.js) para mostrar siempre la insignia numérica de conteo, incluyendo el valor `(0)` de forma homogénea con el resto de categorías.
- **Superposición de Textos y Badges en Modal de Formación**:
  - Solucionado en [`FormationDetailsModal.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/user/dashboard/components/FormationDetailsModal.js) el solapamiento visual entre la etiqueta *"Desbloqueado tras finalización"* y el texto *"Haz clic para previsualizar"* mediante layout flexible responsivo con `flex-wrap` y espaciado adaptativo.
- **Insignias de Estado Semánticas en Listado y Modal de Usuario**:
  - Añadido soporte para el estado `Finalizada` (`isClosedNonAttended`) en [`DesktopUserFormationRow.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/user/dashboard/components/DesktopUserFormationRow.js), [`MobileUserFormationCard.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/user/dashboard/components/MobileUserFormationCard.js) y [`FormationDetailsModal.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/user/dashboard/components/FormationDetailsModal.js).

### Optimización (Performance & Seguridad)
- **Eliminación de Consultas N+1 en Analíticas y Exportaciones**:
  - Creado el método por lotes `findByUserIdIn` en [`FormationAttendanceRepository.java`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/src/main/java/org/springframework/samples/smartcheckin/formation/FormationAttendanceRepository.java) e indexación en memoria con `Collectors.groupingBy` en [`AnalyticsService.java`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/src/main/java/org/springframework/samples/smartcheckin/analytics/AnalyticsService.java), reduciendo drásticamente las consultas a la base de datos de N queries a 1 única consulta SQL agregada.
- **Refactorización con Patrón Builder en el API de Formaciones**:
  - Aplicado `Formation.builder()` en [`FormationRestController.java`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/src/main/java/org/springframework/samples/smartcheckin/formation/FormationRestController.java) para la clonación y sanitización inmutable de entidades de forma limpia y desacoplada.
- **Limpieza de Parámetros y Transaccionalidad en Servicios de Analítica**:
  - Unificado el filtrado de exportación en el record [`UserFormationFilterCriteria`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/src/main/java/org/springframework/samples/smartcheckin/analytics/AnalyticsService.java), resolviendo avisos de Sonar y eliminando llamadas internas anómalas a métodos `@Transactional`.
- **Hardening de Seguridad en Descarga de Diplomas y Documentación**:
  - Blindado [`CertificateController.java`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/src/main/java/org/springframework/samples/smartcheckin/exports/CertificateController.java) requiriendo `checkOutDate != null` para generar certificados PDF de asistencia.
  - Blindado `GET /api/v1/formations/{id}` y `GET /api/v1/formations` en [`FormationRestController.java`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/src/main/java/org/springframework/samples/smartcheckin/formation/FormationRestController.java) para ocultar las URLs de documentos antes del fichaje o del cierre oficial de la formación.

---

## [1.2.0](https://github.com/jfpaardoo/smart-checkin-system/releases/tag/v1.2.0) - 2026-08-23

### Añadido (Features) & Abstracciones Frontend
- **Motor de Sonidos Sintetizados y Respuestas Hápticas en Tiempo Real (*Web Audio & Haptics*)**:
  - Creado el gestor [`soundAndHaptics.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/util/soundAndHaptics.js) basado en la **Web Audio API** de baja latencia (0 ms, sin archivos externos ni peso extra, compatible 100% offline y PWA) y la **Web Vibration API** para dispositivos móviles.
  - Diseñados efectos sonoros armónicos y patrones hápticos específicos para:
    - *Lectura y escaneo de código QR*: Pitido agudo de confirmación y vibración instantánea.
    - *Éxito / Fichaje completado*: Acorde melódico ascendente (D5 &rarr; A5) y doble pulso háptico.
    - *Error o denegación*: Tono grave de alerta y doble vibración de aviso.
    - *Notificaciones y avisos del sistema*: Campana sutil y suave.
    - *Teclado numérico / Entrada de código*: Micro-clic táctil al teclear cada dígito.
  - Integrado de forma centralizada en [`ToastProvider.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/components/ToastProvider.js), [`ScannerCheckin.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/user/checkin/ScannerCheckin.js), [`ManualCheckinForm.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/user/checkin/components/ManualCheckinForm.js) y [`NotificationContext.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/context/NotificationContext.js).
- **Barra de Navegación y Desplegables en Cristal Líquido Translúcido (*Ultra Frosted Liquid Glass*)**:
  - Rediseñada la barra de navegación principal ([`AppNavbar.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/AppNavbar.js), [`navbar.css`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/static/css/layout/navbar.css)) para presentar una estética pura de cristal blanco translúcido en Modo Claro (`bg-white/50 backdrop-blur-2xl border-white/60 shadow-[0_12px_40px_rgba(31,38,135,0.10)]`) y cristal espacial sutil en Modo Oscuro (`dark:bg-slate-900/40`), eliminando sobre-saturaciones excesivas de color azul.
  - Ajustados todos los menús flotantes desplegables (Administración, Perfil, Idioma, Notificaciones y cajón móvil) con desenfoque de cristal denso (`backdrop-filter: blur(25px)`), adaptándose de forma armoniosa al tema activo con textos oscuros en modo claro y textos blancos en modo oscuro, evitando cualquier mezcla o traslúcido no deseado con el contenido de la página.
- **Feedback Específico y Contextual en Notificaciones Toast (Check-in & Check-out)**:
  - Clasificación de errores detallados en los flujos de escaneo y registro de asistencia: detección de QR/código de otra formación, formación ya fichada/registrada previamente, código expirado, convocatoria fuera de horario o no iniciada, y fallo de validación de firma.
- **Centrado Absoluto de Casillas en Informe Oficial Excel (FOR 99 HRS)**:
  - Calibración exacta de los anclajes de forma en [`OfficialFormationSheetService.java`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/src/main/java/org/springframework/samples/smartcheckin/exports/OfficialFormationSheetService.java) para centrar milimétricamente las "X" dentro de las casillas de verificación *Dentro de Jornada* y *Fuera de Jornada* de la plantilla oficial con tipografía en negrita y margen cero.

### Añadido (Features) & Abstracciones Frontend
- **Flujo Integral de Cierre y Certificación de Formaciones (Firma de Formador y Bloqueo)**:
  - Implementado el ciclo de vida de cierre de formación con validación de requisitos: todos los asistentes inscritos deben haber completado su checkout y estampado su firma digital.
  - Creado el endpoint `POST /api/v1/formations/{id}/close` en [`FormationRestController.java`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/src/main/java/org/springframework/samples/smartcheckin/formation/FormationRestController.java) y la lógica de validación transaccional en [`FormationService.java`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/src/main/java/org/springframework/samples/smartcheckin/formation/FormationService.java).
  - Integrado el modal accesible [`CloseFormationModal`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/admin/formations/components/FormationModals.js) con canvas de firma digital para el formador (`react-signature-canvas`), campo de observaciones e incidencias opcionales y selector de formador.
  - Almacenamiento seguro de la firma del formador en la nube/OneDrive a través de [`SignatureStorageService.java`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/src/main/java/org/springframework/samples/smartcheckin/signatures/SignatureStorageService.java).
  - Bloqueo total de modificaciones: una vez cerrada la formación, se bloquea la edición de datos, subida/borrado de documentos y la adición o eliminación de asistentes tanto en frontend como con guardas de seguridad en el backend.
- **Exportación Oficial de Formaciones con Firmas Digitales Incrustadas (Formato FOR 99 HRS)**:
  - Implementado el servicio [`OfficialFormationSheetService.java`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/src/main/java/org/springframework/samples/smartcheckin/exports/OfficialFormationSheetService.java) y endpoint `GET /api/v1/exports/formations/{id}/official-sheet` para rellenar automáticamente la plantilla oficial de calidad `FOR 99 HRS 103 (es) - Sumario y Registro de presencias`.
  - Incrusta dinámicamente el logo corporativo, los metadatos de la convocatoria (fecha, horario, lugar por defecto `"BA VILLAFRANCA"`, formador `"VICTOR PARDO"`, descripción y observaciones), el censo de formandos (nombre, DNI/código, casillas de horario de trabajo marcadas con "X"), las **firmas digitales PNG** de cada asistente y la **firma digital del formador** posicionada en el pie de página oficial.
  - Añadido el botón de descarga directa **"Registro Oficial (FOR 99)"** con icono de Excel en el panel de detalles de formación ([`FormationDetailsAdmin.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/admin/formations/FormationDetailsAdmin.js)).
- **Unificación y Homogeneización Global de Tablas y Botoneras de Acción**:
  - Estandarizado el contenedor de tabla en toda la plataforma (`rounded-3xl border border-white/60 dark:border-white/10 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(31,38,135,0.06)]`) en usuarios, empresas, formaciones, asistentes, analíticas e historial de perfil.
  - Botones de acción unificados a píldoras de cristal cuadradas redondeadas (`p-2.5 rounded-xl border border-white/80 dark:border-white/10 hover:scale-105 active:scale-95 transition`) con soporte de modo oscuro.
  - Iconos identificadores en cápsula suave (`FaBuilding`, `FaUser`, `FaGraduationCap`) en la primera columna de todas las tablas del sistema.
- **Pantalla de Carga Inicial Adaptativa Dual (Modo Claro & Modo Oscuro)**:
  - Rediseñado el splash screen (`#splash-screen` en `index.html`) para detectar el tema activo sin parpadeos (*anti-FOUC*), con fondo de cristal suave, textos oscuros y acentos lima en Modo Claro, y estética espacial profunda en Modo Oscuro.
- **Suite de Componentes y Abstracciones Liquid Glass**:
  - `GlassModal`: Componente modal nativo accesible montado mediante React Portal (`createPortal`) con animaciones Framer Motion (`AnimatePresence`, `motion.div`), soporte de modo oscuro, cierre con `Escape` y bloqueo de scroll.
  - `GlassPageHeader`: Cabecera unificada para paneles de administración con icono en píldora brillante, título responsivo, subtítulo y ranura (*slot*) para acciones de exportación/creación.
  - `GlassFormHeader`: Cabecera simétrica para formularios con botón flotante de retroceso y badge de icono centrado.
  - `GlassEmptyState`: Componente homogéneo para estados vacíos o búsquedas sin resultados con icono brillante, título, descripción y llamada a la acción opcional.
  - `GlassConfirmModal`: Modal especializado para confirmación de eliminaciones o acciones críticas con alertas contextuales y gestión de estado de carga.
  - `StatusBadge`: Insignias de estado semánticas (`success`, `warning`, `danger`, `info`, `primary`, `neutral`) con soporte de indicador pulsante animado (*pulse indicator*) en tiempo real.
  - `GlassButton`: Botones táctiles con micro-interacciones de Framer Motion (`whileTap`, `whileHover`) y spinner de carga integrado.
  - `useDebounce`: Hook personalizado para retrasar entradas de búsqueda y filtros, evitando cálculos innecesarios en tiempo de escritura.
- **Sincronización de Modo Oscuro Cross-Tab**:
  - Escucha del evento nativo `storage` en `ThemeContext.js` para sincronizar el tema de forma instantánea y simultánea entre todas las pestañas activas del navegador.
  - Variable CSS `--da-primary-glow` integrada para efectos de relieve e iluminación corporativa en modo oscuro.
- **Micro-Animaciones con Framer Motion**:
  - Trazado vectorial dinámico SVG (`pathLength: 0 → 1`) con efecto *spring* en la pantalla de escáner QR tras fichaje exitoso (`ScannerCheckin.js`).
  - Transición fluida entre pestañas (`AnimatePresence mode="wait"`) y entrada escalonada (*stagger animation*) en las tarjetas de KPI del panel de analíticas (`AnalyticsDashboard.js`, `AnalyticsOverviewTab.js`).

### Corregido (Bug Fixes) & Refinamiento UI/UX
- **Pestañas de Filtro y Navegación Administrativa en Modo Oscuro**:
  - Añadido soporte nativo de modo oscuro para pestañas tipo píldora (`.da-tab-pill`, `.da-tab-pill-active`, `.da-tab-pill-pending` en [`adminPage.css`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/static/css/admin/adminPage.css), [`UserListTabs.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/admin/users/components/UserListTabs.js)), resolviendo fondos apagados y falta de contraste en las vistas de gestión de usuarios.
- **Modo Oscuro en Verificación de Seguridad Cloudflare Turnstile**:
  - Actualizado el contenedor y el widget de Turnstile en [`Register.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/auth/register/Register.js), [`RegisterForm.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/auth/register/components/RegisterForm.js) y [`ForgotPassword.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/auth/recover/ForgotPassword.js) para renderizar automáticamente el tema oscuro nativo (`options={{ theme: isDark ? 'dark' : 'light' }}`) sin desentonar con el formulario.
- **Homogeneización del Ancho de Tabla en Gestión de Empresas**:
  - Eliminada la restricción de ancho rígido en [`CompanyListAdmin.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/admin/companies/CompanyListAdmin.js) para que su longitud y distribución se alineen al 100% de manera consistente con las tablas de formaciones, usuarios y auditoría.
- **Ajuste Responsive de Badges en Tarjetas Móviles de Asistentes**:
  - Reestructurado el layout de las tarjetas de asistentes en móviles ([`FormationAttendeesTable.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/admin/formations/components/FormationAttendeesTable.js)) a dos filas independientes, solventando el aplastamiento y corte de texto en las insignias de estado de jornada.
  - Flexibilizadas las insignias de cabecera en [`FormationDetailsAdmin.js`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/admin/formations/FormationDetailsAdmin.js) para evitar solapamientos con el botón de regreso en pantallas estrechas.
- **Estilos Globales de Botones para Modo Claro y Modo Oscuro**:
  - Refactorizados los botones `.da-btn-secondary`, `.da-btn-primary`, `.da-btn-blue`, `.da-btn-danger` y `.da-btn-excel` en [`common.css`](file:///c:/Users/JFPARDO/OneDrive/Escritorio/smart-checkin-system/frontend/src/static/css/base/common.css) con fondos de cristal líquido y contrastes tipográficos nítidos para ambos modos visuales.
- **Panel de Notificaciones en Móvil**:
  - Resuelto el problema por el cual el panel de notificaciones en móviles aparecía vacío a pesar de llegar la notificación push y el contador de campana. Se conectó `NotificationBell.js` al renderizado responsive para mostrar las notificaciones en tiempo real tanto en móvil como en escritorio.
- **Amplitud y Aprovechamiento de Pantalla en Tarjetas de Acceso Rápido (Home Móvil)**:
  - Optimizado el ancho de las tarjetas (`da-action-card`, `home-card`) en pantallas móviles reduciendo márgenes ociosos laterales para que ocupen todo el ancho útil del dispositivo con padding equilibrado.
- **Fondo Oscuro e Insets en iOS Safari / WebKit**:
  - Solucionado el fondo blanco en bordes y áreas de sobre-desplazamiento (*overscroll canvas*) en iOS Safari declarando `background-color: #0f172a !important` y `color-scheme: dark` directamente en `html.dark` y `html.dark body`, así como la sincronización dinámica de la etiqueta `<meta name="theme-color">` en `index.html` y `ThemeContext.js`.
- **Selector de Fechas y Placeholder en Analíticas Móvil**:
  - Reemplazados los campos de fecha vacíos y desbordados en móviles por un componente `grid` responsivo con etiquetas superiores fijas (*Desde* / *Hasta*), icono de calendario y botón de borrado rápido, garantizando visualización homogénea en iOS y Android sin desbordamiento lateral.
- **Desglose de Formaciones Adaptativo en Detalle de Empleado (Analíticas)**:
  - Implementada vista de tarjetas y badges semánticos en dispositivos móviles (`md:hidden`) en `UserAnalyticsDetailModal.js`, sustituyendo la tabla rígida comprimida por tarjetas estilizadas con insignias de estado, horas asistidas y marcas de tiempo claras.
- **Cristales Oscuros en Analíticas, Perfil, Modales y Cierre de Sesión**:
  - Corregidos fondos blancos rígidos en las tarjetas KPI de Analítica (`AnalyticsOverviewTab.js`, `analyticsDashboard.css`), paneles de filtro (`EmployeeFilterPanel.js`), sesiones activas (`ActiveSessionsTab.js`), privacidad/GDPR (`PrivacyDataTab.js`), documentación adjunta (`FormationDetailsAdmin.js`), modal de detalles de formación (`FormationDetailsModal.js`) y modal de confirmación de salida (`Logout/index.js`).
- **Superposición de Etiquetas y Texto en Formularios de Entrada**:
  - Reemplazado el patrón *Floating Label* por etiquetas superiores dedicadas con tipografía nítida y contraste WCAG en `Login/index.js`, `RegisterForm.js`, `ForgotPassword.js` y `PasswordChangeCard.js`, evitando cualquier solapamiento visual provocado por el autorrellenado de navegadores y gestores de contraseñas.
- **Paginación Móvil y Navbar en Pantallas Grandes**:
  - Resuelto el desajuste visual de la paginación (`GlassPagination.js`) en móviles pasando de forma oval forzada a tarjeta redondeada `rounded-2xl` con distribución simétrica de controles.
  - Ampliado el ancho máximo de la barra de navegación superior (`AppNavbar.js`) en ordenadores a `max-w-[1440px]`.
- **Alineación de Lupa y Desplegables**:
  - Padding lateral interno fijado en `GlassSearchBar.js` para evitar solapamiento entre el icono de búsqueda y el texto de entrada.
  - Contexto de apilamiento corregido con `z-50` en `GlassDropdown.js` para evitar que los menús desplegables queden cubiertos por elementos adyacentes.
- **Resiliencia en Pruebas Unitarias y E2E**:
  - Corregido el aislamiento transaccional en `AuthoritiesServiceTests.java` añadiendo `@Transactional` a nivel de clase y aserción de autoridades requeridas.
  - Actualizados los selectores en Playwright E2E (`2fa-flow.spec.js` y `forgot-password-flow.spec.js`) con roles semánticos `getByRole` y eliminación del enlace de recuperación duplicado.

### Mejorado (Performance, Caché & Base de Datos)
- **Desacoplamiento y Eliminación Total de `reactstrap` y `bootstrap`**:
  - Migrados más de 25 componentes y vistas a **HTML5 semántico + Tailwind CSS**, eliminando dependencias obsoletas y erradicando el peso de `bootstrap.min.css` en el bundle inicial.
- **Caché en Memoria de Alto Rendimiento con Caffeine (Backend)**:
  - Integrada la biblioteca `com.github.ben-manes.caffeine:caffeine` y habilitada la infraestructura `@EnableCaching` en Spring Boot 3.
  - Configurado TTL de 10 minutos y límite de 500 entradas (`maximumSize=500, expireAfterWrite=10m`).
  - Anotados los métodos de consulta frecuente y datos maestros con `@Cacheable` y evicción en escritura (`@CacheEvict`) en `CompanyService`, `AuthoritiesService` y `DepartmentService`, reduciendo la latencia de 15-30 ms a <1 ms (RAM).
- **Indexación y Optimización de Base de Datos (Flyway V2)**:
  - Creado el script `V2__add_performance_indexes.sql` con índices B-Tree en columnas de alto volumen y claves foráneas (`appusers.company_id`, `appusers.authority`, `appusers.locator`, `appusers.is_approved`, `formation_attendances.user_id`, `formation_attendances.formation_id`, `checkins.user_id`, `checkins.formation_id`, `checkins.timestamp`, `audit_logs.timestamp`, `audit_logs.action`, `audit_logs.username`).
- **Caché en Cliente con SWR, Persistencia Multi-Sesión y Memoización**:
  - Migrados `UserListAdmin.js`, `CompanyListAdmin.js`, `FormationListAdmin.js` y `AuditDashboard.js` a `useSWR` para navegación instantánea (0 ms) con revalidación en segundo plano y sincronización en tiempo real por WebSocket.
  - Implementado proveedor de caché persistente `localStorageProvider` (`swrCacheProvider.js`) que conserva las tablas en disco entre sesiones y recargas del navegador.
  - Precarga predictiva en navegación (`onMouseEnter` en escritorio y `onTouchStart` en móviles) en `AppNavbar.js` con `preload` de SWR, anticipando la descarga de datos mientras el usuario apoya el dedo o el cursor.
  - Code-splitting total de todas las rutas en `App.js` con `lazyWithRetry` (Login, Register, Logout, Scanner, Dashboard) reduciendo el bundle inicial en más de un 50%.
  - Optimización de cabeceras de recurso (`dns-prefetch` y `preconnect` para Google Fonts) en `index.html`.
  - Desactivación de `spring.jpa.open-in-view` en backend para liberar conexiones al pool HikariCP inmediatamente tras la ejecución del servicio.
  - Eliminación de consultas N+1 en backend (`UserRepository.java`) mediante `LEFT JOIN FETCH u.company LEFT JOIN FETCH u.authority`.
  - Reducción del retardo artificial del splash screen a 250 ms en `index.html`.
  - Memoizado `UserTable.js` con `React.memo` para evitar re-renders superfluos durante el tecleo en el buscador.
  - Añadido `loading="lazy"` y `decoding="async"` en `SecureImage.js` para firmas y documentos adjuntos.
- **Estándares Móviles 2026 y Renderizado a 120Hz/60Hz (Touch Manipulation & GPU Compositing)**:
  - Eliminado el retraso de pulsación táctil (300 ms click delay) en iOS/Android mediante `touch-action: manipulation;` y `-webkit-tap-highlight-color: transparent;` global.
  - Prevención de desbordamiento elástico indeseado con `overscroll-behavior-y: none;`.
  - Aceleración por GPU (`transform: translateZ(0); backface-visibility: hidden;`) en tarjetas, paneles de cristal, tablas y barra de navegación.
  - Curvas de animación elásticas Apple ProMotion `--da-ease-spring` (`cubic-bezier(0.22, 1, 0.36, 1)`) y `--da-ease-smooth` integradas en `variables.css`.
  - Promoción de capas GPU en `PageTransition.js`, `GlassSearchBar.js` y componentes de carga.
  - Eliminado el coste de shader de `filter: blur()` durante transiciones de página completas, eliminando caídas de fotogramas (*jank*) en dispositivos móviles.
  - React 18 Concurrente con `useTransition` / `startTransition` en `GlassSearchBar.js` para que la escritura en el teclado responda a 60/120 fps constantes sin bloquear el hilo principal.
  - Renderizado virtualizado por CSS (`content-visibility: auto; contain-intrinsic-size: 0 52px`) en las filas de `UserTable.js`, `FormationTable.js` y `AuditDashboard.js`, haciendo el scroll de listas largas instantáneo.
  - Shimmer acelerado por hardware en `GhostLoader.js` con gradientes lineales fluidos.
- **Herramienta de Auditoría de Bundle**:
  - Incorporado el comando `npm run analyze` con `source-map-explorer` para inspeccionar el tamaño exacto de cada chunk de producción.

---

## [1.1.0](https://github.com/jfpaardoo/smart-checkin-system/releases/tag/v1.1.0) - 2026-08-19

### Añadido (Features)
- **Control de Versiones y Migraciones de Base de Datos con Flyway**:
  - Incorporada la infraestructura de migraciones automáticas con `flyway-core` y `flyway-database-postgresql`.
  - Creado el script de migración inicial de esquema `V1__init_schema.sql` que versiona todas las tablas del sistema (`companies`, `authorities`, `appusers`, `formations`, `formation_attendances`, `checkins`, `audit_logs`, `push_subscriptions`, `user_passkeys`, `password_reset_tokens`, `jwt_blacklisted_tokens`, `cloud_settings`, `platform_statistics`) con restricciones de integridad referencial y datos semilla auditados.
- **Fichajes Offline con IndexedDB y Auto-Sincronización en PWA**:
  - Módulo `offlineQueue.js` con almacenamiento local `IndexedDB` para permitir el fichaje mediante código QR en instalaciones sin cobertura de red (almacenes, naves industriales, centros logísticos).
  - Detección automática del restablecimiento de conexión (`window.ononline`) y sincronización desatendida en segundo plano con notificación toast al usuario.
- **Filtrado Multi-Empresa en Reportes y Exportaciones de Analítica**:
  - Parámetro `companyId` integrado en el servicio de analítica (`AnalyticsService`) y en todos los endpoints de exportación en `ExportRestController` (CSV, Excel, PDF para usuarios, asistencias a formaciones y fichajes).
  - Integrado el componente `GlassDropdown` con diseño Liquid Glass en el menú de exportación del panel analítico (`AnalyticsExportMenu.js`) y en el listado de usuarios (`UserListAdmin.js`).
- **Sincronización y Persistencia de Filtros en URL**:
  - Integrado `useSearchParams` en el panel analítico (`AnalyticsDashboard.js`) para sincronizar la pestaña activa (`?tab=overview|employees|formations`), facilitando la compartición y guardado de enlaces a vistas específicas entre administradores.
- **Observabilidad Cloud y Probes para Contenedores**:
  - Habilitadas las sondas de salud `liveness` y `readiness` de Spring Boot Actuator para Kubernetes, Docker y plataformas cloud (Render).

### Mejorado (Performance, Seguridad & Refactorización)
- **Asincronía en Envíos de Correo (`@Async`)**:
  - Anotado `EmailService.sendEmailWithAttachment` con `@Async("taskExecutor")` para evitar bloqueos del hilo HTTP durante la comunicación SMTP en registros, recuperaciones de contraseña y reportes.
- **Optimización de Conexiones JPA (`open-in-view=false`)**:
  - Desactivado Open Session In View para liberar conexiones de base de datos inmediatamente tras la ejecución de los servicios, optimizando el pool HikariCP bajo alta concurrencia.
- **Sanitización Global de Excepciones del Servidor (500)**:
  - Enmascarados los mensajes crudos en `ExceptionHandlerController.java` para devolver un mensaje seguro al cliente (`"Ha ocurrido un error interno en el servidor."`) registrando la traza completa únicamente en los logs del servidor.
- **Resolución Dinámica de Conexiones WebSocket**:
  - Extraída la función `resolveSocketUrl` en `WebSocketProvider.js` para soportar `REACT_APP_WS_URL`, dominios personalizados y pruebas en redes locales sin URLs hardcodeadas ni ternarias anidadas.
- **Reducción de Complejidad Cognitiva y Limpieza de Código**:
  - Refactorizado `AnalyticsService.getAllUsersAnalytics` eliminando sentencias `continue` redundantes y reduciendo la complejidad cognitiva con métodos auxiliares `isEligibleUser` y `matchesSearchQuery`.

### Corregido (Bug Fixes) & Resiliencia Frontend
- **Auto-Recuperación de Chunks y Resiliencia en Despliegues (`lazyWithRetry`)**:
  - Creado el helper `lazyWithRetry.js` y envueltas todas las vistas perezosas en `App.js` para erradicar los fallos `Loading chunk XX failed` (`ChunkLoadError`) en dispositivos móviles (especialmente Android) tras nuevos despliegues en el servidor.
  - Añadida detección de errores de empaquetado en `ErrorFallback` con acción de recarga transparente.
- **Rediseño y Centrado de Navbar en Cápsula Glassmorphism (`AppNavbar.js`)**:
  - Unificación a Tailwind CSS puro con dimensiones elásticas y centrado perfecto (`mx-3 md:mx-auto max-w-[1080px] rounded-[40px]`), eliminando conflictos de compilación de `@apply` y márgenes asimétricos.
- **Prevención de Desbordamiento Horizontal en Móviles Ultra-Estrechos**:
  - Corregido `min-width: 300px` en `.da-card` dentro de `responsive.css`, permitiendo que el contenedor se ajuste naturalmente a cualquier resolución móvil.
  - Añadido `overflow-x: hidden; width: 100%` en `#root` en `App.css` para blindar el viewport contra cualquier desajuste lateral.
- **Comportamiento Flotante de Desplegables (`GlassDropdown`) y Cámara**:
  - Desplegables posicionados siempre como menú flotante absoluto (`z-[9999]`) en todas las resoluciones, impidiendo que al abrir el selector de cámara se desplace o empuje el visor de vídeo y los botones hacia abajo.
- **Adaptabilidad Responsiva Integral en Paneles y Módulos**:
  - **Login**: Escalado dinámico (`transform: scale(...)`) del widget Cloudflare Turnstile en pantallas estrechas para evitar el ensanchamiento forzado del viewport y mantener el footer centrado.
  - **Paginación (`GlassPagination`)**: Controles de navegación compactos y elásticos que ocultan botones dobles extremos en móviles sin generar scrollbars.
  - **Auditoría (`AuditDashboard`)**: Badges de acción protegidos contra saltos de línea letra por letra (`whitespace-nowrap`) y truncado seguro de nombres de usuario.
  - **Analíticas (`AnalyticsDashboard`, `EmployeeCardList`, `AdvancedExportModal`)**: Eliminación de `minWidth: 280px` rígidos, métricas en cuadrícula adaptable y campos de fecha en columnas responsive.
  - **Formaciones (`FormationTable`, `FormationDetailsAdmin`)**: Cápsulas de estado con `flex-wrap` y cabecera de detalle reorganizada para evitar solapamiento entre el botón de retroceso y el título.
  - **Check-in Manual (`ManualCheckinForm`)**: Tipografía y espaciado entre caracteres elásticos (`clamp`) en el campo de código de 6 dígitos para ajustarse a cualquier ancho de pantalla sin desbordar los botones.
  - **Dashboard de Usuario (`UserFormationsTable`)**: Insignias de estado de formación (`En Curso`, `Completadas`) adaptadas con `flex-wrap` y `shrink-0` para no sobresalir de las tarjetas móviles.
- **Persistencia de Solicitud de Instalación PWA**:
  - Ajustado `PwaInstallPrompt.js` para ofrecer siempre el aviso de instalación en Android / PC y la guía de añadir a inicio en iOS mientras la app no esté instalada en modo *standalone*.

---

## [1.0.2](https://github.com/jfpaardoo/smart-checkin-system/releases/tag/v1.0.2) - 2026-08-18

### Corregido (Bug Fixes) & Mejoras
- **Prevención de Cierre de Sesión Involuntario en Escaneo QR**:
  - Sustituido el código HTTP `401 Unauthorized` por `400 Bad Request` en `CheckinRestController.java` ante códigos QR inválidos, expirados o de formaciones ya registradas, evitando que el interceptor de seguridad de Axios interprete la respuesta como expiración del JWT del usuario y expulse la sesión al login.
- **Sincronización del Estado de Trabajo (`isWorking`) en Fichaje Global**:
  - Corregido el método `processCheckinRecord` y el endpoint `checkIn` en `CheckinRestController.java` para actualizar y persistir `user.setIsWorking(type == ENTRADA)` en base de datos, garantizando que el sistema alterne fluidamente entre fichajes de Entrada y solicitudes de Salida con firma obligatoria.
- **Validación Estricta de Formación en Checkout (Frontend & Backend)**:
  - **Frontend (`CheckoutModal.js`)**: Comprobación explícita de que el `formationId` contenido en el código QR escaneado coincida con la formación seleccionada (`selectedAtt.formation.id`), mostrando la advertencia *"Este código QR pertenece a otra formación"* y reanudando la cámara sin avanzar a la firma si se escanea un QR erróneo.
  - **Backend (`FormationService.java`, `FormationRestController.java`, `FormationCheckoutRequest.java`)**: Incorporado el parámetro `token` y validación criptográfica TOTP por ID de formación (`totpService.verifyToken(token, formationId)`) para rechazar peticiones de checkout con tokens ajenos.
- **Manejador Global de `IllegalArgumentException`**:
  - Añadido `@ExceptionHandler(IllegalArgumentException.class)` en `ExceptionHandlerController.java` para devolver `400 Bad Request` con mensaje descriptivo ante cualquier violación de regla de negocio, evitando respuestas genéricas `500 Internal Server Error`.
- **Estandarización de Zonas Horarias (UTC / Local)**:
  - Forzada la zona horaria UTC en `SmartcheckinApplication.java` mediante `@PostConstruct init() { TimeZone.setDefault(TimeZone.getTimeZone("UTC")); }`, asegurando coherencia temporal idéntica entre entornos de desarrollo local y servidores en la nube (Render).
  - Unificado el formateo de fechas con `formatDate` en `UserFormationsTable.js` (vista móvil), `ScannerCheckin.js` y `ActiveSessionsTab.js`.
- **Internacionalización y Soporte Multilingüe Completo (8 Idiomas)**:
  - Añadidas y sincronizadas todas las claves de traducción de toasts y alertas de escaneo/checkout (`wrongFormationQr`, `gpsMissingWarning`, `useFrontCamera`, `useBackCamera`, `confirmSignature`) en los 8 idiomas soportados: Español (`es`), Inglés (`en`), Portugués (`pt`), Francés (`fr`), Alemán (`de`), Polaco (`pl`), Búlgaro (`bg`) y Rumano (`ro`).
- **Cámara QR y Soporte Multilente / Multidispositivo (iOS, Android y PC)**:
  - **Selección Inteligente de Lente Trasera**: Algoritmo `findBestBackCamera` en `useQrScanner.js` que detecta y selecciona por defecto la cámara trasera estándar principal (`0 / main / principal`) en smartphones con múltiples lentes (triple/cuádruple cámara), evitando inicios involuntarios en lentes macro o ultra gran angular.
  - **Formateo Amigable de Dispositivos**: Nombres limpios y comprensibles en los selectores desplegables (`Cámara Trasera Principal`, `Gran Angular`, `Teleobjetivo`, `Cámara Frontal`).
  - **Interfaz Compacta y Centrada**: Reubicado el botón de conmutación de cámara en la fila superior junto al desplegable `GlassDropdown`, manteniendo la misma proporción centrada (`aspectRatio: '1 / 1'`) y ajuste `object-fit: cover` en el visor de vídeo tanto en Check-in como en el modal de Checkout.
  - **Eliminación de Pantallas Negras y Bloqueos de Hardware**: Liberación explícita de los `MediaStreamTrack` y neutralización de los listeners `onabort` antes de transicionar entre lentes, erradicando los errores de consola `Uncaught RenderedCameraImpl video surface onabort()` y `AbortError: The play() request was interrupted`.
  - **Contenedor Estable durante la Carga**: Establecidas dimensiones fijas e indicador giratorio integrado (*"Iniciando cámara..."*) para prevenir saltos de interfaz o que el cuadro aparezca colapsado/aplastado mientras se conecta el stream de vídeo.
  - **Protección Nula en Checkout**: Resuelto el error `Cannot read properties of undefined (reading 'length')` en `CheckoutModal.js`.
- **Enrutamiento SPA y Prevención de Error 403 Forbidden en Recarga (F5)**:
  - Configurado matcher dinámico en `SecurityConfiguration.java` y forwarder por expresiones regulares en `SpaController.java` para despachar `index.html` ante cualquier ruta web del cliente (presente o futura) sin alterar la protección estricta de los endpoints de la API (`/api/**`, `/ws/**`).
- **Deduplicación de Sesiones y Revocación en Cierre de Sesión**:
  - Implementada deduplicación automática por dispositivo en `UserSessionService.java` para evitar acumulación de entradas redundantes de una misma máquina/navegador.
  - Expiración proactiva de sesiones inactivas (>24h) y revocación explícita del registro de sesión en base de datos al invocar `/api/v1/auth/logout` en `AuthController.java`.
- **Geolocalización (GPS) Robusta y Prevención de Fichajes sin Coordenadas**:
  - Estrategia de geolocalización multi-fase en `ScannerCheckin.js` y `QRGeneratorAdmin.js`: si la fijación GPS de alta precisión excede 6 segundos (típico en interiores), conmuta automáticamente a geolocalización por red móvil y Wi-Fi (`enableHighAccuracy: false`).
  - Añadida cápsula de estado con indicador LED de alto contraste (`GPS Administrador Vinculado`) en `QRGeneratorAdmin.js` para asegurar que el QR proyectado contenga las coordenadas antes del escaneo.
- **Sistema Automático de Actualizaciones para PWA y Móviles**:
  - Detección proactiva de nuevas versiones en segundo plano en `PwaUpdateNotification.js` al abrir la app, alternar pestañas (`visibilitychange`) o mediante comprobación periódica cada 15 minutos.
  - Implementada cápsula de actualización flotante Glassmorphism que permite recargar la app con un solo toque (`SKIP_WAITING`) sin tener que borrar el acceso directo del móvil ni vaciar cachés manualmente.
  - Configurado `Cache-Control: no-cache, no-store, must-revalidate` en `WebConfig.java` e `index.html` para `index.html` y `sw.js`, permitiendo que el cliente reciba siempre los archivos empaquetados más recientes de forma inmediata.
- **Diseño Glassmorphism y Accesibilidad**:
  - Rediseñado el botón "Desconectar cuenta de OneDrive" en `CloudSettingsAdmin.js` con estilo cápsula de cristal translúcido, borde suave y contraste mejorado.
  - Pantalla de Logout (`frontend/src/auth/logout`) perfectamente centrada en móviles con altura dinámica `100dvh` y botones tipo cápsula idénticos a los de Login y Home.
- **Persistencia de Sesión y Cookies en iOS WebKit / HTTPS**:
  - Detección dinámica de HTTPS (`isRequestSecure`: `request.isSecure() || X-Forwarded-Proto: https`) en `JwtUtils.java` para asignar automáticamente el atributo `Secure` en producción, garantizando que iOS Safari y WebKit Standalone (PWA) no descarten la cookie `jwt` en las peticiones `POST` autenticadas de fichaje.
  - Configurado `SameSite=Lax` y `Path=/` en las cookies de autenticación para garantizar la persistencia de la sesión en navegaciones internas entre menús de la aplicación.
  - Añadido fallback para leer el token desde la cabecera `Authorization: Bearer` en el endpoint `/api/v1/auth/validate`.
  - **Condicional HSTS en `SecurityConfiguration.java`**: Restringido el envío de la cabecera `Strict-Transport-Security` exclusivamente a conexiones HTTPS reales.
  - **Soporte CORS y Permisos Globales**: Configurado `setAllowedOriginPatterns` y `Permissions-Policy: camera=*, geolocation=*` para garantizar acceso a cámara y GPS en contenedores PWA.
  - **Resiliencia en `PrivateRoute.js`**: Implementada caché de validación en memoria (TTL 30s) y tolerancia a micro-cortes de red/timeouts para que caídas momentáneas de conectividad en móviles no cierren la sesión del usuario.
- **Estabilidad de Arranque y Endpoints en Backend**:
  - Eliminado el mapeo duplicado del endpoint `@GetMapping("/validate")` en `AuthController.java`, solucionando el fallo `IllegalStateException: Ambiguous mapping` que impedía el despliegue de Spring Boot.
- **Corrección de Concurrencia en Sesiones y Formaciones (`NonUniqueResultException`)**:
  - Sustituido `findByTokenHash` por `findFirstByTokenHashOrderByLastActivityAtDesc` y limpieza de registros concurrentes duplicados en `UserSessionService.java`, erradicando el fallo de Hibernate `NonUniqueResultException: 2 results were returned` que provocaba expulsiones inesperadas al login durante la validación de tokens en `AuthTokenFilter`.
  - Reemplazado `findByFormationAndUser` por `findFirstByFormationAndUserOrderByCheckInDateDesc` en `FormationAttendanceRepository.java` y `FormationService.java` para prevenir errores de base de datos en asistencias duplicadas.
- **Protección y Flujo de Check-in con QR**:
  - Protegida la ruta `/checkin` mediante `<PrivateRoute>` en `App.js` para evitar envíos no autenticados (`401 Unauthorized / Full authentication is required`).
  - Sustituido `fetch` nativo por la instancia estándar de Axios (`api.post`) en `ScannerCheckin.js` para garantizar la transmisión de cookies `HttpOnly` y un formateo consistente de errores.
  - Implementado overlay de carga flotante centrado (`fixed inset-0`) con `backdrop-blur` en `ScannerCheckin.js`, evitando desplazamientos bruscos del contenedor de la cámara.
- **Corrección de Registro y Validación de Código de 4 Dígitos**:
  - Implementada verificación preventiva e individual de `username`, `email` y `personalCode` en `AuthController.java` y `UserRepository.java`.
  - Corregido el mapeo de errores en `Register.js` que erróneamente informaba de código personal duplicado cuando el conflicto era por email o usuario.
- **Limpieza Visual y Responsive de Cloudflare Turnstile**:
  - Eliminado el marco contenedor redundante alrededor de Cloudflare Turnstile en las pantallas de Login, Recuperación de Contraseña y Registro, manteniendo un renderizado limpio, centrado y adaptado a dispositivos móviles.

---

## [1.0.1](https://github.com/jfpaardoo/smart-checkin-system/releases/tag/v1.0.1) - 2026-08-17

### Corregido (Bug Fixes)
- **Desplegables Responsivos y Animaciones**:
  - Refactorizado `GlassDropdown` y `AnalyticsExportMenu` con Tailwind CSS puro.
  - Comportamiento flotante con elevación y sombras en escritorio (`md:absolute`, `sm:absolute`).
  - Expansión inline fluida con Grid (`grid-rows-[0fr]` $\rightarrow$ `grid-rows-[1fr]`) en móvil que adapta la altura y empuja suavemente el contenido inferior sin desalineaciones.
  - Aislados los estilos de menú oscuro en `navbar.css` a `.da-navbar` para evitar contaminación en selectores y parpadeos en pantalla.
- **Flujo OAuth2 de OneDrive en Servidor**:
  - Detección dinámica del host y protocolo público (`X-Forwarded-Proto`, `X-Forwarded-Host`, `Host`, `Origin`) para resolver la URI de retorno sin forzar `localhost:8080`.
  - Codificación segura de la URL del frontend dentro del parámetro `state` de OAuth para redirección transparente tras la autorización en Azure.
  - Parametrización de rutas de callback mediante `@Value` cumpliendo con la regla SonarCloud `java:S1075`.
- **Protección Antidoble-Clic en Exportaciones**:
  - Añadido registro global de descargas concurrentes en `downloadExportFile.js` para descartar peticiones simultáneas del mismo archivo.
  - Estados de carga interactivos (`exportingType` / `isExporting`), spinners animados y bloqueo de botones (`disabled`) en `UserListAdmin`, `AnalyticsExportMenu` y `AuditDashboard`.
- **Gestión de Inactividad y Avisos de Sesión**:
  - Refresco automático del temporizador de inactividad en `api.js` ante cualquier petición y respuesta HTTP.
  - Detección de retorno de flujos externos mediante `visibilitychange` en `useIdleTimeout.js`.
  - Corrección de aviso duplicado por inactividad y limpieza automática del parámetro `?reason=timeout` de la URL en la pantalla de login (`history.replaceState`).

---

## [1.0.0](https://github.com/jfpaardoo/smart-checkin-system/releases/tag/v1.0.0) - 2026-08-17

Primera versión estable de **Smart Checkin System**: plataforma integral de control de presencia laboral, gestión de formaciones, seguridad avanzada y cumplimiento del Reglamento General de Protección de Datos (RGPD) para entornos corporativos e industriales.

### Añadido — Autenticación y Seguridad
- **Autenticación JWT Robusta**: Tokens de sesión en cookies `HttpOnly`, `Secure` y `SameSite=Strict` sin exposición de tokens en almacenamiento del navegador.
- **Autenticación de Doble Factor (2FA)**:
  - Soporte para aplicaciones autenticadoras TOTP (Google Authenticator, Authy, etc.).
  - Envío de códigos temporales de verificación vía correo electrónico.
  - **Códigos de Recuperación Offline (Backup Codes)**: Generación de 8 códigos de 8 caracteres alfanuméricos (`XXXX-XXXX`) hasheados con BCrypt en base de datos para acceso de contingencia de un solo uso.
- **Passkeys / WebAuthn (FIDO2)**: Inicio de sesión sin contraseña utilizando biometría (huella dactilar, Face ID, Windows Hello) o llaves de seguridad físicas.
- **Comprobación de Contraseñas Filtradas (HaveIBeenPwned)**: Validador con protocolo *k-Anonymity* en registro, cambio y reseteo de contraseña (solo se transmiten los primeros 5 caracteres del hash SHA-1; fail-open graceful).
- **Protección contra Bots y Ataques de Fuerza Bruta**: Integración de Cloudflare Turnstile CAPTCHA en inicio de sesión, registro y recuperación de cuenta.
- **Limitación de Tasa (Rate Limiting)**: Control por dirección IP mediante Bucket4j con resolución confiable de cabeceras de proxy inverso (`X-Forwarded-For`).
- **Bloqueo Inteligente y Detección de Anomalías**: Bloqueo progresivo ante intentos fallidos y registro automatizado de accesos sospechosos (`AnomalyDetectionService`).
- **Gestión de Sesiones Concurrentes**: Panel de control para listar dispositivos conectados y revocar sesiones activas remotamente.
- **Lista Negra de Tokens Revocados (JWT Blacklist)**: Invocación en tiempo real con purga programada en memoria/base de datos.
- **Recuperación de Contraseña Segura**: Flujo por correo electrónico con tokens efímeros de un solo uso.
- **Cifrado de Datos en Reposo**: Cifrado transparente JPA de campos sensibles (claves 2FA) mediante algoritmo criptográfico `AES-256-GCM`.
- **Cabeceras de Seguridad HTTP**: Configuración estricta de `Content-Security-Policy` (CSP), `Cross-Origin-Opener-Policy` (COOP), `Cross-Origin-Resource-Policy` (CORP) y `Permissions-Policy`.
- **Divulgación Responsable de Vulnerabilidades**: Archivo `security.txt` estándar bajo la especificación RFC 9116.

### Añadido — Funcionalidad de Negocio
- **Control de Fichajes y Asistencia**:
  - Fichaje mediante códigos QR dinámicos temporales basados en algoritmo TOTP.
  - Geolocalización opcional y validación de turnos laborales.
- **Gestión Integral de Formaciones**:
  - Convocatorias, control de asistencia por sesión y firma digital del participante.
  - Generación automática de certificados de asistencia en formato PDF.
  - Almacenamiento seguro de firmas en la nube con integración Microsoft OneDrive (OAuth2 / Azure AD).
- **Arquitectura Multi-Empresa**: Aislamiento por entidad corporativa (`Company`) como base de soporte multi-tenant.
- **Panel de Analítica y RR. HH.**:
  - Métricas de puntualidad, absentismo y horas trabajadas.
  - Exportación de informes en formatos CSV, Excel (XLSX) y PDF.
- **Notificaciones Multi-Canal**: Notificaciones Web Push (VAPID) en segundo plano, eventos en tiempo real vía WebSocket (STOMP) con canales privados por usuario (`/topic/notifications/{username}`) y disparador nativo en sistema operativo.
- **Progressive Web App (PWA) e Instalador Inteligente**:
  - Aplicación web instalable en móviles (Android / iOS Safari) y escritorios con banner nativo `PwaInstallPrompt` y modo *standalone*.
  - Sistema de detección de actualizaciones en caliente (*Auto-Update*) sin intermediación de tiendas de aplicaciones.
- **Diseño Glassmorphism y Experiencia Móvil**: Interfaz moderna basada en Tailwind CSS con tarjetas translúcidas (`backdrop-blur`), paleta de colores corporativa armónica y navegación táctil adaptable.
- **Internacionalización Integral (i18n)**: Soporte completo y sincronizado de interfaz en 8 idiomas (español `es`, inglés `en`, francés `fr`, alemán `de`, portugués `pt`, rumano `ro`, polaco `pl` y búlgaro `bg`) con paridad total de 852 claves.

### Añadido — Cumplimiento Normativo, Privacidad y RGPD
- **Derecho al Olvido (Art. 17 RGPD)**: Anonimización física y técnica de datos personales sin rotura de integridad referencial ni destrucción de registros fiscales/laborales obligatorios.
- **Retención y Purga Automatizada**: Tareas programadas (`@Scheduled`) para la eliminación legal de registros de auditoría y fichajes caducados.
- **Auditoría Criptográfica e Inmutable**: Registro de eventos (`AuditLog`) con cadena de bloques criptográfica (hash-chaining SHA-256 + firma HMAC) y verificador de integridad bajo demanda.
- **Evaluación de Impacto en Protección de Datos (DPIA / EIPD)**: Documentación exhaustiva de riesgos y medidas técnicas en `docs/DPIA_RGPD_Assessment.md`.
- **Registro de Actividades de Tratamiento (RAT)**: Registro formal conforme al Art. 30 del RGPD en `docs/RAT_Registro_Actividades_Tratamiento.md`.
- **Software Bill of Materials (SBOM)**: Generación automática de inventarios de dependencias (`bom.json` y `bom.xml`) mediante CycloneDX para cumplimiento de la directiva **NIS2** y el **Cyber Resilience Act (CRA)**.
- **Modelado de Seguridad**: Matriz de cumplimiento **OWASP ASVS v4** y análisis de amenazas **STRIDE**.

### Añadido — Observabilidad, Calidad y Rendimiento
- **Métricas y Telemetría**: Integración de Spring Boot Actuator y Micrometer para Prometheus (`/actuator/prometheus`, `/actuator/metrics`).
- **Optimización de Recursos (Low-RAM / 512 MB)**: Reducción del ~58% de consumo en memoria, Virtual Threads (Java 21) y carga perezosa (`lazy`) optimizada en JPA.
- **Suite de Pruebas**: Más de 70 clases de pruebas unitarias, de integración, de concurrencia y seguridad (JUnit 5, Mockito, Spring Security Test).
- **Pruebas End-to-End**: Suite automatizada con Playwright.
- **Análisis Estático Continuo**: Integración con SonarCloud para control de deuda técnica, cobertura y calidad de código.

### Añadido — Infraestructura y Despliegue
- **Contenedorización Docker**: Build multi-stage optimizado, ejecución con usuario no-root (`appuser`) y sondas de salud (`HEALTHCHECK`).
- **Configuración Cloud-Native**: Gestión de secretos e infraestructuras mediante variables de entorno (12-Factor App) sin credenciales en el repositorio.
