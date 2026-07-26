import { useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketProvider';

export const useSubscription = (destination, callback) => {
    const { stompClient, isConnected } = useWebSocket();
    
    useEffect(() => {
        if (isConnected && destination && stompClient) {
            // Suscripción al conectar
            const sub = stompClient.subscribe(destination, (msg) => callback(msg));
            // Desuscripción automática al desmontar
            return () => sub.unsubscribe();
        }
    }, [destination, isConnected, stompClient, callback]); 
};
