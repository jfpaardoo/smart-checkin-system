import axios from "axios";
import TokenService from "./token.service";

const instance = axios.create({
    baseURL: "/api/v1",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

instance.interceptors.request.use((config) => {
    try {
        localStorage.setItem("da_last_user_activity", Date.now().toString());
    } catch {
        // Ignorar
    }
    return config;
});

instance.interceptors.response.use(
    (res) => {
        try {
            localStorage.setItem("da_last_user_activity", Date.now().toString());
        } catch {
            // Ignorar
        }
        return res;
    },
    async (err) => {
        const originalConfig = err.config;

        if (originalConfig && originalConfig.url !== "/auth/signin" && err.response) {
            // Access Token was expired
            if (err.response.status === 401 && !originalConfig._retry) {
                originalConfig._retry = true;
                
                TokenService.removeUser();
                if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
                    window.location.href = '/login';
                }
            }
        }

        throw err;
    }
);

export default instance;