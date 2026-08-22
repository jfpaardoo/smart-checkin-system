import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaUserEdit, FaUserPlus, FaSave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import GlassDropdown from "../../components/GlassDropdown";
import GlassFormHeader from "../../components/GlassFormHeader";
import GlassButton from "../../components/GlassButton";
import getIdFromUrl from "../../util/getIdFromUrl";
import { CardGhostLoader } from "../../components/GhostLoader";
import { useToast } from "../../components/ToastProvider";
import { useUserEdit } from "./hooks/useUserEdit";

const PREDEFINED_LOCATORS = [
  "AV", "MG", "VF", "LE", "VN", "SI", "JE", "SO", "PV", "BU", "OR", "MX"
];

function getLocatorDropdownValue(locator, isCustomLocator) {
  if (!locator) return "";
  if (PREDEFINED_LOCATORS.includes(locator) && !isCustomLocator) {
    return locator;
  }
  return "OTHER";
}

export default function UserEditAdmin() {
  const { t } = useTranslation();
  const jwt = tokenService.getUser();
  const id = getIdFromUrl(2);
  const toast = useToast();
  const [isCustomLocator, setIsCustomLocator] = useState(false);

  const {
    user,
    auths,
    companies,
    loading,
    isSaving,
    handleChange,
    handleSubmit
  } = useUserEdit(id, jwt, toast, t);

  const roleOptions = React.useMemo(() => {
    return auths.reduce((acc, auth) => {
      if (auth.authority === 'ADMIN' || auth.authority === 'EMPLOYEE') {
        acc.push({
          value: auth.id,
          label: auth.authority === 'EMPLOYEE' ? 'EMPLOYEE' : 'ADMIN'
        });
      }
      return acc;
    }, []);
  }, [auths]);

  if (id !== "new" && loading) {
    return <CardGhostLoader />;
  }

  const isEdit = Boolean(user.id);
  const dropdownValue = getLocatorDropdownValue(user.locator, isCustomLocator);
  const showCustomInput = isCustomLocator || (user.locator && !PREDEFINED_LOCATORS.includes(user.locator));
  const submitText = isEdit ? t('users.saveUser', 'Guardar') : t('users.addNewUser', 'Crear');

  return (
    <div className="da-container justify-content-center">
      <div className="da-card da-card-form my-auto mx-auto" style={{ maxWidth: "820px" }}>
        <GlassFormHeader
          icon={isEdit ? FaUserEdit : FaUserPlus}
          title={isEdit ? t('users.editUser', 'Editar Usuario') : t('users.addNewUser', 'Nuevo Usuario')}
          subtitle={isEdit
            ? t('users.editSubtitle', 'Modifica la información, rol, localizador y centro de trabajo del usuario')
            : t('users.newSubtitle', 'Registra un nuevo usuario en la plataforma')}
          backUrl="/users"
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="username" className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                {t('users.username')}
              </label>
              <input
                type="text"
                required
                name="username"
                id="username"
                autoComplete="username"
                value={user.username || ""}
                onChange={handleChange}
                className="da-input w-full"
              />
            </div>

            {!isEdit ? (
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                  {t('users.password')}
                </label>
                <input
                  type="password"
                  required
                  name="password"
                  id="password"
                  autoComplete="current-password"
                  value={user.password || ""}
                  onChange={handleChange}
                  className="da-input w-full"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="personalCode" className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                  {t('users.personalCode4digits')}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength="4"
                  name="personalCode"
                  id="personalCode"
                  value={user.personalCode || ""}
                  onChange={handleChange}
                  className="da-input w-full"
                />
              </div>
            )}

            <div>
              <label htmlFor="firstName" className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                {t('users.firstName')}
              </label>
              <input
                type="text"
                required
                name="firstName"
                id="firstName"
                value={user.firstName || ""}
                onChange={handleChange}
                className="da-input w-full"
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                {t('users.lastName')}
              </label>
              <input
                type="text"
                required
                name="lastName"
                id="lastName"
                value={user.lastName || ""}
                onChange={handleChange}
                className="da-input w-full"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                {t('users.email')}
              </label>
              <input
                type="email"
                required
                name="email"
                id="email"
                autoComplete="email"
                value={user.email || ""}
                onChange={handleChange}
                className="da-input w-full"
              />
            </div>

            {!isEdit && (
              <div>
                <label htmlFor="personalCode" className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                  {t('users.personalCode4digits')}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  maxLength="4"
                  name="personalCode"
                  id="personalCode"
                  value={user.personalCode || ""}
                  onChange={handleChange}
                  className="da-input w-full"
                />
              </div>
            )}
            
            <div>
              <label htmlFor="authority" className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                {t('users.role')}
              </label>
              <GlassDropdown
                options={roleOptions}
                value={user.authority?.id || ''}
                onChange={(val) => handleChange({ target: { name: 'authority', value: val } })}
                placeholder={t('users.selectRole', '-- Seleccionar Rol --')}
                className="w-full"
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                {t('users.company', 'Empresa / Centro')}
              </label>
              <GlassDropdown
                options={[
                  { value: '', label: t('users.noCompany', '-- Sin Empresa Asignada --') },
                  ...companies.map((comp) => ({
                    value: comp.id,
                    label: comp.name
                  }))
                ]}
                value={user.company?.id || ''}
                onChange={(val) => handleChange({ target: { name: 'company', value: val } })}
                placeholder={t('users.noCompany', '-- Sin Empresa Asignada --')}
                searchable={companies.length > 4}
                className="w-full"
              />
            </div>

            {/* Localizador como Desplegable Liquid Glass */}
            <div>
              <label htmlFor="locator" className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                {t('users.locator', 'Localizador / Sede')}
              </label>
              <div className="flex flex-col gap-2">
                <GlassDropdown
                  options={[
                    { value: '', label: t('users.noLocator', '-- Sin Localizador --') },
                    ...PREDEFINED_LOCATORS.map((loc) => ({ value: loc, label: `Sede ${loc}` })),
                    { value: 'OTHER', label: t('users.otherLocator', 'Otro localizador...') }
                  ]}
                  value={dropdownValue}
                  onChange={(val) => {
                    if (val === 'OTHER') {
                      setIsCustomLocator(true);
                    } else {
                      setIsCustomLocator(false);
                      handleChange({ target: { name: 'locator', value: val } });
                    }
                  }}
                  placeholder={t('users.selectLocator', '-- Seleccionar Localizador --')}
                  searchable={true}
                  className="w-full"
                />

                {showCustomInput && (
                  <input
                    type="text"
                    name="locator"
                    id="customLocator"
                    maxLength="10"
                    placeholder={t('users.locatorPlaceholder', 'Escribe el localizador (Ej: MAD, BCN, PT...)')}
                    value={user.locator || ""}
                    onChange={handleChange}
                    className="da-input uppercase mt-1 w-full"
                    autoFocus
                  />
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-white/30 dark:border-white/10 w-full">
            <Link to="/users" className="da-btn-secondary w-full sm:w-auto text-center text-decoration-none">
              {t('users.cancel')}
            </Link>
            <GlassButton
              type="submit"
              variant="primary"
              loading={isSaving}
              loadingText={t('common.saving', 'Guardando...')}
              icon={FaSave}
              className="w-full sm:w-auto px-6 py-2.5 rounded-2xl shadow-md"
            >
              {submitText}
            </GlassButton>
          </div>
        </form>
      </div>
    </div>
  );
}
