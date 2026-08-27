import React, { useState, useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaCrosshairs,
  FaSpinner,
  FaCheckCircle,
  FaLayerGroup,
  FaTimes,
  FaBuilding,
  FaCity,
  FaCompass,
} from "react-icons/fa";

// Authentic Map Pin Marker using official FontAwesome faMapMarkerAlt path
const createCustomIcon = () => {
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

const getPlaceIcon = (type) => {
  if (type === "city" || type === "administrative" || type === "town") {
    return <FaCity size={13} />;
  }
  if (type === "industrial" || type === "commercial" || type === "company") {
    return <FaBuilding size={13} />;
  }
  return <FaMapMarkerAlt size={13} />;
};

const parseCoord = (val) => {
  if (val === null || val === undefined || val === "") return null;
  const str = String(val).trim().replace(",", ".");
  const num = Number.parseFloat(str);
  return Number.isNaN(num) ? null : num;
};

export default function LocationMapPicker({
  latitude,
  longitude,
  radiusMeters = 100,
  address,
  onLocationChange,
  t,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const searchContainerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState(address || "");
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);

  // Default coordinates: Spain central (Madrid)
  const defaultLat = 40.4168;
  const defaultLng = -3.7038;

  const currentLat = parseCoord(latitude);
  const currentLng = parseCoord(longitude);
  const hasCoordinates = currentLat !== null && currentLng !== null;

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update parent location callback
  const updateLocation = useCallback(
    async (lat, lng, newAddress = null) => {
      let resolvedAddress = newAddress;
      if (resolvedAddress === null) {
        setReverseGeocoding(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.display_name) {
              resolvedAddress = data.display_name;
              setSearchQuery(resolvedAddress);
            }
          }
        } catch (e) {
          console.debug("Reverse geocode error:", e);
        } finally {
          setReverseGeocoding(false);
        }
      }

      onLocationChange({
        latitude: Number.parseFloat(lat.toFixed(6)),
        longitude: Number.parseFloat(lng.toFixed(6)),
        address: resolvedAddress !== null ? resolvedAddress : address,
      });
    },
    [address, onLocationChange]
  );

  // Synchronize both Marker and Geofence Circle onto Leaflet map
  const syncMarkerAndCircle = useCallback(
    (lat, lng, radius) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const latLng = [lat, lng];
      const circleRadius = radius ? Number.parseInt(radius, 10) : 100;

      // 1. Marker sync
      if (!markerRef.current) {
        const marker = L.marker(latLng, {
          icon: createCustomIcon(),
          draggable: true,
        }).addTo(map);

        marker.on("dragend", (e) => {
          const position = e.target.getLatLng();
          syncMarkerAndCircle(position.lat, position.lng, radius);
          updateLocation(position.lat, position.lng);
        });

        markerRef.current = marker;
      } else {
        markerRef.current.setLatLng(latLng);
      }

      // 2. Geofence Circle sync
      if (!circleRef.current) {
        const circle = L.circle(latLng, {
          radius: circleRadius,
          color: "#2563eb",
          fillColor: "#3b82f6",
          fillOpacity: 0.25,
          weight: 2.5,
          dashArray: "6, 6",
        }).addTo(map);
        circleRef.current = circle;
      } else {
        circleRef.current.setLatLng(latLng);
        circleRef.current.setRadius(circleRadius);
      }
    },
    [updateLocation]
  );

  // Geocoding search (Nominatim + Photon)
  const fetchGeocodingResults = useCallback(async (queryText) => {
    if (!queryText || queryText.trim().length < 2) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    setSearching(true);
    const cleanQuery = queryText.trim();
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

    try {
      // 1. Fetch from Nominatim
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

      // 2. Fetch from Photon
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

                const subDescription = subParts.join(", ") || props.country || "";
                const fullDisplay = mainTitle + (subDescription ? `, ${subDescription}` : "");

                addResult(
                  `photon-${props.osm_id || index}`,
                  lat,
                  lng,
                  mainTitle,
                  subDescription,
                  fullDisplay,
                  props.type
                );
              }
            });
          }
        }
      } catch (photonErr) {
        console.debug("Photon search error:", photonErr);
      }

      setSearchResults(results);
      setIsDropdownOpen(results.length > 0);
    } catch (err) {
      console.error("Geocoding search error:", err);
      setSearchResults([]);
      setIsDropdownOpen(false);
    } finally {
      setSearching(false);
    }
  }, []);

  // Live Debounced Search as user types
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        fetchGeocodingResults(value);
      }, 350);
    } else {
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    fetchGeocodingResults(searchQuery);
  };

  // Select a search result from dropdown
  const handleSelectResult = (result) => {
    const lat = result.lat;
    const lng = result.lon;
    const displayName = result.displayName;

    setSearchQuery(displayName);
    setIsDropdownOpen(false);
    setSearchResults([]);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 17, {
        animate: true,
        duration: 1.0,
      });
      syncMarkerAndCircle(lat, lng, radiusMeters);
    }

    updateLocation(lat, lng, displayName);
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = hasCoordinates ? currentLat : defaultLat;
      const initialLng = hasCoordinates ? currentLng : defaultLng;
      const initialZoom = hasCoordinates ? 16 : 6;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: initialZoom,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Click on map to set marker & circle
      map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        setIsDropdownOpen(false);
        syncMarkerAndCircle(lat, lng, radiusMeters);
        updateLocation(lat, lng);
      });

      // Initial placement
      if (hasCoordinates) {
        syncMarkerAndCircle(initialLat, initialLng, radiusMeters);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update Marker & Geofence Circle when coordinates or radius change
  useEffect(() => {
    if (hasCoordinates) {
      syncMarkerAndCircle(currentLat, currentLng, radiusMeters);
    } else {
      if (markerRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (circleRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(circleRef.current);
        circleRef.current = null;
      }
    }
  }, [currentLat, currentLng, hasCoordinates, radiusMeters, syncMarkerAndCircle]);

  // Detect Current GPS Location
  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      alert(t ? t("companies.gpsNotSupported", "Geolocalización no soportada en este navegador.") : "GPS no soportado");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17, {
            animate: true,
            duration: 1.0,
          });
          syncMarkerAndCircle(lat, lng, radiusMeters);
        }

        updateLocation(lat, lng);
      },
      (err) => {
        setLocating(false);
        console.error("GPS error:", err);
        alert(t ? t("companies.gpsError", "No se pudo obtener la posición GPS actual.") : "Error al obtener GPS");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="flex flex-col gap-3 relative">
      {/* Estilo CSS embebido para eliminar fondos y bordes residuales de Leaflet */}
      <style>{`
        .leaflet-custom-marker-pin,
        .leaflet-marker-icon.leaflet-div-icon {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
      `}</style>

      {/* Buscador inteligente con desplegable flotante de sugerencias */}
      <div ref={searchContainerRef} className="relative z-30">
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <div className="relative flex items-center">
              {/* Icono de búsqueda / cargador a la izquierda */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-slate-400">
                {searching ? (
                  <FaSpinner className="animate-spin text-sm text-[#73841e] dark:text-[#d4e84a]" />
                ) : (
                  <FaSearch className="text-sm text-slate-400 dark:text-slate-500" />
                )}
              </div>

              {/* Campo de texto con padding garantizado a izquierda y derecha */}
              <input
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchSubmit(e);
                  }
                }}
                onFocus={() => {
                  if (searchResults.length > 0) setIsDropdownOpen(true);
                }}
                placeholder={
                  t
                    ? t("companies.searchAddressPlaceholder", "Buscar dirección, polígono, sede o ciudad...")
                    : "Buscar dirección o sede..."
                }
                style={{
                  paddingLeft: "42px",
                  paddingRight: searchQuery ? "42px" : "16px",
                }}
                className="da-glass-search-input text-xs sm:text-sm w-full"
                autoComplete="off"
              />

              {/* Botón de limpiar a la derecha (solo visible cuando hay texto) */}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                    setIsDropdownOpen(false);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer z-10"
                  title="Limpiar búsqueda"
                  aria-label="Limpiar búsqueda"
                >
                  <FaTimes size={13} />
                </button>
              )}
            </div>

            {/* Desplegable interactivo con sugerencias y opciones de ubicación */}
            {isDropdownOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto z-[99999] da-fade-in">
                <div className="px-3.5 py-2 bg-slate-50/80 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 border-b border-slate-200/50 dark:border-slate-700/50">
                  <FaCompass className="text-[#8a9e29] dark:text-[#d4e84a]" />
                  <span>Sugerencias de Ubicación ({searchResults.length})</span>
                </div>

                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectResult(item)}
                    className="w-full text-left px-3.5 py-3 hover:bg-[#b3c34c]/15 dark:hover:bg-[#b3c34c]/20 transition-all flex items-start gap-3 cursor-pointer group"
                  >
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-500 group-hover:text-white transition-colors flex-shrink-0 mt-0.5 shadow-xs">
                      {getPlaceIcon(item.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#73841e] dark:group-hover:text-[#d4e84a] transition-colors truncate">
                        {item.primaryName}
                      </div>
                      {item.secondaryAddress && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 leading-snug mt-0.5">
                          {item.secondaryAddress}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón Mi GPS con icono FontAwesome */}
          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={locating}
            className="px-4 py-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-white/60 dark:border-white/10 hover:border-[#b3c34c] text-slate-700 dark:text-slate-200 hover:text-[#73841e] dark:hover:text-[#d4e84a] text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50 min-h-[42px]"
            title="Detectar GPS actual"
          >
            {locating ? <FaSpinner className="animate-spin text-[#73841e]" /> : <FaCrosshairs className="text-emerald-500" />}
            <span className="whitespace-nowrap">{t ? t("companies.myGpsLocation", "Mi GPS") : "Mi GPS"}</span>
          </button>
        </div>
      </div>

      {/* Contenedor del Mapa Interactivo Leaflet */}
      <div className="relative rounded-3xl overflow-hidden border border-white/60 dark:border-white/10 shadow-md">
        <div
          ref={mapContainerRef}
          style={{ height: "320px", width: "100%", zIndex: 1 }}
          className="rounded-3xl"
        />

        {/* Badge flotante de estado en el mapa */}
        <div className="absolute top-3 right-3 z-[400] px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-xs text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 pointer-events-none">
          <FaLayerGroup className="text-blue-500" />
          <span>{hasCoordinates ? `${radiusMeters || 100}m geocerca activa` : "Haz clic en el mapa para situar la sede"}</span>
        </div>

        {reverseGeocoding && (
          <div className="absolute bottom-3 left-3 z-[400] px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/50 dark:border-white/10 shadow-xs text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <FaSpinner className="animate-spin text-[#73841e]" />
            <span>Resolviendo dirección física...</span>
          </div>
        )}
      </div>

      {/* Resumen de coordenadas y feedback */}
      {hasCoordinates && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
          <div className="flex items-center gap-2">
            <FaCheckCircle className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Ubicación fijada:</strong> Lat {currentLat.toFixed(6)}, Lng {currentLng.toFixed(6)} (Radio: {radiusMeters || 100}m)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Puedes arrastrar la marca o hacer clic en otra zona del mapa</span>
        </div>
      )}
    </div>
  );
}
