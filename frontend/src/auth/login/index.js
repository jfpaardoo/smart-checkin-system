import React from "react";
import { useToast } from "../../components/ToastProvider";
import FormGenerator from "../../components/formGenerator/formGenerator";
import tokenService from "../../services/token.service";
import "../../static/css/auth/authButton.css";
import { loginFormInputs } from "./form/loginFormInputs";

export default function Login() {
  const toast = useToast();
  const loginFormRef = React.createRef();      
  
  async function handleSubmit({ values }) {

    const reqBody = values;
    await fetch("/api/v1/auth/signin", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify(reqBody),
    })
      .then(function (response) {
        if (response.status === 200) return response.json();
        else throw new Error("Invalid login attempt");
      })
      .then(function (data) {
        toast.success("Login successful");
        tokenService.setUser(data);
        tokenService.updateLocalAccessToken(data.token);
        setTimeout(() => { window.location.href = "/"; }, 1000);
      })
      .catch((error) => {         
        toast.error(error.message || "An error occurred");
      });            
  }

    return (
      <div className="auth-page-container">

        <h1>Login</h1>

        <div className="auth-form-container">
          <FormGenerator
            ref={loginFormRef}
            inputs={loginFormInputs}
            onSubmit={handleSubmit}
            numberOfColumns={1}
            listenEnterKey
            buttonText="Login"
            buttonClassName="auth-button"
          />
        </div>
      </div>
    );  
}