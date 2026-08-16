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
    <div className="da-container justify-content-center min-vh-100 py-5">
      <div 
        className="da-card p-4 p-md-5 mx-auto" 
        style={{ maxWidth: '960px', backgroundColor: 'rgba(255, 255, 255, 0.90)' }}
      >
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          className="btn btn-link text-dark text-decoration-none p-0 mb-3 d-flex align-items-center gap-2 fw-bold"
        >
          <FaArrowLeft /> {t('common.back', 'Volver')}
        </button>

        {/* CABECERA CENTRADA */}
        <div className="text-center mb-5">
          <div 
            className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle shadow-sm"
            style={{
              width: '70px',
              height: '70px',
              backgroundColor: 'rgba(179, 195, 76, 0.2)',
              border: '1px solid rgba(179, 195, 76, 0.4)'
            }}
          >
            <FaShieldAlt size={34} style={{ color: '#88982a' }} />
          </div>
          <h1 className="fw-extrabold text-slate-800 mb-2" style={{ fontSize: '2.3rem' }}>
            {t('privacy.title', 'Política de Privacidad y Protección de Datos')}
          </h1>
          <p className="text-muted small fw-semibold">
            {t('privacy.lastUpdated', 'Última actualización: Agosto de 2026')} • Distribution Academy
          </p>
        </div>

        <div className="text-start text-slate-700" style={{ lineHeight: '1.75', fontSize: '0.95rem' }}>
          
          {/* APARTADO 1: Datos que recopilamos */}
          <div className="mb-5">
            <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '34px', height: '34px', backgroundColor: '#f1f5f9' }}>
                <FaDatabase size={16} style={{ color: '#88982a' }} />
              </span>
              <span>{t('privacy.sec1Title', '1. Datos que recopilamos y tratamos')}</span>
            </h4>
            <p className="text-muted mb-2">
              {t('privacy.sec1Text', 'El sistema Smart Check-in recopila y procesa exclusivamente los datos necesarios para la gestión formativa, el control horario y la integridad operativa de la plataforma:')}
            </p>
            <ul className="text-muted ps-3 space-y-2">
              <li>
                <strong>{t('privacy.sec1Item1Title', 'Datos Identificativos:')}</strong> {t('privacy.sec1Item1Desc', 'Nombre, apellidos, nombre de usuario, correo electrónico corporativo, código personal (PIN de 4 dígitos), empresa asignada y localizador/sede (código de centro de trabajo).')}
              </li>
              <li>
                <strong>{t('privacy.sec1Item2Title', 'Firma Digital y Evidencia:')}</strong> {t('privacy.sec1Item2Desc', 'Trazo de firma manuscrita digitalizada (almacenada en formato Base64) obligatoria para certificar la asistencia y finalización de cada jornada formativa.')}
              </li>
              <li>
                <strong>{t('privacy.sec1Item3Title', 'Historial Formativo y Métricas:')}</strong> {t('privacy.sec1Item3Desc', 'Registro de convocatorias asignadas, asistencias, tiempos de permanencia, tasas de asistencia porcentuales y certificados emitidos.')}
              </li>
              <li>
                <strong>{t('privacy.sec1Item4Title', 'Datos de Seguridad y Registro:')}</strong> {t('privacy.sec1Item4Desc', 'Trazabilidad inmutable de inicios de sesión, intentos fallidos, activación de doble factor (2FA) y dirección IP de origen.')}
              </li>
            </ul>
          </div>

          {/* APARTADO 2: Datos que NO recopilamos y Garantías */}
          <div className="mb-5">
            <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '34px', height: '34px', backgroundColor: '#f1f5f9' }}>
                <FaBan size={16} style={{ color: '#88982a' }} />
              </span>
              <span>{t('privacy.secNotCollectedTitle', '2. Datos que NO recopilamos y Garantías de No Intrusión')}</span>
            </h4>
            <p className="text-muted mb-2">
              {t('privacy.secNotCollectedText', 'Para salvaguardar la intimidad de los empleados, el sistema garantiza expresamente que:')}
            </p>
            <ul className="text-muted ps-3 space-y-2">
              <li>
                <strong>{t('privacy.secNotCollectedItem1Title', 'Sin Rastreo GPS ni Geolocalización:')}</strong> {t('privacy.secNotCollectedItem1Desc', 'No se realiza ningún seguimiento de ubicación geográfica por GPS ni en segundo plano. La presencia física se valida únicamente mediante la proximidad al proyector de códigos QR en aula.')}
              </li>
              <li>
                <strong>{t('privacy.secNotCollectedItem2Title', 'Sin Almacenamiento de Fotos ni Vídeos:')}</strong> {t('privacy.secNotCollectedItem2Desc', 'La cámara sólo decodifica el código QR en memoria RAM local del navegador. Nunca se graban, transfieren ni conservan capturas de imagen o vídeo.')}
              </li>
              <li>
                <strong>{t('privacy.secNotCollectedItem3Title', 'Sin Acceso a Sensores Privados:')}</strong> {t('privacy.secNotCollectedItem3Desc', 'La plataforma no accede a micrófonos, contactos, registros telefónicos ni archivos personales del dispositivo.')}
              </li>
              <li>
                <strong>{t('privacy.secNotCollectedItem4Title', 'Sin Datos Sensibles de Salud o Biometría Facial:')}</strong> {t('privacy.secNotCollectedItem4Desc', 'No se tratan categorías especiales de datos del Art. 9 RGPD (salud, huellas dactilares o reconocimiento facial).')}
              </li>
              <li>
                <strong>{t('privacy.secNotCollectedItem5Title', 'Sin Rastreo Comercial ni Cesión a Terceros:')}</strong> {t('privacy.secNotCollectedItem5Desc', 'No se monitoriza la actividad del usuario fuera de la aplicación ni se comercializan datos con anunciantes o redes publicitarias.')}
              </li>
            </ul>
          </div>

          {/* APARTADO 3: Cookies y Almacenamiento Técnico */}
          <div className="mb-5">
            <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '34px', height: '34px', backgroundColor: '#f1f5f9' }}>
                <FaCookieBite size={16} style={{ color: '#88982a' }} />
              </span>
              <span>{t('privacy.secCookiesTitle', '3. Cookies y Almacenamiento Técnico Estrictamente Necesario')}</span>
            </h4>
            <p className="text-muted mb-2">
              {t('privacy.secCookiesText', 'La plataforma NO emplea cookies de marketing, publicidad comportamental ni analítica de terceros. Únicamente se utiliza almacenamiento técnico local (Local Storage y Cookies de sesión) estrictamente imprescindible:')}
            </p>
            <ul className="text-muted ps-3 space-y-2">
              <li>
                <strong>{t('privacy.secCookiesItem1Title', 'Token de Sesión Criptográfico (jwt):')}</strong> {t('privacy.secCookiesItem1Desc', 'Almacena de forma segura el token JWT para mantener activa la sesión autenticada del usuario mientras navega.')}
              </li>
              <li>
                <strong>{t('privacy.secCookiesItem2Title', 'Preferencia de Idioma (i18nextLng):')}</strong> {t('privacy.secCookiesItem2Desc', 'Guarda el idioma seleccionado (ES, EN, PT, FR, DE, PL, BG, RO) para mostrar la interfaz en su lengua preferida.')}
              </li>
              <li>
                <strong>{t('privacy.secCookiesItem3Title', 'Canal WebSocket Seguro:')}</strong> {t('privacy.secCookiesItem3Desc', 'Mantiene la conexión en tiempo real para la recepción de notificaciones operativas inmediatas.')}
              </li>
            </ul>
            <p className="text-muted small mt-2 italic">
              {t('privacy.secCookiesLegalNote', '* Conforme al Art. 22.2 de la LSSI-CE y la Directiva ePrivacy europea, estas tecnologías técnicas esenciales no requieren consentimiento previo al ser indispensables para la prestación del servicio solicitado.')}
            </p>
          </div>

          {/* APARTADO 4: Cámara, Códigos QR y TOTP */}
          <div className="mb-5">
            <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '34px', height: '34px', backgroundColor: '#f1f5f9' }}>
                <FaCamera size={16} style={{ color: '#88982a' }} />
              </span>
              <span>{t('privacy.sec2Title', '4. Uso de Cámara, Códigos QR y Mecanismo TOTP')}</span>
            </h4>
            <p className="text-muted mb-2">
              {t('privacy.sec2Text', 'La interacción en el aula y los fichajes incorporan tecnología QR dinámica con las siguientes garantías:')}
            </p>
            <ul className="text-muted ps-3 space-y-2">
              <li>
                <strong>{t('privacy.sec2Item1Title', 'Acceso a la Cámara:')}</strong> {t('privacy.sec2Item1Desc', 'El permiso de cámara solicitado en navegadores móviles/escritorio se utiliza únicamente para el escaneo en tiempo real de códigos QR en el cliente. En ningún momento se graban, transmiten ni almacenan imágenes o vídeos de su dispositivo.')}
              </li>
              <li>
                <strong>{t('privacy.sec2Item2Title', 'Códigos QR Rotativos (TOTP):')}</strong> {t('privacy.sec2Item2Desc', 'Los códigos QR se actualizan dinámicamente cada 20 segundos mediante algoritmos TOTP basados en el tiempo, impidiendo la falsificación, capturas de pantalla o fichajes remotos no autorizados.')}
              </li>
              <li>
                <strong>{t('privacy.sec2Item3Title', 'Alternativa Manual:')}</strong> {t('privacy.sec2Item3Desc', 'En caso de indisponibilidad técnica de la cámara, el sistema ofrece un método seguro de entrada manual con código numérico de un solo uso.')}
              </li>
            </ul>
          </div>

          {/* APARTADO 5: Criptografía y Seguridad Técnica */}
          <div className="mb-5">
            <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '34px', height: '34px', backgroundColor: '#f1f5f9' }}>
                <FaLock size={16} style={{ color: '#88982a' }} />
              </span>
              <span>{t('privacy.sec3Title', '5. Medidas de Seguridad y Criptografía')}</span>
            </h4>
            <p className="text-muted mb-2">
              {t('privacy.sec3Text', 'Se implementan estándares avanzados de ciberseguridad industrial para salvaguardar sus datos:')}
            </p>
            <ul className="text-muted ps-3 space-y-2">
              <li>
                <strong>{t('privacy.sec3Item1Title', 'Cifrado de Credenciales:')}</strong> {t('privacy.sec3Item1Desc', 'Las contraseñas se almacenan mediante el algoritmo de hash unidireccional BCrypt con sal única. Las claves secretas de 2FA (TOTP) se encriptan en base de datos mediante AES-256.')}
              </li>
              <li>
                <strong>{t('privacy.sec3Item2Title', 'Protección contra Fuerza Bruta y Bots:')}</strong> {t('privacy.sec3Item2Desc', 'Mecanismos de bloqueo temporal automático tras reiterados intentos fallidos de acceso y verificación por Captcha dinámico SVG.')}
              </li>
              <li>
                <strong>{t('privacy.sec3Item3Title', 'Gestión de Sesiones (JWT & Blacklist):')}</strong> {t('privacy.sec3Item3Desc', 'Uso de tokens criptográficos JSON Web Tokens firmados. Al cerrar sesión o eliminar la cuenta, los tokens se incorporan a una lista negra inmediata de revocación.')}
              </li>
              <li>
                <strong>{t('privacy.sec3Item4Title', 'Comunicaciones Seguras:')}</strong> {t('privacy.sec3Item4Desc', 'Todo el tráfico entre su navegador y el servidor se canaliza bajo protocolos cifrados TLS/HTTPS y WebSockets seguros (WSS).')}
              </li>
            </ul>
          </div>

          {/* APARTADO 6: Auditoría e Integración Cloud */}
          <div className="mb-5">
            <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '34px', height: '34px', backgroundColor: '#f1f5f9' }}>
                <FaCloudUploadAlt size={16} style={{ color: '#88982a' }} />
              </span>
              <span>{t('privacy.sec4Title', '6. Trazabilidad, Auditoría y Almacenamiento en la Nube')}</span>
            </h4>
            <p className="text-muted mb-2">
              {t('privacy.sec4Text', 'Para garantizar la transparencia organizativa y la disponibilidad de la información:')}
            </p>
            <ul className="text-muted ps-3 space-y-2">
              <li>
                <strong>{t('privacy.sec4Item1Title', 'Auditoría Continua (AOP):')}</strong> {t('privacy.sec4Item1Desc', 'Las operaciones críticas del sistema generan registros inmutables de auditoría (hora UTC, acción, usuario e IP) accesibles únicamente por administradores autorizados.')}
              </li>
              <li>
                <strong>{t('privacy.sec4Item2Title', 'Copias de Seguridad e Integración OneDrive:')}</strong> {t('privacy.sec4Item2Desc', 'Los respaldos de la base de datos y la documentación complementaria de formaciones se sincronizan en repositorios seguros de Microsoft OneDrive mediante la API oficial Microsoft Graph (OAuth 2.0).')}
              </li>
            </ul>
          </div>

          {/* APARTADO 7: Derechos RGPD */}
          <div className="mb-5">
            <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '34px', height: '34px', backgroundColor: '#f1f5f9' }}>
                <FaUserSlash size={16} style={{ color: '#88982a' }} />
              </span>
              <span>{t('privacy.sec5Title', '7. Sus Derechos de Privacidad (RGPD / GDPR)')}</span>
            </h4>
            <p className="text-muted mb-2">
              {t('privacy.sec5Text', 'Usted dispone de pleno control sobre sus datos conforme al Reglamento General de Protección de Datos de la Unión Europea:')}
            </p>
            <ul className="text-muted ps-3 space-y-2">
              <li>
                <strong>{t('privacy.sec5Item1Title', 'Derecho de Acceso y Portabilidad:')}</strong> {t('privacy.sec5Item1Desc', 'Puede solicitar y descargar en cualquier momento desde su panel de perfil un informe consolidado con toda su información y registros.')}
              </li>
              <li>
                <strong>{t('privacy.sec5Item2Title', 'Derecho de Rectificación:')}</strong> {t('privacy.sec5Item2Desc', 'Tiene derecho a actualizar sus credenciales, claves 2FA y datos personales.')}
              </li>
              <li>
                <strong>{t('privacy.sec5Item3Title', 'Derecho al Olvido / Supresión:')}</strong> {t('privacy.sec5Item3Desc', 'Puede solicitar la eliminación permanente de su cuenta. Dicha acción revocará inmediatamente sus credenciales y desasociará sus datos según la normativa laboral aplicable.')}
              </li>
              <li>
                <strong>{t('privacy.sec5Item4Title', 'Derecho de Oposición y Limitación:')}</strong> {t('privacy.sec5Item4Desc', 'Puede consultar a la administración de la empresa o delegado de protección de datos el alcance de los tratamientos efectuados.')}
              </li>
            </ul>
          </div>

          {/* APARTADO 8: Base Legal */}
          <div className="mb-4">
            <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '34px', height: '34px', backgroundColor: '#f1f5f9' }}>
                <FaGavel size={16} style={{ color: '#88982a' }} />
              </span>
              <span>{t('privacy.sec6Title', '8. Base Jurídica del Tratamiento')}</span>
            </h4>
            <p className="text-muted">
              {t('privacy.sec6Text', 'El tratamiento de los datos se fundamenta en el cumplimiento de las obligaciones legales en materia de registro de jornada y prevención de riesgos laborales (Art. 6.1.c RGPD), en la ejecución de la relación laboral y planes de formación corporativa (Art. 6.1.b RGPD), y en el interés legítimo de la organización para salvaguardar la seguridad de sus sistemas e instalaciones (Art. 6.1.f RGPD).')}
            </p>
          </div>

          <div className="mt-5 p-4 rounded-4 text-center bg-slate-50 border border-slate-200">
            <p className="text-muted small m-0">
              {t('privacy.footerNotice', 'Al utilizar Distribution Academy Smart Check-in System, usted reconoce haber leído y comprendido esta Política de Privacidad, consintiendo el tratamiento conforme a las finalidades indicadas.')}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}