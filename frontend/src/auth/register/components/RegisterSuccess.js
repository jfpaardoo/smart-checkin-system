import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

export default function RegisterSuccess({ t }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-6">
      <div 
        className="inline-flex items-center justify-center p-5 rounded-full mb-5 shadow-sm" 
        style={{ background: 'rgba(179, 195, 76, 0.2)', color: '#8fa228' }}
      >
        <FaCheckCircle className="text-5xl" />
      </div>
      <h3 className="text-2xl font-bold text-slate-800 mb-2">
        {t('register.receivedTitle', '¡Solicitud Enviada!')}
      </h3>
      <p className="text-sm text-slate-600 mb-8 leading-relaxed max-w-sm">
        {t('register.receivedDesc', 'Tu solicitud ha sido registrada correctamente. Un administrador la revisará y activará tu perfil para que puedas iniciar sesión.')}
      </p>
      
      <Link 
        to="/login" 
        className="w-full inline-flex items-center justify-center py-3.5 px-6 rounded-full font-semibold text-slate-900 bg-[#b3c34c]/60 hover:bg-[#b3c34c]/80 border border-white/80 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_8px_20px_rgba(179,195,76,0.3)] transition duration-300 hover:-translate-y-0.5 active:scale-95 no-underline"
      >
        {t('register.goToLogin', 'Volver al Inicio de Sesión')}
      </Link>
    </div>
  );
}
