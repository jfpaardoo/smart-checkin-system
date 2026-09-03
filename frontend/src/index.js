import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './global.css';
import '@splidejs/react-splide/css/sea-green';
import './i18n';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { CardGhostLoader } from './components/GhostLoader';
import './App.css';
import { BrowserRouter } from 'react-router-dom';
import { WebSocketProvider } from './context/WebSocketProvider';
import { ThemeProvider } from './context/ThemeContext';

// Protección contra interrupciones benignas de play() en navegadores (rotar cámara, pausar, cambio a manual)
if (typeof window !== 'undefined' && window.HTMLMediaElement) {
  const originalPlay = window.HTMLMediaElement.prototype.play;
  window.HTMLMediaElement.prototype.play = function(...args) {
    const result = originalPlay.apply(this, args);
    if (result && typeof result.catch === 'function') {
      return result.catch(err => {
        const msg = String(err?.message || err || '');
        if (
          msg.includes('interrupted') ||
          msg.includes('pause()') ||
          msg.includes('new load request') ||
          err?.name === 'AbortError'
        ) {
          console.debug('[Media] Benign play interruption handled:', msg);
          return;
        }
        throw err;
      });
    }
    return result;
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event?.reason;
    const msg = String(reason?.message || reason || '');
    if (
      msg.includes('interrupted') ||
      msg.includes('pause()') ||
      msg.includes('new load request') ||
      (reason?.name === 'AbortError' && msg.includes('play'))
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <Suspense fallback={<CardGhostLoader />}>
        <WebSocketProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <App />
          </BrowserRouter>
        </WebSocketProvider>
      </Suspense>
    </ThemeProvider>
  </React.StrictMode>
);
reportWebVitals();
