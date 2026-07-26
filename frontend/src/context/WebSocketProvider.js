import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import tokenService from '../services/token.service';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const [stompClient, setStompClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    
    // As in your example, we grab the JWT to trigger connection
    const jwt = tokenService.getLocalAccessToken();

    useEffect(() => {
        let client = null;

        if (jwt) {
            // Reemplaza localhost con el origen real si está en producción
            // Aquí usamos rutas relativas de SockJS si el proxy está configurado (como en React dev server con proxy)
            // O una URL absoluta si es necesario.
            const socketUrl = 'http://localhost:8080/ws';

            client = new Client({
                webSocketFactory: () => new SockJS(socketUrl, null, { transports: ['websocket', 'xhr-streaming', 'xhr-polling'] }),
                connectHeaders: {
                    // Puedes enviar el token si quieres seguridad extra a nivel STOMP
                    Authorization: `Bearer ${jwt}`
                },
                debug: function (str) {
                    console.log('STOMP: ' + str);
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
                onConnect: () => {
                    console.log("Conectado a STOMP a través de WebSocket");
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
                client.deactivate();
            }
        };
    }, [jwt]);

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
