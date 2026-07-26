import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './global.css';
import '@splidejs/react-splide/css/sea-green';
import './i18n';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter } from 'react-router-dom';
import { WebSocketProvider } from './context/WebSocketProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '1.2rem', color: '#888' }}>Loading...</div>}>
      <WebSocketProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </WebSocketProvider>
    </Suspense>
  </React.StrictMode>
);
reportWebVitals();
