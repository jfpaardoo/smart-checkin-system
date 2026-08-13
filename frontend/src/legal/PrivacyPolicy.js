import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaArrowLeft, FaDatabase, FaLock, FaUserSlash } from "react-icons/fa";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="da-container justify-content-center min-vh-100 py-5">
      <div 
        className="da-card p-4 p-md-5 mx-auto" 
        style={{ maxWidth: '900px', backgroundColor: 'rgba(255, 255, 255, 0.85)' }}
      >
        <button 
          type="button"
          onClick={() => navigate(-1)} 
          className="btn btn-link text-dark text-decoration-none p-0 mb-3 d-flex align-items-center gap-2 fw-bold"
        >
          <FaArrowLeft /> Volver
        </button>

        {/* CABECERA CENTRADA: Escudo arriba de la Política de Privacidad */}
        <div className="text-center mb-5">
          <div 
            className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle shadow-sm"
            style={{
              width: '64px',
              height: '64px',
              backgroundColor: 'rgba(179, 195, 76, 0.2)',
              border: '1px solid rgba(179, 195, 76, 0.4)'
            }}
          >
            <FaShieldAlt size={32} style={{ color: '#88982a' }} />
          </div>
          <h1 className="fw-extrabold text-slate-800 mb-2" style={{ fontSize: '2.2rem' }}>
            Política de Privacidad
          </h1>
          <p className="text-muted small fw-semibold">Última actualización: Agosto de 2026</p>
        </div>

        <div className="text-start text-slate-700" style={{ lineHeight: '1.7', fontSize: '0.95rem' }}>
          
          {/* APARTADO 1 */}
          <div className="mb-4">
            <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '32px', height: '32px', backgroundColor: '#f1f5f9' }}>
                <FaDatabase size={15} style={{ color: '#88982a' }} />
              </span>
              <span>1. Datos que recopilamos</span>
            </h4>
            <p className="text-muted">
              El <strong>Smart Check-in System de Distribution Academy</strong> recopila exclusivamente los datos necesarios para garantizar la seguridad operativa y el control de asistencia. Esto incluye:
            </p>
            <ul className="text-muted ps-3">
              <li><strong>Datos identificativos:</strong> Nombre, apellidos, correo electrónico y su Código Personal (PIN de 4 dígitos).</li>
              <li><strong>Datos biométricos y de comportamiento:</strong> Trazo de firma digital manuscrita (almacenada en formato Base64) requerida obligatoriamente para validar los fichajes de salida y asistencia a formaciones.</li>
              <li><strong>Trazabilidad y Auditoría:</strong> Su dirección IP, fecha, hora y detalles de navegación son registrados de forma inmutable cada vez que realiza operaciones críticas (inicios de sesión, fichajes o cambios de contraseña) para prevenir fraudes.</li>
            </ul>
          </div>

          {/* APARTADO 2 */}
          <div className="mb-4">
            <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '32px', height: '32px', backgroundColor: '#f1f5f9' }}>
                <FaLock size={15} style={{ color: '#88982a' }} />
              </span>
              <span>2. Seguridad y Almacenamiento</span>
            </h4>
            <p className="text-muted">
              Aplicamos medidas de seguridad de grado empresarial para proteger su información:
            </p>
            <ul className="text-muted ps-3">
              <li><strong>Criptografía:</strong> Las contraseñas se almacenan cifradas (Bcrypt) y los secretos de su autenticación de doble factor (TOTP) se encriptan en la base de datos mediante el algoritmo AES-256.</li>
              <li><strong>Infraestructura Cloud:</strong> Los datos se almacenan en servidores seguros. Las copias de seguridad cifradas de la base de datos, así como los adjuntos de formaciones, se sincronizan e integran en servidores de Microsoft OneDrive mediante Graph API (OAuth 2.0).</li>
            </ul>
          </div>

          {/* APARTADO 3 */}
          <div className="mb-4">
            <h4 className="fw-bold text-dark d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
              <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0" style={{ width: '32px', height: '32px', backgroundColor: '#f1f5f9' }}>
                <FaUserSlash size={15} style={{ color: '#88982a' }} />
              </span>
              <span>3. Sus Derechos (RGPD)</span>
            </h4>
            <p className="text-muted">
              Usted mantiene el control total sobre su información personal conforme al Reglamento General de Protección de Datos (RGPD). A través de su perfil de usuario, el sistema le permite de forma automatizada:
            </p>
            <ul className="text-muted ps-3">
              <li><strong>Derecho a la Portabilidad:</strong> Descargar un informe completo con todos sus datos y métricas personales.</li>
              <li><strong>Derecho al Olvido:</strong> Solicitar la eliminación total de su cuenta. Ejecutar esta acción revocará instantáneamente sus tokens de sesión (JWT Blacklist) y anonimizará o eliminará sus registros según lo permita la normativa laboral vigente.</li>
            </ul>
          </div>

          <div className="mt-5 p-3 rounded-4 text-center bg-light border border-white">
            <p className="text-muted small m-0">
              Al utilizar Distribution Academy, usted consiente el tratamiento de estos datos para los fines de control horario e integridad operativa del sistema descritos en este documento.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}