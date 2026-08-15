import api from "./api";

const forgotPassword = (email, captchaToken) => {
    return api.post("/auth/forgot-password", { email, captchaToken });
};

const resetPassword = (token, newPassword, confirmPassword) => {
    return api.post("/auth/reset-password", { token, newPassword, confirmPassword });
};

const login = (username, password, captchaToken) => {
    return api.post("/auth/signin", { username, password, captchaToken });
};

const signup = (userData, captchaToken) => {
    return api.post("/auth/signup", { ...userData, captchaToken });
};

const AuthService = {
    forgotPassword,
    resetPassword,
    login,
    signup
};

export default AuthService;