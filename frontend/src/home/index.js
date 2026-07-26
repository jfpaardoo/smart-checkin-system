import React from 'react';
import '../App.css';

export default function Home(){
    return(
        <div className="ba-container">
            <div className="ba-card home-card">
                <div className="logo-crop home-logo">
                    <img src="/ba-logo.png" alt="BA Glass" />
                </div>
                <h1 className="home-title">Welcome to ShiftSync</h1>
                <h3 className="home-subtitle">Smart Check-in & Employee Management System</h3>
                <div className="mt-4">
                    <p className="home-footer-text">Please select an option from the navigation menu above to get started.</p>
                </div>
            </div>
        </div>
    );
}