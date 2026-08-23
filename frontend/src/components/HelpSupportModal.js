import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaHeadset, FaEnvelope, FaClock, FaChevronDown, FaChevronUp, FaCopy, FaCheck, FaQuestionCircle, FaShieldAlt, FaPaperPlane } from 'react-icons/fa';
import GlassModal from './GlassModal';
import soundAndHaptics from '../util/soundAndHaptics';

export default function HelpSupportModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const SUPPORT_EMAIL = 'vpardo1972@gmail.com';
  const MAILTO_LINK = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Consulta de Soporte - Smart Check-in')}`;

  const handleCopyEmail = (e) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      soundAndHaptics.playSuccess();
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const toggleFaq = (id) => {
    soundAndHaptics.playClick();
    setExpandedFaq(prev => prev === id ? null : id);
  };

  const faqs = [
    {
      id: 'camera_qr',
      q: t('support.faq1_q', '¿Cómo ficho si la cámara no lee el código QR?'),
      a: t('support.faq1_a', 'Pulsa en el botón "Introducir código manualmente" en la pantalla de escaneo e introduce el código de 6 dígitos que el formador tiene visible en su pantalla.')
    },
    {
      id: 'signature_req',
      q: t('support.faq2_q', '¿Por qué se solicita mi firma digital al salir?'),
      a: t('support.faq2_a', 'El protocolo oficial de calidad y homologación (FOR 99 HRS) requiere registrar la firma manuscrita de cada participante para certificar la asistencia.')
    },
    {
      id: 'offline_coverage',
      q: t('support.faq3_q', '¿Qué ocurre si no tengo conexión a internet o cobertura?'),
      a: t('support.faq3_a', 'Smart Check-in dispone de sincronización offline automática. Tu fichaje se guardará de forma segura en tu dispositivo y se enviará en cuanto recuperes conexión.')
    },
    {
      id: 'forgot_password',
      q: t('support.faq4_q', '¿Cómo recupero mi contraseña de acceso?'),
      a: t('support.faq4_a', 'Haz clic en "¿Olvidaste tu contraseña?" en la pantalla de inicio de sesión y recibirás un correo electrónico seguro con un enlace de restablecimiento.')
    }
  ];

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('support.modalTitle', 'Centro de Ayuda y Soporte')}
      maxWidth="max-w-xl"
    >
      <div className="space-y-6 text-slate-800 dark:text-slate-100">
        
        {/* Header Badge */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900/5 to-slate-900/10 dark:from-white/5 dark:to-white/10 border border-slate-200/60 dark:border-white/10">
          <div className="w-12 h-12 rounded-2xl bg-[#b3c34c]/20 border border-[#b3c34c]/40 flex items-center justify-center text-[#8a9e22] dark:text-[#d4e84a] shrink-0 text-xl shadow-sm">
            <FaHeadset />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white m-0">
              {t('support.assistanceTitle', '¿Tienes alguna incidencia o duda?')}
            </h4>
            <p className="text-xs text-slate-500 dark:text-white/70 m-0 mt-0.5">
              {t('support.assistanceSubtitle', 'Estamos a tu disposición para resolver dudas sobre formaciones, fichajes o accesos.')}
            </p>
          </div>
        </div>

        {/* Email Support Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900/5 via-white/40 to-slate-900/10 dark:from-white/10 dark:via-white/5 dark:to-white/10 border border-slate-200/80 dark:border-white/15 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-[#7a8a18] dark:text-[#d4e84a] mb-1">
                {t('support.officialEmailChannel', 'Canal Oficial de Soporte')}
              </span>
              <div className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white break-all flex items-center gap-2">
                <FaEnvelope className="text-[#8a9e22] dark:text-[#d4e84a] shrink-0" />
                <span>{SUPPORT_EMAIL}</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-white/70 m-0 mb-4 leading-relaxed">
            {t('support.emailDescription', 'Escríbenos directamente indicando tu nombre, empresa e incidencia para recibir asistencia rápida.')}
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <a
              href={MAILTO_LINK}
              onClick={() => soundAndHaptics.playClick()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs shadow-sm hover:opacity-90 transition-all no-underline"
            >
              <FaPaperPlane className="text-xs" />
              <span>{t('support.sendEmailNow', 'Enviar correo ahora')}</span>
            </a>

            <button
              type="button"
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-200/80 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white font-semibold text-xs transition-all border-0 cursor-pointer"
            >
              {copied ? (
                <>
                  <FaCheck className="text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{t('support.copied', '¡Copiado!')}</span>
                </>
              ) : (
                <>
                  <FaCopy />
                  <span>{t('support.copyEmail', 'Copiar dirección')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* SLA and Business Hours Badge */}
        <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-white/70">
            <FaClock className="text-[#8a9e22] dark:text-[#d4e84a]" />
            <span>{t('support.schedule', 'Horario: Lunes a Viernes · 08:00 a 18:00')}</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{t('support.slaResponse', 'Respuesta media < 2h')}</span>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-white/60 mb-3 flex items-center gap-1.5">
            <FaQuestionCircle className="text-[#8a9e22] dark:text-[#d4e84a]" />
            {t('support.faqTitle', 'Preguntas frecuentes')}
          </h5>
          <div className="space-y-2">
            {faqs.map((faq) => (
              <div 
                key={faq.id}
                className="rounded-xl border border-slate-200/80 dark:border-white/10 overflow-hidden bg-white/40 dark:bg-white/5 transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full px-4 py-3 text-left font-semibold text-xs sm:text-sm text-slate-800 dark:text-white flex items-center justify-between gap-3 bg-transparent border-0 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {expandedFaq === faq.id ? (
                    <FaChevronUp className="text-slate-400 shrink-0 text-xs" />
                  ) : (
                    <FaChevronDown className="text-slate-400 shrink-0 text-xs" />
                  )}
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-4 pb-3 text-xs text-slate-600 dark:text-white/80 border-t border-slate-200/50 dark:border-white/5 pt-2 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Button: Close Modal */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200/60 dark:border-white/10">
          <p className="text-[11px] text-slate-400 dark:text-white/40 flex items-center gap-1.5 m-0">
            <FaShieldAlt className="text-slate-400 shrink-0" />
            <span>{t('support.confidentiality', 'Distribution Academy · Soporte Técnico Seguro')}</span>
          </p>

          <button
            type="button"
            onClick={() => {
              soundAndHaptics.playClick();
              onClose();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-slate-900/10 hover:bg-slate-900/20 dark:bg-white/10 dark:hover:bg-white/20 text-slate-800 dark:text-white font-bold text-xs transition-all border border-slate-300/60 dark:border-white/15 cursor-pointer shadow-sm"
          >
            {t('common.close', 'Cerrar ventana')}
          </button>
        </div>

      </div>
    </GlassModal>
  );
}
