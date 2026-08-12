import { useEffect, useState, useRef } from "react";
import api from "../services/api";

/**
 * Custom React hook to fetch data from a given URL and manage the fetched data within state.
 * This hook supports JWT-based authentication via the api.js interceptor, message handling, and conditional fetching.
 *
 * @param {any} initial - The initial value for the `data` state.
 * @param {string} url - The URL from which to fetch the data. If not provided, the fetch request will not be initiated.
 * @param {string|null} _jwt - (Deprecated) JWT is handled automatically by api.js interceptor.
 * @param {function|null} setMessage - Function to update the message state based on the server's response. If `null`, alerts will be used instead.
 * @param {function} setVisible - Function to control the visibility of the message or alert.
 * @param {string|null} [id=null] - Optional parameter to control fetch behavior. If `id` is `"new"`, the fetch request is skipped.
 * 
 * @returns {[any, function]} - Returns an array with two elements:
 *   - `data`: The state variable holding the fetched data.
 *   - `setData`: A function to manually update the `data` state.
 *
 * @example
 * const [data, setData] = useFetchState({}, '/data', null, setMessage, setVisible);
 */

export default function useFetchState(initial, url, _jwt, setMessage, setVisible, id = null) {
    const [data, setData] = useState(initial);
    const [loading, setLoading] = useState(true);

    // Guardar los callbacks en una referencia para evitar bucles infinitos de re-render
    // si el componente padre pasa funciones anónimas (anti-patrón común).
    const callbacks = useRef({ setMessage, setVisible });
    useEffect(() => {
        callbacks.current = { setMessage, setVisible };
    }, [setMessage, setVisible]);

    useEffect(() => {
        if (url) {
            if (!id || id !== "new") {
                let ignore = false;
                setLoading(true);
                const finalUrl = url.startsWith('/api/v1') ? url.replace('/api/v1', '') : url;
                api.get(finalUrl)
                    .then(response => {
                        if (!ignore) {
                            if (response.data.message) {
                                const { setMessage, setVisible } = callbacks.current;
                                if (typeof setMessage === "function") {
                                    setMessage(response.data.message);
                                    if (typeof setVisible === "function") setVisible(true);
                                }
                            } else {
                                setData(response.data);
                            }
                        }
                    }).catch((error_) => {
                        console.log(error_);
                        if (!ignore) {
                            const { setMessage, setVisible } = callbacks.current;
                            if (typeof setMessage === "function") {
                                setMessage('Failed to fetch data');
                                if (typeof setVisible === "function") setVisible(true);
                            }
                        }
                    }).finally(() => {
                        if (!ignore) {
                            setLoading(false);
                        }
                    });
                return () => {
                    ignore = true;
                };
            } else {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, [url, id]);

    return [data, setData, loading];
}
