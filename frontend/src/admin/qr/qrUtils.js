/**
 * Helpers and payload builders for QR generation
 */

export const getFormationDropdownLabel = (f, t) => {
    const closed = Boolean(f.isClosed) || f.status === 'CLOSED';
    if (closed) {
        return `${f.name} ${t ? t('qr.statusClosed', '(Finalizada)') : '(Finalizada)'}`;
    }
    if (f.status === 'DRAFT') {
        return `${f.name} ${t ? t('qr.statusDraft', '(Borrador)') : '(Borrador)'}`;
    }
    return f.name;
};

export const createQrPayload = (token, formationId, adminCoords) => {
    const payload = { 
        token, 
        action: "formation" 
    };
    if (formationId) {
        payload.formationId = formationId;
    }
    if (adminCoords) {
        payload.adminLat = adminCoords.lat;
        payload.adminLng = adminCoords.lng;
    }
    return JSON.stringify(payload);
};
