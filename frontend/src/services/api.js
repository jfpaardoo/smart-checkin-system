import axios from "axios";
import TokenService from "./token.service";

const instance = axios.create({
    baseURL: "/api/v1",
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

instance.interceptors.response.use(
    (res) => {
        return res;
    },
    async (err) => {
        const originalConfig = err.config;

        if (originalConfig && originalConfig.url !== "/auth/signin" && err.response) {
            // Access Token was expired
            if (err.response.status === 401 && !originalConfig._retry) {
                originalConfig._retry = true;
                
                TokenService.removeUser();
                window.location.href = '/login';
            }
        }

        throw err;
    }
);

export default instance;