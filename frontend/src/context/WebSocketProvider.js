import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import tokenService from '../services/token.service';
import api from '../services/api';

const WebSocketContext = createContext(null);

const resolveSocketUrl = () => {
    if (process.env.REACT_APP_WS_URL) {
        return process.env.REACT_APP_WS_URL;
    }
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
        return 'http://localhost:8080/ws';
    }
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    return `${protocol}//${window.location.host}/ws`;
};

export const WebSocketProvider = ({ children }) => {
    const [stompClient, setStompClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    
    // Grab the user to trigger connection
    const user = tokenService.getUser();
    const username = user?.username;

    useEffect(() => {
        let client = null;

        if (username) {
            const socketUrl = resolveSocketUrl();

            const fetchTicket = async () => {
                try {
                    const token = typeof tokenService.getLocalAccessToken === 'function'
                        ? tokenService.getLocalAccessToken()
                        : null;
                    const config = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};
                    const res = await api.post('/ws/ticket', null, config);
                    return res.data?.ticket || null;
                } catch (e) {
                    console.warn('No se pudo obtener ticket WebSocket:', e);
                }
                return null;
            };

            client = new Client({
                webSocketFactory: () => new SockJS(socketUrl),
                connectHeaders: {},
                debug: function (str) {
                    if (process.env.NODE_ENV === 'development' && window.DEBUG_STOMP) {
                        console.log('STOMP: ' + str);
                    }
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
                beforeConnect: async () => {
                    const ticket = await fetchTicket();
                    if (ticket) {
                        client.connectHeaders = { 'X-WS-Ticket': ticket };
                    } else {
                        const token = typeof tokenService.getLocalAccessToken === 'function'
                            ? tokenService.getLocalAccessToken()
                            : null;
                        if (token) {
                            client.connectHeaders = { 'Authorization': `Bearer ${token}` };
                        }
                    }
                },
                onConnect: () => {
                    setStompClient(client);
                    setIsConnected(true);
                },
                onStompError: (frame) => {
                    console.error('Broker reported error: ' + frame.headers['message']);
                    console.error('Additional details: ' + frame.body);
                },
                onWebSocketClose: () => {
                    setIsConnected(false);
                }
            });

            client.activate();
        }

        return () => {
            if (client) {
                void client.deactivate();
            }
        };
    }, [username]);

    const contextValue = React.useMemo(() => ({ stompClient, isConnected }), [stompClient, isConnected]);

    return (
        <WebSocketContext.Provider value={contextValue}>
            {children}
        </WebSocketContext.Provider>
    );
};

export const useWebSocket = () => {
    return useContext(WebSocketContext);
};
