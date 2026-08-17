import React, { useState } from "react";
import { Form, Input, Label, FormGroup, Row, Col } from "reactstrap";
import { Link } from "react-router-dom";
import { FaUserEdit, FaUserPlus, FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import GlassDropdown from "../../components/GlassDropdown";
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

function UserEditHeader({ isEdit, t }) {
  return (
    <div className="relative mb-6 pb-4 border-b border-white/30 text-center">
      <Link
        to="/users"
        className="absolute left-0 top-0 p-2.5 rounded-2xl bg-white/50 border border-white/70 text-slate-600 hover:text-slate-900 hover:bg-white hover:scale-105 active:scale-95 transition shadow-xs flex items-center justify-center"
        title={t("common.back", "Volver")}
      >
        <FaArrowLeft size={16} />
      </Link>
      <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-[#b3c34c]/20 text-[#8fa228] shadow-xs mb-2">
        {isEdit ? <FaUserEdit size={26} /> : <FaUserPlus size={26} />}
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">
        {isEdit ? t('users.editUser', 'Editar Usuario') : t('users.addNewUser', 'Nuevo Usuario')}
      </h2>
      <p className="text-xs text-slate-500 mb-0">
        {isEdit 
          ? t('users.editSubtitle', 'Modifica la información, rol, localizador y centro de trabajo del usuario')
          : t('users.newSubtitle', 'Registra un nuevo usuario en la plataforma')}
      </p>
    </div>
  );
}

function UserEditActionButtons({ isEdit, isSaving, t }) {
  const submitText = isEdit ? t('users.saveUser', 'Guardar') : t('users.addNewUser', 'Crear');
  return (
    <div className="form-action-group">
      <button className="da-btn-primary" type="submit" disabled={isSaving}>
        {isSaving ? t('common.saving') : submitText}
      </button>
      <button type="button" onClick={() => window.history.back()} className="da-btn-secondary form-action-link" disabled={isSaving}>
        {t('users.cancel')}
      </button>
    </div>
  );
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

  return (
    <div className="da-container justify-content-center">
      <div className="da-card da-card-form my-auto mx-auto" style={{ maxWidth: "820px" }}>
        <UserEditHeader isEdit={isEdit} t={t} />

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="username">{t('users.username')}</Label>
                <Input
                  type="text"
                  required
                  name="username"
                  id="username"
                  autoComplete="username"
                  value={user.username || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </Col>

            {!isEdit ? (
              <Col md={6}>
                <FormGroup>
                  <Label for="password">{t('users.password')}</Label>
                  <Input
                    type="password"
                    required
                    name="password"
                    id="password"
                    autoComplete="current-password"
                    value={user.password || ""}
                    onChange={handleChange}
                  />
                </FormGroup>
              </Col>
            ) : (
              <Col md={6}>
                <FormGroup>
                  <Label for="personalCode">{t('users.personalCode4digits')}</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength="4"
                    name="personalCode"
                    id="personalCode"
                    value={user.personalCode || ""}
                    onChange={handleChange}
                  />
                </FormGroup>
              </Col>
            )}

            <Col md={6}>
              <FormGroup>
                <Label for="firstName">{t('users.firstName')}</Label>
                <Input
                  type="text"
                  required
                  name="firstName"
                  id="firstName"
                  value={user.firstName || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label for="lastName">{t('users.lastName')}</Label>
                <Input
                  type="text"
                  required
                  name="lastName"
                  id="lastName"
                  value={user.lastName || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label for="email">{t('users.email')}</Label>
                <Input
                  type="email"
                  required
                  name="email"
                  id="email"
                  autoComplete="email"
                  value={user.email || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </Col>

            {!isEdit && (
              <Col md={6}>
                <FormGroup>
                  <Label for="personalCode">{t('users.personalCode4digits')}</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength="4"
                    name="personalCode"
                    id="personalCode"
                    value={user.personalCode || ""}
                    onChange={handleChange}
                  />
                </FormGroup>
              </Col>
            )}
            
            <Col md={6}>
              <FormGroup>
                <Label for="authority">{t('users.role')}</Label>
                <GlassDropdown
                  options={roleOptions}
                  value={user.authority?.id || ''}
                  onChange={(val) => handleChange({ target: { name: 'authority', value: val } })}
                  placeholder={t('users.selectRole', '-- Seleccionar Rol --')}
                  className="w-100"
                />
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label for="company">{t('users.company', 'Empresa / Centro')}</Label>
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
                  className="w-100"
                />
              </FormGroup>
            </Col>

            {/* Localizador como Desplegable Liquid Glass */}
            <Col md={6}>
              <FormGroup>
                <Label for="locator">{t('users.locator', 'Localizador / Sede')}</Label>
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
                    className="w-100"
                  />

                  {showCustomInput && (
                    <Input
                      type="text"
                      name="locator"
                      id="customLocator"
                      maxLength="10"
                      placeholder={t('users.locatorPlaceholder', 'Escribe el localizador (Ej: MAD, BCN, PT...)')}
                      value={user.locator || ""}
                      onChange={handleChange}
                      className="uppercase mt-1"
                      autoFocus
                    />
                  )}
                </div>
              </FormGroup>
            </Col>
          </Row>

          <UserEditActionButtons isEdit={isEdit} isSaving={isSaving} t={t} />
        </Form>
      </div>
    </div>
  );
}
