import React, { useState, useEffect } from 'react';
import tokenService from '../services/token.service';
import Login from '../auth/login';
import { CardGhostLoader } from '../components/GhostLoader';

const PrivateRoute = ({ children }) => {
    const jwt = tokenService.getLocalAccessToken();
    const [isLoading, setIsLoading] = useState(true);
    const [isValid, setIsValid] = useState(null);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (!jwt) {
            setIsLoading(false);
            setIsValid(false);
            return;
        }

        let cancelled = false;

        fetch(`/api/v1/auth/validate?token=${jwt}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
        })
            .then(response => {
                if (!response.ok) throw new Error('Invalid token');
                return response.json();
            })
            .then(result => {
                if (cancelled) return;
                setIsValid(result);
                setIsLoading(false);
            })
            .catch((err) => {
                if (cancelled) return;
                setIsValid(false);
                setMessage(err.message);
                setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [jwt]);

    if (!jwt) {
        return <Login message={message} navigation={false} />;
    }

    if (isLoading) {
        return <CardGhostLoader />;
    }

    return isValid === true ? children : <Login message={message} navigation={true} />;
};

export default PrivateRoute;