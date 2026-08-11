import React from "react";
import { Form, Input, Label, FormGroup, Row, Col, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import "../../App.css";
import "../../static/css/admin/adminPage.css";
import getIdFromUrl from "../../util/getIdFromUrl";
import { CardGhostLoader } from "../../components/GhostLoader";
import { useToast } from "../../components/ToastProvider";
import { useUserEdit } from "./hooks/useUserEdit";

export default function UserEditAdmin() {
  const { t } = useTranslation();
  const jwt = tokenService.getLocalAccessToken();
  const id = getIdFromUrl(2);
  const toast = useToast();

  const {
    user,
    auths,
    loading,
    isSaving,
    handleChange,
    handleSubmit
  } = useUserEdit(id, jwt, toast, t);

  if (id !== "new" && loading) {
    return <CardGhostLoader />;
  }

  return (
    <div className="da-container justify-content-center">
      <div className="da-card da-card-form my-auto mx-auto">
        <div className="da-card-header">
          <h2>{user.id ? t('users.editUser') : t('users.addNewUser')}</h2>
        </div>
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
                  value={user.username || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </Col>

            {!user.id ? (
              <Col md={6}>
                <FormGroup>
                  <Label for="password">{t('users.password')}</Label>
                  <Input
                    type="password"
                    required
                    name="password"
                    id="password"
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
                    minLength="4"
                    pattern="\d{4}"
                    name="personalCode"
                    id="personalCode"
                    value={user.personalCode || ""}
                    onChange={handleChange}
                  />
                </FormGroup>
              </Col>
            )}
          </Row>

          <Row>
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
          </Row>

          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="email">{t('users.email', 'Correo Electrónico')}</Label>
                <Input
                  type="email"
                  required
                  name="email"
                  id="email"
                  value={user.email || ""}
                  onChange={handleChange}
                />
              </FormGroup>
            </Col>

            {!user.id && (
              <Col md={6}>
                <FormGroup>
                  <Label for="personalCode">{t('users.personalCode4digits')}</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength="4"
                    minLength="4"
                    pattern="\d{4}"
                    name="personalCode"
                    id="personalCode"
                    value={user.personalCode || ""}
                    onChange={handleChange}
                  />
                </FormGroup>
              </Col>
            )}
            
            <Col md={user.id ? 6 : 12}>
              <FormGroup>
                <Label for="authority">{t('users.role')}</Label>
                <UncontrolledDropdown className="w-100">
                  <DropdownToggle
                    tag="button"
                    type="button"
                    className="da-select-toggle w-100 d-flex align-items-center justify-content-between"
                  >
                    <span>{user.authority?.authority || t('users.selectRole')}</span>
                    <span className="dropdown-caret-icon">▼</span>
                  </DropdownToggle>
                  <DropdownMenu className="da-dropdown-menu w-100">
                    {auths.map((auth) => (
                      <DropdownItem
                        key={auth.id}
                        className="da-dropdown-item d-flex align-items-center justify-content-between"
                        onClick={() => handleChange({ target: { name: 'authority', value: auth.id } })}
                      >
                        <span>{auth.authority}</span>
                        {user.authority?.id === auth.id && <span className="ms-2">✓</span>}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </UncontrolledDropdown>
              </FormGroup>
            </Col>
          </Row>

          <div className="form-action-group">
            <button className="da-btn-primary" type="submit" disabled={isSaving}>
              {isSaving ? t('common.saving') : null}
              {!isSaving && user.id ? t('users.saveUser', 'Guardar') : null}
              {!isSaving && !user.id ? t('users.addNewUser') : null}
            </button>
            <button type="button" onClick={() => window.history.back()} className="da-btn-secondary form-action-link" disabled={isSaving}>
              {t('users.cancel')}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
