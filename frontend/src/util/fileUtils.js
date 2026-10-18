import {
  faFilePdf,
  faFileLines,
  faFileImage,
  faFile,
  faFileExcel,
  faFileWord,
  faFilePowerpoint
} from "@fortawesome/free-solid-svg-icons";

/**
 * Returns the appropriate icon and color based on the file extension.
 * @param {string} fileName 
 * @returns { icon, color, type }
 */
export const getFileIconAndType = (fileName) => {
  if (!fileName) return { icon: faFile, color: '#95a5a6', type: 'other' };
  
  const lowerName = fileName.toLowerCase();
  if (lowerName.endsWith('.pdf')) {
    return { icon: faFilePdf, color: '#e74c3c', type: 'pdf' };
  } else if (['.xlsx', '.xls', '.csv'].some(ext => lowerName.endsWith(ext))) {
    return { icon: faFileExcel, color: '#27ae60', type: 'excel' };
  } else if (['.docx', '.doc'].some(ext => lowerName.endsWith(ext))) {
    return { icon: faFileWord, color: '#2980b9', type: 'word' };
  } else if (['.pptx', '.ppt'].some(ext => lowerName.endsWith(ext))) {
    return { icon: faFilePowerpoint, color: '#d35400', type: 'powerpoint' };
  } else if (['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].some(ext => lowerName.endsWith(ext))) {
    return { icon: faFileImage, color: '#2ecc71', type: 'image' };
  } else if (['.txt', '.odt', '.log', '.rtf'].some(ext => lowerName.endsWith(ext))) {
    return { icon: faFileLines, color: '#3498db', type: 'document' };
  }
  return { icon: faFile, color: '#95a5a6', type: 'other' };
};

/**
 * Transforms a cloud document URL into an embeddable format.
 * @param {string} url 
 * @returns {string} Embed URL
 */
export const getEmbedUrl = (url) => {
  if (!url) return "";
  let embedUrl = url;
  
  if (embedUrl.includes("onedrive.live.com")) {
    embedUrl = embedUrl.replace("/redir?", "/embed?").replace("/view.aspx?", "/embed?");
    embedUrl = embedUrl.replace("onedrive.live.com/?", "onedrive.live.com/embed?");
    
    if (embedUrl.includes("/embed?")) {
      return embedUrl;
    }
  }
  
  if (!embedUrl.includes("action=embedview")) {
    return embedUrl.includes("?") ? `${embedUrl}&action=embedview` : `${embedUrl}?action=embedview`;
  }
  return embedUrl;
};

/**
 * Extracts the clean file name and returns its icon properties.
 * Handles UUID stripping for uploaded files (e.g., S3/Local Storage formats).
 * @param {string} item The raw URL or file identifier string
 * @returns {object} { name, url, icon, color, type }
 */
export const getCleanFileInfo = (item) => {
  if (!item) {
    return { name: "Documento Adjunto", url: "", icon: faFile, color: '#95a5a6', type: 'other' };
  }

  try {
    let url = item;
    let originalName = "";

    if (item.includes("||")) {
      const parts = item.split("||");
      originalName = parts[0]?.trim() || "";
      url = parts[1]?.trim() || item;
    } else {
      const decoded = decodeURIComponent(item);
      const segments = decoded.split('/');
      const rawFileName = segments.at(-1)?.split('?')[0] || "";
      const uuidPrefixRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i;
      originalName = uuidPrefixRegex.test(rawFileName) ? rawFileName.replace(uuidPrefixRegex, '') : rawFileName;
    }

    const hasExtension = originalName.includes(".") && originalName.lastIndexOf(".") < originalName.length - 1;
    // Si no tiene nombre legible o es un identificador opaco sin extensión
    if (!originalName || originalName.trim() === "" || (!hasExtension && (originalName.startsWith("IQ") || originalName.length > 40))) {
      originalName = "Documento Adjunto";
    }

    const { icon, color, type } = getFileIconAndType(originalName);

    return { name: originalName, url, icon, color, type };
  } catch {
    return { name: "Documento Adjunto", url: item, icon: faFile, color: '#95a5a6', type: 'other' };
  }
};
