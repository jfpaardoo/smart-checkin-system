import { useEffect, useState } from "react";
import api from "../services/api";

/**
 * Custom React hook to fetch data from a specified URL and manage it in the component's state.
 * This hook supports JWT-based authentication via the api.js interceptor.
 *
 * @param {string} url - The URL from which to fetch the data. The fetch request will not be initiated if the URL is not provided.
 * @param {string} _jwt - (Deprecated) JWT is handled automatically by api.js interceptor.
 * 
 * @returns {Array} - The state variable `data` containing the fetched data, initialized as an empty array.
 *
 * @example
 * const data = useFetchData('/data');
 */

export default function useFetchData(url, _jwt) {
    const [data, setData] = useState([]);
    useEffect(() => {
        if (url) {
            let ignore = false;
            const finalUrl = url.startsWith('/api/v1') ? url.replace('/api/v1', '') : url;
            api.get(finalUrl)
                .then(response => {
                    if (!ignore) {
                        setData(response.data);
                    }
                }).catch((error_) => console.error("Fetch error:", error_));
            return () => {
                ignore = true;
            };
        }
    }, [url]);
    return data;
}