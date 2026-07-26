import React from 'react';
import '../App.css';

export default function Home(){
    return(
        <div className="ba-container">
            <div className="ba-card" style={{ textAlign: 'center', padding: '60px 20px', marginTop: '40px' }}>
                <img src="/ba-logo.png" alt="BA Glass" style={{ height: '80px', marginBottom: '20px' }} />
                <h1 style={{ fontWeight: '300', marginBottom: '10px' }}>Welcome to ShiftSync</h1>
                <h3 style={{ fontWeight: '400', color: '#666', fontSize: '1.2rem' }}>Smart Check-in & Employee Management System</h3>
                <div style={{ marginTop: '40px' }}>
                    <p style={{ color: '#888' }}>Please select an option from the navigation menu above to get started.</p>
                </div>
            </div>
        </div>
    );
}