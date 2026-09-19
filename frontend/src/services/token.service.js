class TokenService {
    getUser() {
        try {
            const userStr = window.localStorage.getItem("user");
            if (!userStr) return null;
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }

    setUser(user) {
        const displayUser = {
            id: user.id,
            username: user.username,
            roles: user.roles,
            hasPasskeys: user.hasPasskeys,
            authority: { authority: (user.roles && user.roles.length > 0) ? user.roles[0] : null }
        };
        window.localStorage.setItem("user", JSON.stringify(displayUser));
    }

    removeUser() {
        window.localStorage.removeItem("user");
        window.localStorage.removeItem("jwt"); // Clean up old tokens
    }
}
const tokenService = new TokenService();

export default tokenService;