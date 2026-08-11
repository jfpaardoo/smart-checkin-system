import jwt_decode from "jwt-decode";

class TokenService {
    getLocalAccessToken() {
        try {
            const jwtStr = localStorage.getItem("jwt");
            if (!jwtStr) return null;
            return JSON.parse(jwtStr);
        } catch {
            return null;
        }
    }

    updateLocalAccessToken(token) {
        window.localStorage.setItem("jwt", JSON.stringify(token));
    }

    getUser() {
        const jwt = this.getLocalAccessToken();
        if (!jwt) return null;
        try {
            const decoded = jwt_decode(jwt);
            return {
                username: decoded.sub,
                roles: decoded.authorities || [],
                authority: { authority: (decoded.authorities && decoded.authorities.length > 0) ? decoded.authorities[0] : null }
            };
        } catch (e) {
            console.error("Failed to decode JWT:", e);
            return null;
        }
    }

    // Deprecated, we no longer store raw user objects in local storage for security reasons.
    setUser(user) {
        // No-op. The user identity is securely derived from the JWT payload now.
        // We leave this as a no-op to prevent breaking existing components that call it.
    }

    removeUser() {
        window.localStorage.removeItem("user"); // Clean up old legacy items
        window.localStorage.removeItem("jwt");
    }
}
const tokenService = new TokenService();

export default tokenService;