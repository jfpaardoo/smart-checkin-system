import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaArrowLeft, 
  FaHandshake, 
  FaUserShield, 
  FaBan, 
  FaCheckCircle, 
  FaCopyright, 
  FaServer, 
  FaUserTimes, 
  FaGavel,
  FaFileContract
} from "react-icons/fa";
import { useTranslation } from "react-i18next";

export default function TermsAndConditions() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="da-container">
      <div className="da-card">
        
        {/* BOTÓN VOLVER */}
        <div className="flex items-center justify-between mb-4">
          <button 
            type="button"
            onClick={() => navigate(-1)} 
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/50 dark:bg-slate-800/50 border border-white/70 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/80 text-xs sm:text-sm font-semibold transition-all duration-200 shadow-xs cursor-pointer"
          >
            <FaArrowLeft />
            <span>{t('common.back', 'Volver')}</span>
          </button>
        </div>

        {/* CABECERA CENTRADA */}
        <div className="text-center mb-8 pb-6 border-b border-white/40 dark:border-white/10">
          <div className="mx-auto mb-3 flex items-center justify-center w-16 h-16 rounded-2xl bg-[#b3c34c]/20 border border-[#b3c34c]/40 text-[#73841e] dark:text-[#d4e84a] shadow-xs">
            <FaFileContract size={30} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">
            {t('terms.title', 'Términos y Condiciones de Uso')}
          </h1>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-0">
            {t('terms.lastUpdated', 'Última actualización: Agosto de 2026')} • Distribution Academy
          </p>
        </div>

        <div className="text-left space-y-8 text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
          
          {/* APARTADO 1: Objeto y Ámbito de Aplicación */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#b3c34c]/15 text-[#73841e] dark:text-[#d4e84a] flex-shrink-0">
                <FaHandshake size={15} />
              </span>
              <span>{t('terms.sec1Title', '1. Objeto y Ámbito de Aplicación')}</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3">
              {t('terms.sec1Text', 'Las presentes condiciones regulan el acceso, navegación y utilización de la plataforma Smart Check-in provista por Distribution Academy:')}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec1Item1Title', 'Finalidad Operativa:')}</strong> {t('terms.sec1Item1Desc', 'La plataforma está destinada exclusivamente a la gestión formativa, verificación presencial de asistencia, emisión de convocatorias y control horario reglamentario.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec1Item2Title', 'Destinatarios y Usuarios:')}</strong> {t('terms.sec1Item2Desc', 'Aplica a todos los empleados, colaboradores, formadores, administradores y personal externo debidamente registrado.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec1Item3Title', 'Aceptación Vinculante:')}</strong> {t('terms.sec1Item3Desc', 'El acceso o utilización de la aplicación implica la adhesión plena y sin reservas a la totalidad de estos términos.')}
              </li>
            </ul>
          </div>

          {/* APARTADO 2: Cuentas de Usuario y Custodia de Credenciales */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#b3c34c]/15 text-[#73841e] dark:text-[#d4e84a] flex-shrink-0">
                <FaUserShield size={15} />
              </span>
              <span>{t('terms.sec2Title', '2. Cuentas de Usuario y Deber de Custodia del PIN')}</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3">
              {t('terms.sec2Text', 'La seguridad de las cuentas y la certeza de los registros descansan en la diligencia de cada usuario:')}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec2Item1Title', 'Carácter Personal e Intransferible:')}</strong> {t('terms.sec2Item1Desc', 'Las credenciales de acceso, contraseñas, PIN de 4 dígitos y llaves de acceso biométricas (Passkeys) son estrictamente personales.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec2Item2Title', 'Prohibición de Cesión:')}</strong> {t('terms.sec2Item2Desc', 'Queda expresamente prohibido compartir, transferir o divulgar el PIN o las claves a compañeros de trabajo o a terceras personas bajo ninguna circunstancia.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec2Item3Title', 'Notificación Inmediata de Incidentes:')}</strong> {t('terms.sec2Item3Desc', 'El usuario debe comunicar de forma inmediata a los administradores cualquier sospecha de compromiso, extravío o uso indebido de sus credenciales.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec2Item4Title', 'Responsabilidad del Titular:')}</strong> {t('terms.sec2Item4Desc', 'El titular de la cuenta responderá de todas las actividades y fichajes formalizados bajo su perfil hasta la comunicación fehaciente del incidente.')}
              </li>
            </ul>
          </div>

          {/* APARTADO 3: Normas de Conducta y Prohibición Expresa de Fraude */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#b3c34c]/15 text-[#73841e] dark:text-[#d4e84a] flex-shrink-0">
                <FaBan size={15} />
              </span>
              <span>{t('terms.sec3Title', '3. Normas de Conducta y Prohibición Expresa de Fraude')}</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3">
              {t('terms.sec3Text', 'Para garantizar la legalidad e integridad del registro horario y la asistencia a formaciones, se prohíbe de forma tajante:')}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec3Item1Title', 'Suplantación de Identidad:')}</strong> {t('terms.sec3Item1Desc', 'Fichar, firmar o registrar la presencia en nombre de otro empleado o asistente, esté o no presente en el centro de trabajo.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec3Item2Title', 'Captura y Difusión de Códigos QR:')}</strong> {t('terms.sec3Item2Desc', 'Fotografiar, capturar pantalla, retransmitir por mensajería o difundir por cualquier medio los códigos QR rotativos generados en sala.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec3Item3Title', 'Elusión de Medidas de Seguridad:')}</strong> {t('terms.sec3Item3Desc', 'Intentar desactivar, eludir o manipular los escudos de seguridad (anti-captura, TOTP temporal, rate limiting, validación de certificados TLS).')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec3Item4Title', 'Ataques y Automatizaciones:')}</strong> {t('terms.sec3Item4Desc', 'Ejecutar bots, scripts automatizados, herramientas de denegación de servicio (DoS) o ingeniería inversa sobre el software.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec3Item5Title', 'Régimen Sancionador:')}</strong> {t('terms.sec3Item5Desc', 'La alteración fraudulenta de registros o la suplantación de identidad constituirá falta laboral muy grave sujeta al régimen disciplinario y a las responsabilidades legales que correspondan.')}
              </li>
            </ul>
          </div>

          {/* APARTADO 4: Validez Probatoria del Fichaje y Firmas Digitales */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#b3c34c]/15 text-[#73841e] dark:text-[#d4e84a] flex-shrink-0">
                <FaCheckCircle size={15} />
              </span>
              <span>{t('terms.sec4Title', '4. Validez Probatoria del Fichaje y Firma Digital')}</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3">
              {t('terms.sec4Text', 'Los eventos generados a través de Smart Check-in poseen plena eficacia formal y probatoria:')}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec4Item1Title', 'Eficacia de los Check-ins:')}</strong> {t('terms.sec4Item1Desc', 'Los registros de asistencia formalizados mediante QR dinámico, PIN personal verificado o Passkey acreditan fehacientemente la asistencia del empleado a la acción formativa.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec4Item2Title', 'Firma Manuscrita Digitalizada:')}</strong> {t('terms.sec4Item2Desc', 'El trazo biométrico digitalizado al finalizar la sesión formativa tiene consideración de firma electrónica fehaciente conforme al Reglamento eIDAS.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec4Item3Title', 'Auditoría Criptográfica Inmutable (SHA-256):')}</strong> {t('terms.sec4Item3Desc', 'Todos los eventos se encadenan criptográficamente en base de datos impidiendo modificaciones retroactivas y asegurando la integridad probatoria ante inspecciones laborales.')}
              </li>
            </ul>
          </div>

          {/* APARTADO 5: Propiedad Intelectual e Industrial */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#b3c34c]/15 text-[#73841e] dark:text-[#d4e84a] flex-shrink-0">
                <FaCopyright size={15} />
              </span>
              <span>{t('terms.sec5Title', '5. Propiedad Intelectual e Industrial')}</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3">
              {t('terms.sec5Text', 'Todos los elementos de la plataforma son propiedad exclusiva de la entidad titular:')}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec5Item1Title', 'Titularidad de Software y Marcas:')}</strong> {t('terms.sec5Item1Desc', 'El código fuente, arquitectura, diseño visual, logotipos, marcas "Distribution Academy" y "Smart Check-in" están protegidos por las leyes de propiedad intelectual e industrial.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec5Item2Title', 'Licencia de Uso Limitada:')}</strong> {t('terms.sec5Item2Desc', 'Se concede al usuario una licencia temporal, intransferible y no exclusiva de uso estrictamente operativo dentro del ámbito laboral o formativo asignado.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec5Item3Title', 'Prohibición de Copia o Descompilación:')}</strong> {t('terms.sec5Item3Desc', 'Queda prohibida la reproducción, distribución, ingeniería inversa, desensamblado o comercialización de cualquier parte del sistema.')}
              </li>
            </ul>
          </div>

          {/* APARTADO 6: Disponibilidad del Servicio y Contingencias */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#b3c34c]/15 text-[#73841e] dark:text-[#d4e84a] flex-shrink-0">
                <FaServer size={15} />
              </span>
              <span>{t('terms.sec6Title', '6. Disponibilidad del Servicio y Medidas de Contingencia')}</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3">
              {t('terms.sec6Text', 'Se implementan altos estándares de resiliencia y continuidad de negocio:')}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec6Item1Title', 'Mantenimiento e Interrupciones:')}</strong> {t('terms.sec6Item1Desc', 'Distribution Academy procurará una disponibilidad continua, pudiendo programar ventanas de mantenimiento técnico comunicadas con antelación.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec6Item2Title', 'Procedimiento Alternativo de Contingencia:')}</strong> {t('terms.sec6Item2Desc', 'Ante fallos de cámara o problemas puntuales de conectividad, el empleado deberá emplear el mecanismo de introducción manual de PIN facilitado por el formador o comunicar la incidencia de inmediato a la administración.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec6Item3Title', 'Exención por Causas Ajenas:')}</strong> {t('terms.sec6Item3Desc', 'La entidad no será responsable de caídas imputables a los operadores de telecomunicaciones, dispositivos incompatibles de los usuarios o causas de fuerza mayor.')}
              </li>
            </ul>
          </div>

          {/* APARTADO 7: Suspensión y Terminación del Acceso */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#b3c34c]/15 text-[#73841e] dark:text-[#d4e84a] flex-shrink-0">
                <FaUserTimes size={15} />
              </span>
              <span>{t('terms.sec7Title', '7. Suspensión y Terminación del Acceso')}</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-3">
              {t('terms.sec7Text', 'La administración se reserva la facultad de suspender o revocar el acceso a la plataforma:')}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-slate-600 dark:text-slate-300">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec7Item1Title', 'Incumplimiento de Términos:')}</strong> {t('terms.sec7Item1Desc', 'En caso de indicios fundados de fraude, uso indebido, cesión de PIN o vulneración de las medidas de seguridad.')}
              </li>
              <li>
                <strong className="text-slate-800 dark:text-slate-200">{t('terms.sec7Item2Title', 'Extinción de la Relación:')}</strong> {t('terms.sec7Item2Desc', 'Al cesar la vinculación laboral o finalizar el plan formativo asignado al usuario, procediéndose al bloqueo seguro de la cuenta.')}
              </li>
            </ul>
          </div>

          {/* APARTADO 8: Legislación Aplicable y Fuero */}
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-200/60 dark:border-slate-800">
              <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#b3c34c]/15 text-[#73841e] dark:text-[#d4e84a] flex-shrink-0">
                <FaGavel size={15} />
              </span>
              <span>{t('terms.sec8Title', '8. Legislación Aplicable y Jurisdicción')}</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-0">
              {t('terms.sec8Text', 'Las presentes condiciones se rigen por la legislación española y el marco normativo de la Unión Europea. Para dirimir cualquier litigio o discrepancia derivada del uso del sistema, las partes se someten a los juzgados y tribunales competentes de acuerdo con la legislación procesal y laboral aplicable.')}
            </p>
          </div>

          {/* PIE / DECLARACIÓN DE CONFORMIDAD */}
          <div className="mt-8 p-4 rounded-2xl text-center bg-white/40 dark:bg-slate-800/40 border border-white/60 dark:border-white/10">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">
              {t('terms.footerNotice', 'Al acceder y utilizar el sistema Smart Check-in de Distribution Academy, usted declara haber leído, comprendido y aceptado en su totalidad estos Términos y Condiciones de Uso.')}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
