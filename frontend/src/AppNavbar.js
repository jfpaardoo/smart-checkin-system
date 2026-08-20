import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaUsers, FaBuilding, FaGraduationCap, FaQrcode, FaSignOutAlt, FaUserShield, FaUser, FaBookOpen, FaChartLine, FaIdCard, FaUserPlus, FaSignInAlt, FaShieldAlt, FaCloudUploadAlt, FaBars, FaTimes, FaBell, FaCheck } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import tokenService from './services/token.service';

import LanguageSwitcher from './components/LanguageSwitcher';
import NotificationBell from './components/NotificationBell';

const LANGUAGES = [
    { code: 'es', label: 'Español' },
    { code: 'en', label: 'English' },
    { code: 'pt', label: 'Português' },
    { code: 'fr', label: 'Français' },
    { code: 'de', label: 'Deutsch' },
    { code: 'pl', label: 'Polski' },
    { code: 'bg', label: 'Български' },
    { code: 'ro', label: 'Română' },
];

function AdminDropdownMenu({ isOpen, toggleMenu, closeAll, t }) {
    return (
        <div className="relative dropdown-container">
            <button type="button" onClick={(e) => toggleMenu('admin', e)} className="da-nav-btn">
                <FaUserShield />
                {t('nav.administration')}
                <svg className={`w-4 h-4 ml-1 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div className={`da-nav-dropdown-container left-0 w-[240px] transition-all duration-300 origin-top-left ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-4 invisible pointer-events-none'}`}>
                <div className="py-1" role="menu">
                    <Link to="/users" className="da-nav-dropdown-item" onClick={closeAll}><FaUsers className="text-white/60" /> {t('nav.manageUsers')}</Link>
                    <Link to="/companies" className="da-nav-dropdown-item" onClick={closeAll}><FaBuilding className="text-white/60" /> {t('nav.manageCompanies', 'Empresas')}</Link>
                    <Link to="/formations" className="da-nav-dropdown-item" onClick={closeAll}><FaGraduationCap className="text-white/60" /> {t('nav.manageFormations')}</Link>
                    <Link to="/analytics" className="da-nav-dropdown-item" onClick={closeAll}><FaChartLine className="text-white/60" /> {t('nav.analytics')}</Link>
                    <Link to="/audit" className="da-nav-dropdown-item" onClick={closeAll}><FaShieldAlt className="text-white/60" /> {t('nav.audit', 'Auditoría')}</Link>
                    <Link to="/admin/cloud-settings" className="da-nav-dropdown-item" onClick={closeAll}><FaCloudUploadAlt className="text-white/60" /> {t('nav.cloudSettings', 'Ajustes de Nube')}</Link>
                    <div className="border-t border-white/20 my-1 mx-2"></div>
                    <Link to="/qr-generator" className="da-nav-dropdown-item" onClick={closeAll}><FaQrcode className="text-white/60" /> {t('nav.qrGenerator')}</Link>
                    <Link to="/docs" className="da-nav-dropdown-item" onClick={closeAll}><FaBookOpen className="text-white/60" /> {t('nav.docs')}</Link>
                </div>
            </div>
        </div>
    );
}

function UserDropdownMenu({ isOpen, toggleMenu, closeAll, username, t }) {
    return (
        <div className="relative dropdown-container">
            <button type="button" onClick={(e) => toggleMenu('user', e)} className="da-nav-btn">
                <FaUser className="text-white/80" />
                {username}
                <svg className={`w-4 h-4 ml-1 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div className={`da-nav-dropdown-container right-0 w-[230px] transition-all duration-300 origin-top-right ${isOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-4 invisible pointer-events-none'}`}>
                <div className="py-1" role="menu">
                    <Link to="/profile" className="da-nav-dropdown-item" onClick={closeAll}><FaIdCard className="text-white/60" /> {t('nav.profile', 'Mi Perfil')}</Link>
                    <div className="border-t border-white/20 my-1 mx-2"></div>
                    <Link to="/logout" className="da-nav-dropdown-item" onClick={closeAll}><FaSignOutAlt className="text-red-400" /> {t('nav.logout', 'Salir')}</Link>
                </div>
            </div>
        </div>
    );
}

function PublicNavLinks({ t }) {
    return (
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <Link to="/register" className="flex items-center justify-center gap-2 text-white/80 hover:text-white no-underline font-medium transition-colors duration-300">
                <FaUserPlus /> {t('nav.register', 'Solicitar Registro')}
            </Link>
            <Link to="/login" className="flex items-center justify-center gap-2 text-white/80 hover:text-white no-underline font-medium transition-colors duration-300">
                <FaSignInAlt /> {t('nav.login', 'Iniciar Sesión')}
            </Link>
        </div>
    );
}

function MobileMenuDrawer({ isOpen, roles, user, username, mobileLangOpen, toggleMobileLang, currentLangCode, closeAll, t, i18n }) {
    return (
        <div className={`md:hidden transition-all duration-500 ease-in-out w-full rounded-b-[40px] ${!isOpen ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[85vh] opacity-100 bg-slate-800/25 backdrop-blur-sm border-t border-white/20 overflow-y-auto'}`}>
            <div className="px-6 pt-4 pb-8 space-y-2">
                {roles.includes("ADMIN") && (
                    <div className="py-2 border-b border-white/10 mb-3">
                        <div className="text-[10px] font-extrabold text-white/40 mb-3 uppercase tracking-widest">{t('nav.administration')}</div>
                        <div className="space-y-1">
                            <Link to="/users" className="da-nav-dropdown-item" onClick={closeAll}><FaUsers className="text-white/60" /> {t('nav.manageUsers')}</Link>
                            <Link to="/companies" className="da-nav-dropdown-item" onClick={closeAll}><FaBuilding className="text-white/60" /> {t('nav.manageCompanies', 'Empresas')}</Link>
                            <Link to="/formations" className="da-nav-dropdown-item" onClick={closeAll}><FaGraduationCap className="text-white/60" /> {t('nav.manageFormations')}</Link>
                            <Link to="/analytics" className="da-nav-dropdown-item" onClick={closeAll}><FaChartLine className="text-white/60" /> {t('nav.analytics')}</Link>
                            <Link to="/audit" className="da-nav-dropdown-item" onClick={closeAll}><FaShieldAlt className="text-white/60" /> {t('nav.audit', 'Auditoría')}</Link>
                            <Link to="/admin/cloud-settings" className="da-nav-dropdown-item" onClick={closeAll}><FaCloudUploadAlt className="text-white/60" /> {t('nav.cloudSettings', 'Ajustes de Nube')}</Link>
                            <div className="border-t border-white/20 my-1 mx-2"></div>
                            <Link to="/qr-generator" className="da-nav-dropdown-item" onClick={closeAll}><FaQrcode className="text-white/60" /> {t('nav.qrGenerator')}</Link>
                            <Link to="/docs" className="da-nav-dropdown-item" onClick={closeAll}><FaBookOpen className="text-white/60" /> {t('nav.docs')}</Link>
                        </div>
                    </div>
                )}
                <div className="flex flex-col gap-2 py-2">
                    {!user ? (
                        <div className="flex flex-col gap-2">
                            <Link to="/register" className="da-nav-dropdown-item" onClick={closeAll}><FaUserPlus className="text-white/60" /> {t('nav.register', 'Solicitar Registro')}</Link>
                            <Link to="/login" className="flex items-center gap-3 px-[18px] py-[10px] my-1 text-[0.95rem] bg-[#b3c34c] text-slate-900 rounded-[20px] font-semibold shadow-md" onClick={closeAll}><FaSignInAlt /> {t('nav.login', 'Iniciar Sesión')}</Link>
                        </div>
                    ) : (
                        <div className="border-t border-white/10 pt-4 mt-2">
                            <div className="text-[10px] font-extrabold text-white/40 mb-3 uppercase tracking-widest">{username}</div>
                            <div className="space-y-1">
                                <Link to="/profile" className="da-nav-dropdown-item" onClick={closeAll}><FaIdCard className="text-white/60" /> {t('nav.profile', 'Mi Perfil')}</Link>
                                <Link to="/logout" className="flex items-center gap-3 px-[18px] py-[12px] my-1 text-[1rem] font-bold text-red-400 rounded-2xl hover:bg-white/10 transition-colors" onClick={closeAll}><FaSignOutAlt className="text-red-400" /> {t('nav.logout', 'Salir')}</Link>
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex flex-col items-center border-t border-white/10 mt-2 text-white">
                        <LanguageSwitcher
                            isMobile={true}
                            isOpen={mobileLangOpen}
                            onToggle={toggleMobileLang}
                        />
                        <div className={`w-full transition-all duration-300 overflow-hidden ${mobileLangOpen ? 'max-h-60 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2 space-y-1 border border-white/10 max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                                {LANGUAGES.map(({ code, label }) => {
                                    const isSelected = currentLangCode === code;
                                    return (
                                        <button
                                            key={code}
                                            type="button"
                                            onClick={() => {
                                                i18n.changeLanguage(code);
                                                closeAll();
                                            }}
                                            className={`flex items-center gap-3 px-[18px] py-[10px] my-1 text-[0.95rem] font-medium text-white rounded-[20px] hover:bg-white/20 transition-all duration-300 w-full text-left ${isSelected ? 'bg-white/20 font-bold' : ''}`}
                                        >
                                            <span>{label}</span>
                                            {isSelected && <FaCheck className="text-[#b3c34c] text-xs ml-auto" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MobileNotificationDrawer({ isOpen, t }) {
    return (
        <div className={`md:hidden transition-all duration-500 ease-in-out w-full ${!isOpen ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[60vh] opacity-100 bg-slate-800/25 backdrop-blur-sm border-t border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)] rounded-b-[40px] overflow-hidden'}`}>
            <div className="px-6 py-4">
                <div className="flex justify-between items-center pb-2 border-b border-white/10 mb-3">
                    <span className="text-[11px] font-extrabold text-white/40 uppercase tracking-widest">
                        {t('notifications.title', 'Notificaciones')}
                    </span>
                </div>
                <div className="text-center py-6">
                    <FaBell className="mx-auto mb-2 text-white/20" size={28} />
                    <p className="text-xs text-white/50 m-0">{t('notifications.empty', 'Sin notificaciones')}</p>
                </div>
            </div>
        </div>
    );
}

export default function AppNavbar() {
    const { t, i18n } = useTranslation();
    useLocation();
    const user = tokenService.getUser();
    const roles = user?.roles || [];
    const username = user?.username || "";

    const [openMenu, setOpenMenu] = useState(null);
    const [mobileLangOpen, setMobileLangOpen] = useState(false);

    const currentLangCode = i18n.resolvedLanguage || 'es';

    const toggleMenu = (menuName, e) => {
        if (e) e.stopPropagation();
        setOpenMenu(prev => prev === menuName ? null : menuName);
        setMobileLangOpen(false);
    };

    const toggleMobileLang = (e) => {
        if (e) e.stopPropagation();
        setMobileLangOpen(prev => !prev);
    };

    const closeAll = () => {
        setOpenMenu(null);
        setMobileLangOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.da-nav-dropdown-container') &&
                !event.target.closest('.notif-dropdown-container') &&
                !event.target.closest('.lang-switcher-container') &&
                !event.target.closest('.mobile-menu-btn')) {
                closeAll();
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const isAdminOpen = openMenu === 'admin';
    const isUserOpen = openMenu === 'user';
    const isLangOpen = openMenu === 'lang';
    const isNotifOpen = openMenu === 'notif';
    const isNavMobileOpen = openMenu === 'menu';
    const isMobileDrawerOpen = isNavMobileOpen || isNotifOpen;

    return (
        <nav className={`sticky top-3 z-40 mx-auto w-[calc(100%-24px)] max-w-[1080px] mb-6 sm:mb-8 rounded-[40px] bg-slate-800/40 backdrop-blur-xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.3)] transition-all duration-300 ${isMobileDrawerOpen ? 'overflow-hidden md:overflow-visible' : 'md:overflow-visible'}`}>
            <div className="w-full px-3.5 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-[58px] sm:h-[64px]">
                    <div className="flex items-center min-w-0 flex-1">
                        <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group text-white hover:text-white no-underline min-w-0" onClick={closeAll}>
                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex items-center justify-center shadow-[0_2px_5px_rgba(0,0,0,0.2)] group-hover:scale-105 transition-transform duration-300 shrink-0 bg-white/10 backdrop-blur-md">
                                <img src="/logo.png" alt={t('common.companyLogo', 'Logo de la empresa')} className="w-[48px] h-[48px] sm:w-[60px] sm:h-[60px] object-cover" />
                            </div>
                            <span className="text-[1.25rem] lg:text-[1.4rem] font-semibold tracking-tight hidden md:block whitespace-nowrap drop-shadow-md">
                                Distribution Academy
                            </span>
                            <div className="flex flex-col justify-center leading-none md:hidden shrink-0">
                                <span className="text-[11.5px] sm:text-sm font-bold tracking-tight text-white drop-shadow-sm whitespace-nowrap">
                                    Distribution
                                </span>
                                <span className="text-[8.5px] sm:text-[10px] font-extrabold text-[#d4e157] tracking-widest uppercase mt-0.5">
                                    Academy
                                </span>
                            </div>
                        </Link>
                        {roles.includes("ADMIN") && (
                            <div className="hidden md:flex ml-8">
                                <AdminDropdownMenu
                                    isOpen={isAdminOpen}
                                    toggleMenu={toggleMenu}
                                    closeAll={closeAll}
                                    t={t}
                                />
                            </div>
                        )}
                    </div>

                    <div className="hidden md:flex md:items-center md:space-x-3">
                        {!user ? (
                            <PublicNavLinks t={t} />
                        ) : (
                            <>
                                <div className="text-white list-none">
                                    <NotificationBell
                                        isOpen={isNotifOpen}
                                        onToggle={(e) => toggleMenu('notif', e)}
                                    />
                                </div>
                                <UserDropdownMenu
                                    isOpen={isUserOpen}
                                    toggleMenu={toggleMenu}
                                    closeAll={closeAll}
                                    username={username}
                                    t={t}
                                />
                            </>
                        )}
                        <div className="text-white ml-2 list-none">
                            <LanguageSwitcher
                                isMobile={false}
                                isOpen={isLangOpen}
                                onToggle={(e) => toggleMenu('lang', e)}
                            />
                        </div>
                    </div>

                    {/* Mobile Hamburger & Bell Toggle */}
                    <div className="flex items-center space-x-1 sm:space-x-2 md:hidden">
                        {user && (
                            <NotificationBell
                                isMobile={true}
                                isOpen={isNotifOpen}
                                onToggle={(e) => toggleMenu('notif', e)}
                            />
                        )}
                        <button type="button"
                            onClick={(e) => toggleMenu('menu', e)}
                            aria-label={t('nav.toggleMenu', 'Toggle navigation')}
                            className="mobile-menu-btn p-2 rounded-[20px] text-white hover:bg-white/20 focus:outline-none transition-colors"
                        >
                            {!isNavMobileOpen ? <FaBars className="h-5 w-5 sm:h-6 sm:w-6" /> : <FaTimes className="h-5 w-5 sm:h-6 sm:w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            <MobileMenuDrawer
                isOpen={isNavMobileOpen}
                roles={roles}
                user={user}
                username={username}
                mobileLangOpen={mobileLangOpen}
                toggleMobileLang={toggleMobileLang}
                currentLangCode={currentLangCode}
                closeAll={closeAll}
                t={t}
                i18n={i18n}
            />

            <MobileNotificationDrawer
                isOpen={isNotifOpen}
                t={t}
            />
        </nav>
    );
}