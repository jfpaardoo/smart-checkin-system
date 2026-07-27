import React from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "../../components/ToastProvider";
import FormGenerator from "../../components/formGenerator/formGenerator";
import tokenService from "../../services/token.service";
import "../../App.css";
import "../../static/css/auth/authButton.css";
import { loginFormInputs } from "./form/loginFormInputs";

export default function Login() {
  const { t } = useTranslation();
  const toast = useToast();
  const localizedInputs = loginFormInputs.map(input => {
    if (input.name === 'username') {
      return { ...input, tag: t('login.username', t('users.username', 'Usuario')) };
    }
    if (input.name === 'password') {
      return { ...input, tag: t('login.password', t('users.password', 'Contraseña')) };
    }
    return input;
  });

  async function handleSubmit({ values }) {
    const reqBody = values;
    await fetch("/api/v1/auth/signin", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify(reqBody),
    })
      .then(function (response) {
        if (response.status === 200) return response.json();
        else throw new Error(t('login.error'));
      })
      .then(function (data) {
        toast.success(t('login.success'));
        tokenService.setUser(data);
        tokenService.updateLocalAccessToken(data.token);
        setTimeout(() => { window.location.href = "/"; }, 1000);
      })
      .catch((error) => {         
        toast.error(error.message || t('login.genericError'));
      });            
  }

    return (
      <div className="auth-page-container">
        <h1>{t('login.title')}</h1>
        <div className="auth-form-container">
          <FormGenerator
            inputs={localizedInputs}
            onSubmit={handleSubmit}
            numberOfColumns={1}
            listenEnterKey
            buttonText={t('login.title')}
            buttonClassName="auth-button"
          />
        </div>
      </div>
    );  
}