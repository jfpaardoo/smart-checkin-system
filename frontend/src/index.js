import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './global.css';
import '@splidejs/react-splide/css/sea-green';
import './i18n';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import { CardGhostLoader } from './components/GhostLoader';
import './static/css/base/variables.css';
import './static/css/base/common.css';
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import { WebSocketProvider } from './context/WebSocketProvider';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Suspense fallback={<CardGhostLoader />}>
      <WebSocketProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <App />
        </BrowserRouter>
      </WebSocketProvider>
    </Suspense>
  </React.StrictMode>
);
reportWebVitals();
