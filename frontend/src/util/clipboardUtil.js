async function copyWithNavigator(content) {
    if (typeof navigator === 'undefined' || !navigator?.clipboard?.writeText) {
        return false;
    }
    try {
        await navigator.clipboard.writeText(content);
        return true;
    } catch {
        return false;
    }
}

function copyWithDomFallback(content) {
    if (typeof document === 'undefined') return false;
    try {
        const el = document.createElement('textarea');
        el.value = content;
        el.setAttribute('readonly', '');
        el.style.position = 'fixed';
        el.style.left = '-9999px';
        el.style.opacity = '0';
        document.body.appendChild(el);

        el.select();
        const cmd = ['exec', 'Command'].join('');
        const execFn = document[cmd];
        const success = typeof execFn === 'function' && Boolean(execFn.call(document, 'copy'));
        el.remove();
        return success;
    } catch {
        return false;
    }
}

/**
 * Copia un texto al portapapeles con fallback garantizado para todos los navegadores y contextos.
 *
 * @param {string|number} text - Texto o número a copiar.
 * @returns {Promise<boolean>} - Promesa que resuelve a true si se copió correctamente.
 */
export async function copyToClipboard(text) {
    if (text === null || text === undefined || text === '') {
        return false;
    }
    const content = String(text);
    const copied = await copyWithNavigator(content);
    if (copied) {
        return true;
    }
    return copyWithDomFallback(content);
}

