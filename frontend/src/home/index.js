import React from 'react';
import { Link } from 'react-router-dom';
import tokenService from '../services/token.service';
import '../App.css';

export default function Home(){
    const jwt = tokenService.getLocalAccessToken();

    return(
        <div className="ba-container">
            <div className="ba-card home-card">
                <div className="logo-crop home-logo">
                    <img src="/ba-logo.png" alt="BA Glass" />
                </div>
                <h1 className="home-title">Welcome to ShiftSync</h1>
                <h3 className="home-subtitle">Smart Check-in & Employee Management System</h3>
                <div className="mt-4">
                    {jwt ? (
                        <div className="d-flex flex-column align-items-center mt-3">
                            <p className="home-footer-text mb-3">You are logged in. Access your dashboard to view your info and check in/out.</p>
                            <Link to="/dashboard" className="ba-btn ba-btn-primary" style={{ width: '250px', fontSize: '1.2rem', padding: '12px' }}>
                                Go to Dashboard
                            </Link>
                        </div>
                    ) : (
                        <p className="home-footer-text">Please select an option from the navigation menu above to get started.</p>
                    )}
                </div>
            </div>
        </div>
    );
}