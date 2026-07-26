import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import tokenService from '../services/token.service';
import '../App.css';

export default function Home(){
    const jwt = tokenService.getLocalAccessToken();
    const { t } = useTranslation();

    return(
        <div className="ba-container">
            <div className="ba-card home-card">
                <div className="logo-crop home-logo">
                    <img src="/ba-logo.png" alt="BA Glass" />
                </div>
                <h1 className="home-title">{t('home.welcome')}</h1>
                <h3 className="home-subtitle">{t('home.subtitle')}</h3>
                <div className="mt-4">
                    {jwt ? (
                        <div className="d-flex flex-column align-items-center mt-3">
                            <p className="home-footer-text mb-3">{t('home.loggedIn')}</p>
                            <Link to="/dashboard" className="ba-btn ba-btn-primary" style={{ width: '250px', fontSize: '1.2rem', padding: '12px' }}>
                                {t('home.goToDashboard')}
                            </Link>
                        </div>
                    ) : (
                        <p className="home-footer-text">{t('home.getStarted')}</p>
                    )}
                </div>
            </div>
        </div>
    );
}