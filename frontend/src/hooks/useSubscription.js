import { useEffect, useRef } from 'react';
import { useWebSocket } from '../context/WebSocketProvider';

export const useSubscription = (destination, callback) => {
    const ws = useWebSocket();
    const stompClient = ws?.stompClient;
    const isConnected = ws?.isConnected;
    const callbackRef = useRef(callback);
    useEffect(() => { callbackRef.current = callback; }, [callback]);
    
    useEffect(() => {
        if (isConnected && destination && stompClient) {
            const sub = stompClient.subscribe(destination, (msg) => callbackRef.current(msg));
            return () => sub.unsubscribe();
        }
    }, [destination, isConnected, stompClient]); 
};
