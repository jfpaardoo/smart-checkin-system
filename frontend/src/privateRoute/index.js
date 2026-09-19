import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import tokenService from '../services/token.service';
import Login from '../auth/login';
import { CardGhostLoader } from '../components/GhostLoader';

// Cache global de validación reciente para evitar loaders y parpadeos en cada cambio de menú
let lastAuthValidationTime = 0;
const AUTH_VALIDATION_TTL = 30000; // 30 segundos de vigencia en navegación interna

const PrivateRoute = ({ children, roles = [] }) => {
    const user = tokenService.getUser();
    const username = user?.username;

    // Extraer roles del usuario (soporta array en user.roles o string en user.authority)
    let userRoles = [];
    if (Array.isArray(user?.roles)) {
        userRoles = user.roles;
    } else if (user?.authority) {
        userRoles = [user.authority];
    }

    const hasRequiredRole = roles.length === 0 || roles.some(role => userRoles.includes(role));

    // Si ya fue validado en los últimos 30s y el usuario existe en local, renderizar de inmediato
    const isRecentlyValidated = !!(username && (Date.now() - lastAuthValidationTime < AUTH_VALIDATION_TTL));

    const [isLoading, setIsLoading] = useState(!isRecentlyValidated && !!username);
    const [isValid, setIsValid] = useState(isRecentlyValidated ? true : null);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (!username) {
            setIsLoading(false);
            setIsValid(false);
            return;
        }

        // Si la validación está vigente en el TTL, no repetir peticiones innecesarias
        if (Date.now() - lastAuthValidationTime < AUTH_VALIDATION_TTL) {
            setIsValid(true);
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        fetch(`/api/v1/auth/validate`, { 
            credentials: 'include', 
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }, 
        })
            .then(async (response) => {
                if (response.status === 401 || response.status === 403) {
                    tokenService.removeUser();
                    throw new Error('Sesión expirada');
                }
                if (!response.ok) {
                    // Errores temporales de red o 5xx: no expulsar al usuario si tiene sesión local
                    return true;
                }
                const result = await response.json();
                return result;
            })
            .then(result => {
                if (cancelled) return;
                if (result === true) {
                    lastAuthValidationTime = Date.now();
                    setIsValid(true);
                } else {
                    tokenService.removeUser();
                    setIsValid(false);
                }
                setIsLoading(false);
            })
            .catch((err) => {
                if (cancelled) return;
                if (err.message === 'Sesión expirada') {
                    setIsValid(false);
                    setMessage(err.message);
                } else {
                    // Error de conectividad temporal / timeout: mantener sesión local activa
                    console.debug('Aviso de conectividad en validación de sesión:', err.message);
                    setIsValid(true);
                }
                setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [username]);

    if (!user) {
        return <Login message={message} navigation={false} />;
    }

    if (isLoading) {
        return <CardGhostLoader />;
    }

    if (isValid !== true) {
        return <Login message={message} navigation={true} />;
    }

    if (!hasRequiredRole) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default PrivateRoute;