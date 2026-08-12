import useSWR from "swr";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css"

const fetcher = (url) => fetch(url, {
    headers: { "Content-Type": "application/json" }
}).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch docs");
    return res.json();
});

export default function SwaggerDocs(){
    const { data: docs } = useSWR("/v3/api-docs", fetcher);
    
    return (
        <SwaggerUI spec={docs} url="" />
    );
    
}