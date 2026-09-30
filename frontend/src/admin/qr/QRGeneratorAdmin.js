import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../../hooks/useSubscription';
import { useLocation } from 'react-router-dom';
import tokenService from '../../services/token.service';
import { QRGhostLoader } from '../../components/GhostLoader';
import useFetchState from '../../util/useFetchState';
import api from '../../services/api';
import GlassDropdown from '../../components/GlassDropdown';
import soundAndHaptics from '../../util/soundAndHaptics';

import { getFormationDropdownLabel, createQrPayload } from './qrUtils';
import { useScreenWakeLock } from './hooks/useScreenWakeLock';
import { useAdminGeolocation } from './hooks/useAdminGeolocation';
import { usePresenterShortcuts } from './hooks/usePresenterShortcuts';
import QRDisplayArea from './components/QRDisplayArea';
import PINDisplaySection from './components/PINDisplaySection';
import AdminControlsBadges from './components/AdminControlsBadges';
import FullscreenModal from './components/FullscreenModal';

export default function QRGeneratorAdmin() {
    const { t } = useTranslation();
    const jwt = tokenService.getUser();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialFormationId = queryParams.get('formationId') ? Number.parseInt(queryParams.get('formationId'), 10) : null;

    const [totpToken, setTotpToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(100);
    const [isMaxBrightnessFullscreen, setIsMaxBrightnessFullscreen] = useState(false);
    
    const [selectedFormationId, setSelectedFormationId] = useState(initialFormationId);
    const [wsTick, setWsTick] = useState(0);

    const [formations] = useFetchState([], `/api/v1/formations`, jwt, null, null);
    const activeFormations = useMemo(() => {
        return formations.filter(f => !f.isClosed && f.status !== 'CLOSED');
    }, [formations]);
    const adminCoords = useAdminGeolocation();
    const { requestWakeLock } = useScreenWakeLock();

    const selectedFormation = formations.find(f => f.id === selectedFormationId);
    const isFormationClosed = selectedFormation && (Boolean(selectedFormation.isClosed) || selectedFormation.status === 'CLOSED');

    const [isRefreshingFeedback, setIsRefreshingFeedback] = useState(false);

    const fetchCurrentToken = useCallback(async (force = false) => {
        if (isFormationClosed) {
            setTotpToken(null);
            setLoading(false);
            return;
        }

        try {
            if (force) {
                setIsRefreshingFeedback(true);
            }
            let url = selectedFormationId
                ? `/totp/current?formationId=${selectedFormationId}`
                : '/totp/current';

            if (force) {
                url += (url.includes('?') ? '&' : '?') + 'force=true';
            }

            if (adminCoords) {
                const sep = url.includes('?') ? '&' : '?';
                url += `${sep}lat=${adminCoords.lat}&lng=${adminCoords.lng}`;
            }

            const res = await api.get(url);
            setTotpToken(res.data.token);
            if (force) {
                setProgress(100);
                setTimeout(() => setIsRefreshingFeedback(false), 400);
            }
        } catch (error) {
            console.error("Error fetching TOTP token:", error);
            setTotpToken(null);
            setIsRefreshingFeedback(false);
        } finally {
            setLoading(false);
        }
    }, [selectedFormationId, adminCoords, isFormationClosed]);

    useEffect(() => {
        void fetchCurrentToken();
    }, [fetchCurrentToken, wsTick]);

    const lastBucketRef = useRef(Math.floor(Date.now() / 20000));

    useEffect(() => {
        if (isFormationClosed) return;

        const calculateProgress = () => {
            const now = Date.now();
            const currentBucket = Math.floor(now / 20000);
            const remainingMs = 20000 - (now % 20000);
            setProgress((remainingMs / 20000) * 100);

            if (currentBucket !== lastBucketRef.current) {
                lastBucketRef.current = currentBucket;
                void fetchCurrentToken();
            }
        };
        
        calculateProgress();
        const interval = setInterval(calculateProgress, 100);
        return () => clearInterval(interval);
    }, [fetchCurrentToken, isFormationClosed]);

    useSubscription('/topic/totp', () => {
        setWsTick(prev => prev + 1);
    });

    const qrPayload = createQrPayload(totpToken, selectedFormationId, adminCoords);

    const isEnding = progress <= (3 / 20) * 100;
    const qrOpacity = isEnding ? Math.max(0.2, progress / ((3 / 20) * 100)) : 1;
    const fadeStyle = {
        opacity: isRefreshingFeedback ? 0.35 : qrOpacity,
        transform: isRefreshingFeedback ? 'scale(0.95)' : 'scale(1)',
        transition: 'opacity 0.2s ease-out, transform 0.2s ease-out'
    };

    const toggleFullscreenBrightness = useCallback(async () => {
        soundAndHaptics.playClick();
        setIsMaxBrightnessFullscreen(prev => {
            const nextState = !prev;
            if (nextState) {
                void requestWakeLock();
                if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                }
            } else if (typeof document !== 'undefined' && document.exitFullscreen && document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
            }
            return nextState;
        });
    }, [requestWakeLock]);

    usePresenterShortcuts({
        onToggleFullscreen: toggleFullscreenBrightness,
        onRefreshToken: fetchCurrentToken,
        isFullscreen: isMaxBrightnessFullscreen,
        onExitFullscreen: () => setIsMaxBrightnessFullscreen(false)
    });

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center p-3 sm:p-6 py-6 sm:py-10 pb-20 sm:pb-28 min-h-[calc(100vh-120px)] relative">
            <div className="w-full max-w-full rounded-3xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.08)] p-4 sm:p-8 md:p-10 my-auto box-border relative overflow-visible">
                <div className="w-full">
                    {loading ? (
                        <QRGhostLoader />
                    ) : (
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 py-2 w-full">
                            <div className="flex flex-col items-center w-[280px] max-w-full shrink-0">
                                <QRDisplayArea
                                    isFormationClosed={isFormationClosed}
                                    selectedFormationId={selectedFormationId}
                                    fadeStyle={fadeStyle}
                                    qrPayload={qrPayload}
                                    onDoubleClick={toggleFullscreenBrightness}
                                    t={t}
                                />
                                
                                <AdminControlsBadges
                                    adminCoords={adminCoords}
                                    selectedFormationId={selectedFormationId}
                                    isFormationClosed={isFormationClosed}
                                    onToggleFullscreen={toggleFullscreenBrightness}
                                    t={t}
                                />
                            </div>

                            <div className="flex flex-col items-center md:items-start text-center md:text-left max-w-sm w-full">
                                <h2 className="qr-title text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
                                    {t('qr.title')}
                                </h2>
                                <p className="qr-subtitle mb-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                                    {t('qr.subtitle')}
                                </p>

                                <div className="w-full mb-3 text-left relative z-40">
                                    <div className="mb-3">
                                        <label htmlFor="formationId" className="block mb-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{t('qr.selectFormation')}</label>
                                        <GlassDropdown
                                            options={activeFormations.map(f => ({
                                                value: f.id,
                                                label: getFormationDropdownLabel(f, t)
                                            }))}
                                            value={selectedFormationId || ''}
                                            onChange={(val) => {
                                                setSelectedFormationId(val ? Number.parseInt(val, 10) : null);
                                            }}
                                            placeholder={t('qr.selectFormationPlaceholder')}
                                            floating={true}
                                            searchable={true}
                                        />
                                    </div>
                                </div>

                                <PINDisplaySection
                                    isFormationClosed={isFormationClosed}
                                    selectedFormationId={selectedFormationId}
                                    totpToken={totpToken}
                                    progress={progress}
                                    isEnding={isEnding}
                                    fadeStyle={fadeStyle}
                                    securityText={t('qr.totpSecurity')}
                                    t={t}
                                />

                                {Boolean(selectedFormationId && !isFormationClosed) && (
                                    <div className="w-full mt-3 pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-center md:justify-start gap-1 text-[11px] text-slate-400 dark:text-slate-500 flex-wrap">
                                        <span className="font-semibold text-slate-500 dark:text-slate-400">{t('qr.shortcuts', 'Atajos')}:</span>
                                        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] border border-slate-300 dark:border-slate-600 font-bold">F</kbd>
                                        <span>{t('qr.projector', 'Proyector')}</span>
                                        <span className="opacity-40">·</span>
                                        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] border border-slate-300 dark:border-slate-600 font-bold">Espacio</kbd>
                                        <span>{t('qr.refresh', 'Refrescar')}</span>
                                        <span className="opacity-40">·</span>
                                        <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[10px] border border-slate-300 dark:border-slate-600 font-bold">Esc</kbd>
                                        <span>{t('qr.exit', 'Salir')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <FullscreenModal
                isOpen={Boolean(isMaxBrightnessFullscreen && selectedFormationId && !isFormationClosed)}
                formationName={formations.find(f => f.id === selectedFormationId)?.name}
                onClose={toggleFullscreenBrightness}
                fadeStyle={fadeStyle}
                qrPayload={qrPayload}
                totpToken={totpToken}
                progress={progress}
                isEnding={isEnding}
                selectedFormationId={selectedFormationId}
                t={t}
            />
        </div>
    );
}