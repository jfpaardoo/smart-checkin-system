import api from "./api";

const forgotPassword = (email) => {
    return api.post("/auth/forgot-password", { email });
};

const resetPassword = (token, newPassword, confirmPassword) => {
    return api.post("/auth/reset-password", { token, newPassword, confirmPassword });
};

const AuthService = {
    forgotPassword,
    resetPassword,
    // Nota: El día de mañana puedes mover aquí tus llamadas de login y signup para tenerlo centralizado
};

export default AuthService;