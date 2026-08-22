import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaArrowLeft, FaDatabase, FaLock, FaUserSlash, FaCamera, FaCloudUploadAlt, FaGavel, FaCookieBite, FaBan } from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="da-container flex flex-col items-center justify-center min-h-screen py-8 px-4">
      <div className="w-full max-w-4xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl shadow-2xl rounded-[36px] p-6 sm:p-10 border border-white/60 dark:border-white/10 my-4">
        
        {/* BOTÓN VOLVER */}
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 text-xs sm:text-sm font-semibold transition-all duration-200 mb-6 cursor-pointer"
        >
          <FaArrowLeft />
          <span>{t('common.back', 'Volver')}</span>
        </button>

        {/* CABECERA CENTRADA */}
        <div className="text-center mb-8 pb-6 border-b border-white/40 dark:border-white/10">
          <div className="mx-auto mb-3 flex items-center justify-center w-16 h-16 rounded-2xl bg-[#b3c34c]/20 border border-[#b3c34c]/40 text-[#73841e] dark:text-[#d4e84a] shadow-xs">
            <FaShieldAlt size={30} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">
            {t('privacy.title', 'Política de Privacidad y Protección de Datos')}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-0">
            {t('privacy.lastUpdated', 'Última actualización: Agosto de 2026')} • Distribution Academy
          </p>
        </div>

        <div className="text-left space-y-8 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          
          {/* APARTADO 1: Datos que recopilamos */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#b3c34c]/15 text-[#73841e] dark:text-[#d4e84a] flex-shrink-0">
                <FaDatabase size={15} />
              </span>
              <span>{t('privacy.sec1Title', '1. Datos que recopilamos y tratamos')}</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3">
              {t('privacy.sec1Text', 'El sistema Smart Check-in recopila y procesa exclusivamente los datos necesarios para la gestión formativa, el control horario y la integridad operativa de la plataforma:')}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.sec1Item1Title', 'Datos Identificativos:')}</strong> {t('privacy.sec1Item1Desc', 'Nombre, apellidos, nombre de usuario, correo electrónico corporativo, código personal (PIN de 4 dígitos), empresa asignada y localizador/sede (código de centro de trabajo).')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.sec1Item2Title', 'Firma Digital y Evidencia:')}</strong> {t('privacy.sec1Item2Desc', 'Trazo de firma manuscrita digitalizada (almacenada en formato Base64) obligatoria para certificar la asistencia y finalización de cada jornada formativa.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.sec1Item3Title', 'Historial Formativo y Métricas:')}</strong> {t('privacy.sec1Item3Desc', 'Registro de convocatorias asignadas, asistencias, tiempos de permanencia, tasas de asistencia porcentuales y certificados emitidos.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.sec1Item4Title', 'Datos de Seguridad y Registro:')}</strong> {t('privacy.sec1Item4Desc', 'Trazabilidad inmutable de inicios de sesión, intentos fallidos, activación de doble factor (2FA) y dirección IP de origen.')}
              </li>
            </ul>
          </div>

          {/* APARTADO 2: Datos que NO recopilamos y Garantías */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#b3c34c]/15 text-[#73841e] dark:text-[#d4e84a] flex-shrink-0">
                <FaBan size={15} />
              </span>
              <span>{t('privacy.secNotCollectedTitle', '2. Datos que NO recopilamos y Garantías de No Intrusión')}</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3">
              {t('privacy.secNotCollectedText', 'Para salvaguardar la intimidad de los empleados, el sistema garantiza expresamente que:')}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.secNotCollectedItem1Title', 'Sin Rastreo GPS ni Geolocalización:')}</strong> {t('privacy.secNotCollectedItem1Desc', 'No se realiza ningún seguimiento de ubicación geográfica por GPS ni en segundo plano. La presencia física se valida únicamente mediante la proximidad al proyector de códigos QR en aula.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.secNotCollectedItem2Title', 'Sin Almacenamiento de Fotos ni Vídeos:')}</strong> {t('privacy.secNotCollectedItem2Desc', 'La cámara sólo decodifica el código QR en memoria RAM local del navegador. Nunca se graban, transfieren ni conservan capturas de imagen o vídeo.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.secNotCollectedItem3Title', 'Sin Acceso a Sensores Privados:')}</strong> {t('privacy.secNotCollectedItem3Desc', 'La plataforma no accede a micrófonos, contactos, registros telefónicos ni archivos personales del dispositivo.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.secNotCollectedItem4Title', 'Garantía Cero Biometría en Servidor (Passkeys / WebAuthn):')}</strong> {t('privacy.secNotCollectedItem4Desc', 'El sistema soporta inicio de sesión con Llaves de Acceso (Passkeys FIDO2). La verificación biométrica (huella dactilar, Face ID o Windows Hello) se ejecuta exclusivamente en el chip de seguridad local de su propio dispositivo (Secure Enclave / TPM). El servidor NUNCA recibe, procesa ni almacena datos biométricos (conforme al Art. 9 del RGPD), custodiando únicamente la clave pública criptográfica.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.secNotCollectedItem5Title', 'Sin Rastreo Comercial ni Cesión a Terceros:')}</strong> {t('privacy.secNotCollectedItem5Desc', 'No se monitoriza la actividad del usuario fuera de la aplicación ni se comercializan datos con anunciantes o redes publicitarias.')}
              </li>
            </ul>
          </div>

          {/* APARTADO 3: Cookies y Almacenamiento Técnico */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#b3c34c]/15 text-[#73841e] dark:text-[#d4e84a] flex-shrink-0">
                <FaCookieBite size={15} />
              </span>
              <span>{t('privacy.secCookiesTitle', '3. Cookies y Almacenamiento Técnico Estrictamente Necesario')}</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3">
              {t('privacy.secCookiesText', 'La plataforma NO emplea cookies de marketing, publicidad comportamental ni analítica de terceros. Únicamente se utiliza almacenamiento técnico local (Local Storage y Cookies de sesión) estrictamente imprescindible:')}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.secCookiesItem1Title', 'Token de Sesión Criptográfico (jwt):')}</strong> {t('privacy.secCookiesItem1Desc', 'Almacena de forma segura el token JWT para mantener activa la sesión autenticada del usuario mientras navega.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.secCookiesItem2Title', 'Preferencia de Idioma (i18nextLng):')}</strong> {t('privacy.secCookiesItem2Desc', 'Guarda el idioma seleccionado (ES, EN, PT, FR, DE, PL, BG, RO) para mostrar la interfaz en su lengua preferida.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.secCookiesItem3Title', 'Canal WebSocket Seguro:')}</strong> {t('privacy.secCookiesItem3Desc', 'Mantiene la conexión en tiempo real para la recepción de notificaciones operativas inmediatas.')}
              </li>
            </ul>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
              {t('privacy.secCookiesLegalNote', '* Conforme al Art. 22.2 de la LSSI-CE y la Directiva ePrivacy europea, estas tecnologías técnicas esenciales no requieren consentimiento previo al ser indispensables para la prestación del servicio solicitado.')}
            </p>
          </div>

          {/* APARTADO 4: Cámara, Códigos QR y TOTP */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#b3c34c]/15 text-[#73841e] dark:text-[#d4e84a] flex-shrink-0">
                <FaCamera size={15} />
              </span>
              <span>{t('privacy.sec2Title', '4. Uso de Cámara, Códigos QR y Mecanismo TOTP')}</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3">
              {t('privacy.sec2Text', 'La interacción en el aula y los fichajes incorporan tecnología QR dinámica con las siguientes garantías:')}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.sec2Item1Title', 'Acceso a la Cámara:')}</strong> {t('privacy.sec2Item1Desc', 'El permiso de cámara solicitado en navegadores móviles/escritorio se utiliza únicamente para el escaneo en tiempo real de códigos QR en el cliente. En ningún momento se graban, transmiten ni almacenan imágenes o vídeos de su dispositivo.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.sec2Item2Title', 'Códigos QR Rotativos (TOTP):')}</strong> {t('privacy.sec2Item2Desc', 'Los códigos QR se actualizan dinámicamente cada 20 segundos mediante algoritmos TOTP basados en el tiempo, impidiendo la falsificación, capturas de pantalla o fichajes remotos no autorizados.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.sec2Item3Title', 'Alternativa Manual:')}</strong> {t('privacy.sec2Item3Desc', 'En caso de indisponibilidad técnica de la cámara, el sistema ofrece un método seguro de entrada manual con código numérico de un solo uso.')}
              </li>
            </ul>
          </div>

          {/* APARTADO 5: Criptografía y Seguridad Técnica */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#b3c34c]/15 text-[#73841e] dark:text-[#d4e84a] flex-shrink-0">
                <FaLock size={15} />
              </span>
              <span>{t('privacy.sec3Title', '5. Medidas de Seguridad y Criptografía')}</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3">
              {t('privacy.sec3Text', 'Se implementan estándares avanzados de ciberseguridad industrial para salvaguardar sus datos:')}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.sec3Item1Title', 'Cifrado de Credenciales y 2FA:')}</strong> {t('privacy.sec3Item1Desc', 'Las contraseñas se almacenan mediante hash unidireccional BCrypt con sal única. Las claves de autenticación en dos factores (TOTP) se encriptan en base de datos mediante AES-256-GCM.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.sec3ItemPasskeyTitle', 'Llaves de Acceso Passkeys (FIDO2 / WebAuthn):')}</strong> {t('privacy.sec3ItemPasskeyDesc', 'Autenticación asimétrica resistente al phishing basada en criptografía de curva elíptica (secp256r1/ED25519) sin contraseñas.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.sec3Item2Title', 'Protección contra Fuerza Bruta y Bots:')}</strong> {t('privacy.sec3Item2Desc', 'Bloqueo temporal automático de cuentas ante reiterados accesos fallidos y verificación con Cloudflare Turnstile.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.sec3Item3Title', 'Gestión de Sesiones, Revocación y Timeout:')}</strong> {t('privacy.sec3Item3Desc', 'Tokens JWT firmados con revocación inmediata (Blacklist) en logout y cierre de sesión automático por inactividad (15 min) para proteger terminales desatendidos.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.sec3Item4Title', 'Comunicaciones Seguras:')}</strong> {t('privacy.sec3Item4Desc', 'Todo el tráfico cliente-servidor se canaliza bajo protocolos cifrados TLS 1.3 / HTTPS y WebSockets seguros (WSS).')}
              </li>
            </ul>
          </div>

          {/* APARTADO 6: Auditoría e Integración Cloud */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#b3c34c]/15 text-[#73841e] dark:text-[#d4e84a] flex-shrink-0">
                <FaCloudUploadAlt size={15} />
              </span>
              <span>{t('privacy.sec4Title', '6. Trazabilidad Forense, Auditoría y Almacenamiento en la Nube')}</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3">
              {t('privacy.sec4Text', 'Para garantizar la transparencia organizativa, integridad y disponibilidad:')}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.sec4Item1Title', 'Auditoría Inmutable con Hash-Chain (SHA-256):')}</strong> {t('privacy.sec4Item1Desc', 'Los eventos del sistema se encadenan criptográficamente con SHA-256 enlazando cada registro con el anterior, garantizando la detección inmediata de cualquier manipulación o alteración de datos.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.sec4Item2Title', 'Copias de Seguridad e Integración OneDrive:')}</strong> {t('privacy.sec4Item2Desc', 'Los respaldos y la documentación complementaria se sincronizan en repositorios de Microsoft OneDrive mediante la API oficial Microsoft Graph (OAuth 2.0).')}
              </li>
            </ul>
          </div>

          {/* APARTADO 7: Derechos RGPD */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#b3c34c]/15 text-[#73841e] dark:text-[#d4e84a] flex-shrink-0">
                <FaUserSlash size={15} />
              </span>
              <span>{t('privacy.sec5Title', '7. Sus Derechos de Privacidad (RGPD / GDPR)')}</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3">
              {t('privacy.sec5Text', 'Usted dispone de pleno control sobre sus datos conforme al Reglamento General de Protección de Datos de la Unión Europea:')}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.sec5Item1Title', 'Derecho de Acceso y Portabilidad:')}</strong> {t('privacy.sec5Item1Desc', 'Puede solicitar y descargar en cualquier momento desde su panel de perfil un informe consolidado con toda su información y registros.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.sec5Item2Title', 'Derecho de Rectificación:')}</strong> {t('privacy.sec5Item2Desc', 'Tiene derecho a actualizar sus credenciales, claves 2FA y datos personales.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.sec5Item3Title', 'Derecho al Olvido / Supresión:')}</strong> {t('privacy.sec5Item3Desc', 'Puede solicitar la eliminación permanente de su cuenta. Dicha acción revocará inmediatamente sus credenciales y desasociará sus datos según la normativa laboral aplicable.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('privacy.sec5Item4Title', 'Derecho de Oposición y Limitación:')}</strong> {t('privacy.sec5Item4Desc', 'Puede consultar a la administración de la empresa o delegado de protección de datos el alcance de los tratamientos efectuados.')}
              </li>
            </ul>
          </div>

          {/* APARTADO 8: Base Legal */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#b3c34c]/15 text-[#73841e] dark:text-[#d4e84a] flex-shrink-0">
                <FaGavel size={15} />
              </span>
              <span>{t('privacy.sec6Title', '8. Base Jurídica del Tratamiento')}</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-0">
              {t('privacy.sec6Text', 'El tratamiento de los datos se fundamenta en el cumplimiento de las obligaciones legales en materia de registro de jornada y prevención de riesgos laborales (Art. 6.1.c RGPD), en la ejecución de la relación laboral y planes de formación corporativa (Art. 6.1.b RGPD), y en el interés legítimo de la organización para salvaguardar la seguridad de sus sistemas e instalaciones (Art. 6.1.f RGPD).')}
            </p>
          </div>

          <div className="mt-8 p-4 rounded-2xl text-center bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">
              {t('privacy.footerNotice', 'Al utilizar Distribution Academy Smart Check-in System, usted reconoce haber leído y comprendido esta Política de Privacidad, consintiendo el tratamiento conforme a las finalidades indicadas.')}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}