import React from "react";
import L from "leaflet";
import { FaCity, FaBuilding, FaMapMarkerAlt } from "react-icons/fa";

/**
 * Authentic Map Pin Marker using official FontAwesome faMapMarkerAlt path
 */
export const createCustomIcon = () => {
  return L.divIcon({
    className: "bg-transparent border-0 shadow-none",
    html: `
      <div style="width: 34px; height: 44px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%); cursor: grab;">
        <svg viewBox="0 0 384 512" width="34" height="44" fill="#dc2626" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
          <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0zM192 272c44.183 0 80-35.817 80-80s-35.817-80-80-80-80 35.817-80 80 35.817 80 80 80z"/>
        </svg>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -44],
  });
};

export const getPlaceIcon = (type) => {
  if (type === "city" || type === "administrative" || type === "town") {
    return <FaCity size={13} />;
  }
  if (type === "industrial" || type === "commercial" || type === "company") {
    return <FaBuilding size={13} />;
  }
  return <FaMapMarkerAlt size={13} />;
};

export const parseCoord = (val) => {
  if (val === null || val === undefined || val === "") return null;
  const str = String(val).trim().replace(",", ".");
  const num = Number.parseFloat(str);
  return Number.isNaN(num) ? null : num;
};

/**
 * Reverse geocodes coordinates using OpenStreetMap Nominatim.
 */
export async function reverseGeocodeCoords(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
    );
    if (res.ok) {
      const data = await res.json();
      return data?.display_name || null;
    }
  } catch (e) {
    console.debug("Reverse geocode error:", e);
  }
  return null;
}

/**
 * Performs unified search against Nominatim and Photon geocoding APIs.
 */
export async function searchGeocodingLocations(cleanQuery) {
  const results = [];
  const seenCoordinates = new Set();

  const addResult = (id, lat, lon, primaryName, secondaryAddress, displayName, type) => {
    const coordKey = `${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`;
    if (!seenCoordinates.has(coordKey)) {
      seenCoordinates.add(coordKey);
      results.push({
        id,
        lat: Number.parseFloat(lat),
        lon: Number.parseFloat(lon),
        primaryName,
        secondaryAddress,
        displayName,
        type: type || "place",
      });
    }
  };

  // 1. Nominatim
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      cleanQuery
    )}&limit=6&addressdetails=1`;
    const nomRes = await fetch(nomUrl, {
      headers: { "Accept-Language": "es,en;q=0.8" },
    });
    if (nomRes.ok) {
      const nomData = await nomRes.json();
      if (Array.isArray(nomData)) {
        nomData.forEach((item) => {
          const parts = (item.display_name || "").split(", ");
          const primary = parts[0] || item.display_name;
          const secondary = parts.slice(1).join(", ");
          addResult(
            `nom-${item.place_id || item.osm_id}`,
            item.lat,
            item.lon,
            primary,
            secondary,
            item.display_name,
            item.type
          );
        });
      }
    }
  } catch (nomErr) {
    console.debug("Nominatim search error:", nomErr);
  }

  // 2. Photon
  try {
    const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(cleanQuery)}&limit=8`;
    const photonRes = await fetch(photonUrl);
    if (photonRes.ok) {
      const photonData = await photonRes.json();
      if (photonData?.features && photonData.features.length > 0) {
        photonData.features.forEach((feat, index) => {
          const props = feat.properties || {};
          const coords = feat.geometry?.coordinates || [];
          const lng = coords[0];
          const lat = coords[1];

          if (lat && lng) {
            const mainTitle = props.name || props.street || cleanQuery;
            const subParts = [
              props.street && props.housenumber ? `${props.street} ${props.housenumber}` : props.street,
              props.city || props.town || props.village || props.district,
              props.state || props.county,
              props.country,
            ].filter(Boolean);
            const secondary = subParts.join(", ");
            const fullDisplay = [mainTitle, secondary].filter(Boolean).join(", ");

            addResult(
              `pho-${props.osm_id || index}-${lat}-${lng}`,
              lat,
              lng,
              mainTitle,
              secondary,
              fullDisplay,
              props.osm_value || props.type || "place"
            );
          }
        });
      }
    }
  } catch (phoErr) {
    console.debug("Photon search error:", phoErr);
  }

  return results;
}
