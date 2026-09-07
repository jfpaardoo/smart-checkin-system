import { FaGoogle, FaApple, FaMicrosoft, FaCalendarAlt } from "react-icons/fa";
import api from "../api";

/**
 * Helper to format date strings for calendar URLs (YYYYMMDDTHHmmssZ)
 */
const formatUtcForCalendar = (dateInput) => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().replace(/-|:|\.\d+/g, "");
};

/**
 * Helper to format ISO without milliseconds (2026-08-27T10:00:00Z)
 */
const formatIsoClean = (dateInput) => {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split(".")[0] + "Z";
};

/**
 * Base Calendar Strategy Interface
 */
class CalendarStrategy {
  constructor(id, name, icon, description) {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.description = description;
  }

  /* eslint-disable no-unused-vars */
  async sync(formation) {
    throw new Error("sync method must be implemented by strategy");
  }
}

/**
 * 1. Google Calendar Strategy
 */
export class GoogleCalendarStrategy extends CalendarStrategy {
  constructor() {
    super("google", "Google Calendar", FaGoogle, "Añadir a Google Calendar web y app");
  }

  async sync(formation) {
    const title = encodeURIComponent(formation.name || "Formación Smart Check-in");
    const location = encodeURIComponent(formation.company?.name || formation.address || "Sede de la empresa");
    const details = encodeURIComponent(
      `Formación: ${formation.name || ""}\nFormador: ${formation.trainer?.firstName || ""} ${formation.trainer?.lastName || ""}\nDescripción: ${formation.description || ""}`
    );

    const startDate = formation.formationDate ? new Date(formation.formationDate) : new Date();
    const endDate = formation.endDate ? new Date(formation.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const startUtc = formatUtcForCalendar(startDate);
    const endUtc = formatUtcForCalendar(endDate);

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startUtc}/${endUtc}&details=${details}&location=${location}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * 2. Microsoft Outlook (Personal / Live / Hotmail) Strategy
 */
export class OutlookCalendarStrategy extends CalendarStrategy {
  constructor() {
    super("outlook", "Outlook (Personal / Live)", FaMicrosoft, "Para cuentas de Outlook.com y Hotmail");
  }

  async sync(formation) {
    const title = encodeURIComponent(formation.name || "Formación Smart Check-in");
    const location = encodeURIComponent(formation.company?.name || formation.address || "Sede de la empresa");
    const details = encodeURIComponent(
      `Formación: ${formation.name || ""}\nFormador: ${formation.trainer?.firstName || ""} ${formation.trainer?.lastName || ""}\nDescripción: ${formation.description || ""}`
    );

    const startDate = formation.formationDate ? new Date(formation.formationDate) : new Date();
    const endDate = formation.endDate ? new Date(formation.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const startIso = formatIsoClean(startDate);
    const endIso = formatIsoClean(endDate);

    // Direct Outlook Web compose link (without deeplink redirect router)
    const url = `https://outlook.live.com/calendar/0/action/compose?subject=${title}&body=${details}&location=${location}&startdt=${encodeURIComponent(startIso)}&enddt=${encodeURIComponent(endIso)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * 3. Microsoft 365 (Empresarial / Educativo / Corporativo) Strategy
 */
export class Office365CalendarStrategy extends CalendarStrategy {
  constructor() {
    super("office365", "Microsoft 365 / Empresa", FaMicrosoft, "Para cuentas profesionales y corporativas");
  }

  async sync(formation) {
    const title = encodeURIComponent(formation.name || "Formación Smart Check-in");
    const location = encodeURIComponent(formation.company?.name || formation.address || "Sede de la empresa");
    const details = encodeURIComponent(
      `Formación: ${formation.name || ""}\nFormador: ${formation.trainer?.firstName || ""} ${formation.trainer?.lastName || ""}\nDescripción: ${formation.description || ""}`
    );

    const startDate = formation.formationDate ? new Date(formation.formationDate) : new Date();
    const endDate = formation.endDate ? new Date(formation.endDate) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const startIso = formatIsoClean(startDate);
    const endIso = formatIsoClean(endDate);

    // Direct Office 365 / Corporate Outlook compose link
    const url = `https://outlook.office.com/calendar/0/action/compose?subject=${title}&body=${details}&location=${location}&startdt=${encodeURIComponent(startIso)}&enddt=${encodeURIComponent(endIso)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Helper to detect mobile devices
 */
export const isMobileDevice = () => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || navigator.vendor || window.opera || "";
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
};

/**
 * 4. Apple Calendar / Native Device Strategy
 */
export class AppleCalendarStrategy extends CalendarStrategy {
  constructor() {
    super("apple", "Apple Calendar / Dispositivo", FaApple, "Añadir a la app nativa de Calendario");
  }

  async sync(formation) {
    await downloadIcsFile(formation);
  }
}

/**
 * 5. Generic iCalendar (.ics) Strategy
 */
export class IcsCalendarStrategy extends CalendarStrategy {
  constructor() {
    super("ics", "Archivo iCalendar (.ics)", FaCalendarAlt, "Descargar archivo estándar compatible");
  }

  async sync(formation) {
    await downloadIcsFile(formation);
  }
}

/**
 * Download / Open .ics helper function with native iOS/mobile support
 */
async function downloadIcsFile(formation) {
  if (!formation?.id) return;
  try {
    const response = await api.get(`/formations/${formation.id}/calendar.ics`, {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "text/calendar;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);

    const isIOS = typeof navigator !== "undefined" && (
      /iPad|iPhone|iPod/.test(navigator.userAgent || "") || 
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );

    if (isIOS) {
      // En iOS Safari, navegar a la URL text/calendar abre directamente el prompt nativo
      // de la aplicación Calendario de Apple ("Añadir a Calendario").
      window.location.href = url;
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      return;
    }

    const link = document.createElement("a");
    link.href = url;
    const sanitizedTitle = (formation.name || "convocatoria").replace(/[^a-zA-Z0-9_-]/g, "_");
    link.setAttribute("download", `convocatoria_${sanitizedTitle}.ics`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(url), 1500);
  } catch (err) {
    console.error("Error al descargar archivo de calendario .ics:", err);
    throw err;
  }
}

/**
 * Calendar Strategy Manager / Context with Device Detection
 */
class CalendarSyncManager {
  constructor() {
    this.strategies = {
      apple: new AppleCalendarStrategy(),
      google: new GoogleCalendarStrategy(),
      office365: new Office365CalendarStrategy(),
      outlook: new OutlookCalendarStrategy(),
      ics: new IcsCalendarStrategy(),
    };
  }

  /**
   * Detects the user's OS/Device to recommend the optimal strategy
   */
  detectRecommendedStrategy() {
    if (typeof navigator === "undefined") return "google";
    const ua = navigator.userAgent || navigator.vendor || window.opera || "";

    if (/iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) {
      return "apple";
    }
    if (/Macintosh|Mac OS X/.test(ua)) {
      return "apple";
    }
    if (/Android/.test(ua)) {
      return "google";
    }
    if (/Windows/.test(ua)) {
      return "office365";
    }
    return "google";
  }

  getStrategy(strategyId) {
    return this.strategies[strategyId] || this.strategies.ics;
  }

  getAllStrategies() {
    return Object.values(this.strategies);
  }

  async sync(strategyId, formation) {
    const strategy = this.getStrategy(strategyId);
    return await strategy.sync(formation);
  }
}

export const calendarSyncManager = new CalendarSyncManager();
