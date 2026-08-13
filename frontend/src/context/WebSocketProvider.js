import React, { createContext, useContext, useState, useEffect } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import tokenService from '../services/token.service';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
    const [stompClient, setStompClient] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    
    // Grab the user to trigger connection
    const user = tokenService.getUser();
    const username = user?.username;

    useEffect(() => {
        let client = null;

        if (username) {
            const socketUrl = window.location.hostname === 'localhost'
                ? 'http://localhost:8080/ws'
                : 'https://smart-checkin-system.onrender.com/ws';

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
                client.deactivate();
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
