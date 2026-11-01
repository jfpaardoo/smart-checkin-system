import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FaHome, FaQrcode, FaGraduationCap, FaUser, FaChartLine } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import tokenService from '../services/token.service';
import soundAndHaptics from '../util/soundAndHaptics';

function extractUserRoles(user) {
    if (Array.isArray(user?.roles)) {
        return user.roles;
    }
    if (user?.authority?.authority) {
        return [user.authority.authority];
    }
    if (user?.authority) {
        return [user.authority];
    }
    return [];
}

function getNavigationItems(roles, t) {
    const isAdmin = roles.includes('ADMIN');
    const isHR = roles.includes('HR_MANAGER');

    if (isAdmin) {
        return [
            {
                to: '/',
                icon: FaHome,
                label: t('nav.home', 'Inicio'),
                exact: true
            },
            {
                to: '/formations',
                icon: FaGraduationCap,
                label: t('nav.formations', 'Formaciones')
            },
            {
                to: '/qr-generator',
                icon: FaQrcode,
                label: t('nav.qrGenerator', 'QR Aula')
            },
            {
                to: '/profile',
                icon: FaUser,
                label: t('nav.profile', 'Perfil')
            }
        ];
    }

    if (isHR) {
        return [
            {
                to: '/',
                icon: FaHome,
                label: t('nav.home', 'Inicio'),
                exact: true
            },
            {
                to: '/formations',
                icon: FaGraduationCap,
                label: t('nav.formations', 'Formaciones')
            },
            {
                to: '/analytics',
                icon: FaChartLine,
                label: t('nav.analytics', 'Analíticas')
            },
            {
                to: '/profile',
                icon: FaUser,
                label: t('nav.profile', 'Perfil')
            }
        ];
    }

    // Empleados y alumnos estándar
    return [
        {
            to: '/',
            icon: FaHome,
            label: t('nav.home', 'Inicio'),
            exact: true
        },
        {
            to: '/checkin',
            icon: FaQrcode,
            label: t('nav.checkin', 'Fichar')
        },
        {
            to: '/dashboard',
            icon: FaGraduationCap,
            label: t('nav.myFormations', 'Mis Cursos')
        },
        {
            to: '/profile',
            icon: FaUser,
            label: t('nav.profile', 'Perfil')
        }
    ];
}

export default function BottomTabBar() {
    const { t } = useTranslation();
    const location = useLocation();
    const [user, setUser] = useState(() => tokenService.getUser());

    useEffect(() => {
        const handleAuthChange = () => {
            setUser(tokenService.getUser());
        };
        window.addEventListener('storage', handleAuthChange);
        window.addEventListener('auth-change', handleAuthChange);
        return () => {
            window.removeEventListener('storage', handleAuthChange);
            window.removeEventListener('auth-change', handleAuthChange);
        };
    }, []);

    const roles = extractUserRoles(user);
    const navItems = getNavigationItems(roles, t);

    // Calculate active tab index to smoothly glide the sliding indicator capsule
    const activeIndex = navItems.findIndex((item) =>
        item.exact
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to)
    );

    const [indicatorStyle, setIndicatorStyle] = useState({ left: '0%', width: '0%', opacity: 0 });

    useEffect(() => {
        if (activeIndex >= 0 && navItems.length > 0) {
            const widthPct = 100 / navItems.length;
            const leftPct = activeIndex * widthPct;
            setIndicatorStyle({
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                opacity: 1
            });
        } else {
            setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
        }
    }, [activeIndex, navItems.length]);

    if (!user) {
        return null;
    }

    const handleTabClick = () => {
        soundAndHaptics.playClick();
    };

    return (
        <nav
            className="da-bottom-tab-bar md:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] inset-x-3 sm:inset-x-6 max-w-md mx-auto z-40 rounded-full p-1 transition-all duration-300"
            aria-label={t('nav.bottomNavAria', 'Navegación inferior móvil')}
        >
            <div className="relative flex items-center justify-between w-full">
                {/* Sliding Liquid Glass Sheen Indicator */}
                <div
                    className="absolute top-0 bottom-0 py-0.5 px-0.5 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
                    style={{
                        left: indicatorStyle.left,
                        width: indicatorStyle.width,
                        opacity: indicatorStyle.opacity
                    }}
                >
                    <div className="da-tab-sliding-capsule w-full h-full rounded-full" />
                </div>

                {navItems.map((item, idx) => {
                    const Icon = item.icon;
                    const isActive = idx === activeIndex;

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={handleTabClick}
                            className={`relative z-10 flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-full no-underline select-none transition-all duration-200 ${
                                isActive
                                    ? 'text-[#73841e] dark:text-[#d4e84a] da-tab-active-glow font-bold'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                            title={item.label}
                        >
                            <div className="relative flex items-center justify-center">
                                <Icon className={`text-base sm:text-lg transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} />
                            </div>
                            <span className="text-[10px] sm:text-[11px] font-semibold mt-0.5 tracking-tight leading-none">
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </div>
        </nav>
    );
}
