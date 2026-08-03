import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../static/css/auth/authButton.css";
import "../../static/css/auth/authPage.css";
import tokenService from "../../services/token.service";
import { useToast } from "../../components/ToastProvider";

const Logout = () => {
  const { t } = useTranslation();
  const toast = useToast();

  async function sendLogoutRequest() {
    const jwt = tokenService.getLocalAccessToken();
    if (jwt !== null && jwt !== undefined) {
      try {
        await fetch("/api/v1/auth/logout", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${jwt}`,
            "Content-Type": "application/json"
          }
        });
      } catch (error) {
        console.error("Error logging out on server", error);
      } finally {
        tokenService.removeUser();
        window.location.href = "/";
      }
    } else {
      toast.error(t('common.noUserLoggedIn', 'There is no user logged in'));
    }
  }

  return (
    <div className="auth-page-container">
      <div className="auth-form-container">
        <h2 className="text-center text-slate-800 font-bold mb-6 text-2xl">
          {t('common.confirmLogout', 'Are you sure you want to log out?')}
        </h2>
        <div className="options-row">
          <Link className="auth-button danger" to="/" style={{ textDecoration: "none" }}>
            {t('common.no', 'No')}
          </Link>
          <button type="button" className="auth-button blue" onClick={() => sendLogoutRequest()}>
            {t('common.yes', 'Yes')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Logout;
