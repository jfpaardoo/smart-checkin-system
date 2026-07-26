import React from 'react';
import { Link } from 'react-router-dom';
import useFetchState from '../../util/useFetchState';
import tokenService from '../../services/token.service';
import { CardGhostLoader } from '../../components/GhostLoader';
import '../../static/css/admin/adminPage.css';

export default function UserDashboard() {
  const jwt = tokenService.getLocalAccessToken();
  const user = tokenService.getUser();

  const [formations, , isLoading] = useFetchState(
    [],
    "/api/v1/users/me/formations",
    jwt
  );

  return (
    <div className="ba-container">
      <div className="ba-card home-card" style={{ maxWidth: '800px', margin: '2rem auto' }}>
        <h2 className="home-title mb-4">Hello, {user?.username}</h2>
        
        <div className="d-flex justify-content-center mb-5">
          <Link to="/checkin" className="ba-btn ba-btn-primary" style={{ padding: '15px 30px', fontSize: '1.2rem', borderRadius: '30px' }}>
            Open QR Scanner (Check In / Out)
          </Link>
        </div>

        <h3 className="mb-3 text-white">Your Formations</h3>
        
        {isLoading ? (
          <CardGhostLoader />
        ) : formations && formations.length > 0 ? (
          <div className="table-responsive">
            <table className="table table-dark table-hover ba-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {formations.map((f) => (
                  <tr key={f.id}>
                    <td>{f.name}</td>
                    <td>{new Date(f.formationDate).toLocaleString()}</td>
                    <td>{f.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-4" style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '15px' }}>
            <p className="text-white mb-0">You are not enrolled in any formations yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
