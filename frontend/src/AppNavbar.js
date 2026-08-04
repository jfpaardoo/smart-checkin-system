import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaUsers, FaGraduationCap, FaQrcode, FaSignOutAlt, FaUserShield, FaUser, FaBookOpen, FaChartLine, FaIdCard, FaUserPlus, FaSignInAlt, FaShieldAlt, FaCloudUploadAlt, FaBars, FaTimes } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import tokenService from './services/token.service';
import jwt_decode from "jwt-decode";
import LanguageSwitcher from './components/LanguageSwitcher';
import NotificationBell from './components/NotificationBell';

function AppNavbar() {
    const { t } = useTranslation();
    const [roles, setRoles] = useState([]);
    const [username, setUsername] = useState("");
    const jwt = tokenService.getLocalAccessToken();
    const [collapsed, setCollapsed] = useState(true);
    const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);

    const toggleNavbar = () => setCollapsed(!collapsed);

    const toggleAdminDropdown = (e) => {
        e.stopPropagation();
        setAdminDropdownOpen(!adminDropdownOpen);
        if (!adminDropdownOpen) setUserDropdownOpen(false);
    };

    const toggleUserDropdown = (e) => {
        e.stopPropagation();
        setUserDropdownOpen(!userDropdownOpen);
        if (!userDropdownOpen) setAdminDropdownOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-container')) {
                setAdminDropdownOpen(false);
                setUserDropdownOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (jwt) {
            try {
                const decoded = jwt_decode(jwt);
                setRoles(decoded.authorities || []);
                setUsername(decoded.sub || "");
            } catch (e) {
                console.error("Invalid token", e);
            }
        }
    }, [jwt])

    let adminLinks = null;
    let userLogout = null;
    let publicLinks = null;

    const dropdownItemClass = "ba-nav-dropdown-item";
    const navBtnClass = "ba-nav-btn";
    const dropdownContainerClassLeft = "ba-nav-dropdown-container left-0 w-[240px]";
    const dropdownContainerClassRight = "ba-nav-dropdown-container right-0 w-[230px]";

    if (roles.includes("ADMIN")) {
        adminLinks = (
            <div className="relative dropdown-container">
                <button type="button"
                    onClick={toggleAdminDropdown}
                    className={navBtnClass}
                >
                    <FaUserShield />
                    {t('nav.administration')}
                    <svg className={`w-4 h-4 ml-1 transition-transform duration-300 ${adminDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div className={`${dropdownContainerClassLeft} transition-all duration-300 origin-top-left ${adminDropdownOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-4 invisible pointer-events-none'}`}>
                    <div className="py-1" role="menu">
                        <Link to="/users" className={dropdownItemClass} onClick={() => setAdminDropdownOpen(false)}><FaUsers className="text-white/60"/> {t('nav.manageUsers')}</Link>
                        <Link to="/formations" className={dropdownItemClass} onClick={() => setAdminDropdownOpen(false)}><FaGraduationCap className="text-white/60"/> {t('nav.manageFormations')}</Link>
                        <Link to="/analytics" className={dropdownItemClass} onClick={() => setAdminDropdownOpen(false)}><FaChartLine className="text-white/60"/> {t('nav.analytics')}</Link>
                        <Link to="/audit" className={dropdownItemClass} onClick={() => setAdminDropdownOpen(false)}><FaShieldAlt className="text-white/60"/> {t('nav.audit', 'Auditoría')}</Link>
                        <Link to="/admin/cloud-settings" className={dropdownItemClass} onClick={() => setAdminDropdownOpen(false)}><FaCloudUploadAlt className="text-white/60"/> {t('nav.cloudSettings', 'Ajustes de Nube')}</Link>
                        <div className="border-t border-white/20 my-1 mx-2"></div>
                        <Link to="/qr-generator" className={dropdownItemClass} onClick={() => setAdminDropdownOpen(false)}><FaQrcode className="text-white/60"/> {t('nav.qrGenerator')}</Link>
                        <Link to="/docs" className={dropdownItemClass} onClick={() => setAdminDropdownOpen(false)}><FaBookOpen className="text-white/60"/> {t('nav.docs')}</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!jwt) {
        publicLinks = (
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <Link to="/register" className="flex items-center justify-center gap-2 text-white/80 hover:text-white no-underline font-medium transition-colors duration-300">
                    <FaUserPlus /> {t('nav.register', 'Solicitar Registro')}
                </Link>
                <Link to="/login" className="flex items-center justify-center gap-2 text-white/80 hover:text-white no-underline font-medium transition-colors duration-300">
                    <FaSignInAlt /> {t('nav.login', 'Iniciar Sesión')}
                </Link>
            </div>
        );
    } else {
        userLogout = (
            <div className="relative dropdown-container">
                <button type="button"
                    onClick={toggleUserDropdown}
                    className={navBtnClass}
                >
                    <FaUser className="text-white/80" />
                    {username}
                    <svg className={`w-4 h-4 ml-1 transition-transform duration-300 ${userDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                <div className={`${dropdownContainerClassRight} transition-all duration-300 origin-top-right ${userDropdownOpen ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-4 invisible pointer-events-none'}`}>
                    <div className="py-1" role="menu">
                        <Link to="/profile" className={dropdownItemClass} onClick={() => setUserDropdownOpen(false)}><FaIdCard className="text-white/60"/> {t('nav.myProfile', 'Mi Perfil')}</Link>
                        <div className="border-t border-white/20 my-1 mx-2"></div>
                        <Link to="/logout" className={dropdownItemClass} onClick={() => setUserDropdownOpen(false)}><FaSignOutAlt className="text-red-400"/> {t('nav.logout')}</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <nav className="ba-nav-capsule">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-[64px]">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-4 group text-white hover:text-white no-underline">
                            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow-[0_2px_5px_rgba(0,0,0,0.2)] group-hover:scale-105 transition-transform duration-300">
                                <img src="/ba-logo.png" alt="BA Glass" className="w-[60px] h-[60px] object-cover invert" />
                            </div>
                            <span className="text-[1.4rem] font-semibold tracking-tight hidden sm:block">
                                Distribution Academy
                            </span>
                            <span className="text-[1.4rem] font-semibold tracking-tight sm:hidden">
                                BA Academy
                            </span>
                        </Link>
                        {/* Admin Links moved next to logo */}
                        <div className="hidden md:flex ml-8">
                            {adminLinks}
                        </div>
                    </div>
                    
                    {/* Desktop Menu */}
                    <div className="hidden md:flex md:items-center md:space-x-3">
                        {publicLinks}
                        {jwt && <div className="text-white hover:bg-white/10 rounded-full p-2 transition-colors cursor-pointer list-none"><NotificationBell /></div>}
                        {userLogout}
                        <div className="text-white ml-2 list-none"><LanguageSwitcher /></div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center md:hidden gap-3">
                        {jwt && <div className="text-white"><NotificationBell /></div>}
                        <button type="button"
                            onClick={toggleNavbar}
                            className="p-2 rounded-[20px] text-white hover:bg-white/20 focus:outline-none transition-colors"
                        >
                            {collapsed ? <FaBars className="h-6 w-6" /> : <FaTimes className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Panel */}
            <div className={`md:hidden transition-all duration-500 ease-in-out w-full ${collapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-[80vh] opacity-100 bg-black/20 border-t border-white/10 rounded-b-4xl overflow-hidden'}`}>
                <div className="px-6 pt-4 pb-8 space-y-2">
                    {roles.includes("ADMIN") && (
                        <div className="py-2 border-b border-white/10 mb-3">
                            <div className="text-[10px] font-extrabold text-white/40 mb-3 uppercase tracking-widest">{t('nav.administration')}</div>
                            <div className="space-y-1">
                                <Link to="/users" className={dropdownItemClass}><FaUsers className="text-white/60"/> {t('nav.manageUsers')}</Link>
                                <Link to="/formations" className={dropdownItemClass}><FaGraduationCap className="text-white/60"/> {t('nav.manageFormations')}</Link>
                                <Link to="/analytics" className={dropdownItemClass}><FaChartLine className="text-white/60"/> {t('nav.analytics')}</Link>
                                <Link to="/audit" className={dropdownItemClass}><FaShieldAlt className="text-white/60"/> Auditoría</Link>
                                <Link to="/admin/cloud-settings" className={dropdownItemClass}><FaCloudUploadAlt className="text-white/60"/> Ajustes de Nube</Link>
                                <Link to="/qr-generator" className={dropdownItemClass}><FaQrcode className="text-white/60"/> {t('nav.qrGenerator')}</Link>
                                <Link to="/docs" className={dropdownItemClass}><FaBookOpen className="text-white/60"/> {t('nav.docs')}</Link>
                            </div>
                        </div>
                    )}
                    <div className="flex flex-col gap-2 py-2">
                        {!jwt && (
                            <div className="flex flex-col gap-2">
                                <Link to="/register" className={dropdownItemClass}><FaUserPlus className="text-white/60"/> {t('nav.register', 'Solicitar Registro')}</Link>
                                <Link to="/login" className="flex items-center gap-3 px-[18px] py-[10px] my-1 text-[0.95rem] bg-ba-primary text-ba-dark rounded-[20px] font-semibold"><FaSignInAlt /> {t('nav.login', 'Iniciar Sesión')}</Link>
                            </div>
                        )}
                        {jwt && (
                            <div className="border-t border-white/10 pt-4 mt-2">
                                <div className="text-[10px] font-extrabold text-white/40 mb-3 uppercase tracking-widest">{username}</div>
                                <div className="space-y-1">
                                    <Link to="/profile" className={dropdownItemClass}><FaIdCard className="text-white/60"/> Mi Perfil</Link>
                                    <Link to="/logout" className="flex items-center gap-3 px-[18px] py-[12px] my-1 text-[1rem] font-bold text-red-400 rounded-2xl hover:bg-white/10 transition-all"><FaSignOutAlt className="text-red-400"/> Salir</Link>
                                </div>
                            </div>
                        )}
                        <div className="pt-4 flex justify-center border-t border-white/10 mt-2 text-white">
                            <LanguageSwitcher />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default AppNavbar;