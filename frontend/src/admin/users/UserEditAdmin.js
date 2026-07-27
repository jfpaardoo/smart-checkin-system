import { Link } from "react-router-dom";
import { Form, Input, Label, FormGroup, Row, Col, UncontrolledDropdown, DropdownToggle, DropdownMenu, DropdownItem } from "reactstrap";
import { useTranslation } from "react-i18next";
import tokenService from "../../services/token.service";
import "../../static/css/admin/adminPage.css";
import getIdFromUrl from "../../util/getIdFromUrl";
import useFetchData from "../../util/useFetchData";
import useFetchState from "../../util/useFetchState";
import { CardGhostLoader } from "../../components/GhostLoader";
import { useToast } from "../../components/ToastProvider";

export default function UserEditAdmin() {
  const { t } = useTranslation();
  const jwt = tokenService.getLocalAccessToken();
  const emptyItem = {
    id: null,
    username: "",
    password: "",
    personalCode: "",
    firstName: "",
    lastName: "",
    isWorking: false,
    authority: null,
  };
  const id = getIdFromUrl(2);
  const toast = useToast();
  const [user, setUser, loading] = useFetchState(
    emptyItem,
    `/api/v1/users/${id}`,
    jwt,
    null,
    null,
    id
  );
  const auths = useFetchData(`/api/v1/users/authorities`, jwt);

  function handleChange(event) {
    const target = event.target;
    let value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    
    if (name === "personalCode") {
      value = value.replace(/\D/g, "").slice(0, 4);
    }

    if (name === "authority") {
      const auth = auths.find((a) => a.id === Number(value));
      setUser({ ...user, authority: auth });
    } else {
      setUser({ ...user, [name]: value });
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    fetch("/api/v1/users" + (user.id ? "/" + user.id : ""), {
      method: user.id ? "PUT" : "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(user),
    })
      .then((response) => response.json())
      .then((json) => {
        if (json.message) {
          let errorMsg = json.message;
          if (errorMsg.startsWith("{") && errorMsg.endsWith("}")) {
            errorMsg = errorMsg
              .slice(1, -1)
              .split(",")
              .map(err => {
                const [field, msg] = err.split("=");
                const formattedField = field.trim() === "authority" ? t('users.role') : field.trim();
                return `${formattedField}: ${msg.trim()}`;
              })
              .join("\n");
          } else if (errorMsg.includes("duplicate key value")) {
            if (errorMsg.includes("personal_code") || errorMsg.includes("personalCode")) {
              errorMsg = t('users.duplicatePersonalCode');
            } else if (errorMsg.includes("username")) {
              errorMsg = t('users.duplicateUsername');
            } else {
              errorMsg = t('users.duplicateGeneric');
            }
          }
          toast.error(errorMsg);
        } else {
          toast.success(user.id ? t('users.updated') : t('users.created'));
          setTimeout(() => { window.location.href = "/users"; }, 1200);
        }
      })
      .catch(() => toast.error(t('users.connectionError')));
  }

  if (id !== "new" && loading) {
    return <CardGhostLoader />;
  }

  return (
    <div className="ba-container justify-content-center">
      <div className="ba-card ba-card-form my-auto mx-auto">
        <div className="ba-card-header">
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

            <Col md={user.id ? 12 : 6}>
              <FormGroup>
                <Label for="authority">{t('users.roleAuthority')}</Label>
                <UncontrolledDropdown className="w-100">
                  <DropdownToggle
                    tag="button"
                    type="button"
                    className="ba-select-toggle w-100 d-flex align-items-center justify-content-between"
                  >
                    <span>{user.authority?.authority || t('users.selectRole')}</span>
                    <span className="dropdown-caret-icon">▼</span>
                  </DropdownToggle>
                  <DropdownMenu className="ba-dropdown-menu w-100">
                    {auths.map((auth) => (
                      <DropdownItem
                        key={auth.id}
                        className="ba-dropdown-item d-flex align-items-center justify-content-between"
                        onClick={() => setUser({ ...user, authority: auth })}
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
            <button className="ba-btn-primary" type="submit">
              {t('users.saveUser')}
            </button>
            <Link to="/users" className="ba-btn-secondary form-action-link">
              {t('users.cancel')}
            </Link>
          </div>
        </Form>
      </div>
    </div>
  );
}
