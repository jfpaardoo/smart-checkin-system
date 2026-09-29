import React from 'react';
import { render, screen, fireEvent, act } from '../test-utils';
import PwaInstallPrompt from './PwaInstallPrompt';
import * as pwaHelper from '../util/pwaHelper';

describe('PwaInstallPrompt Component', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  test('does not render when app is already in standalone mode', () => {
    jest.spyOn(pwaHelper, 'isAppStandalone').mockReturnValue(true);
    render(<PwaInstallPrompt />);
    expect(screen.queryByLabelText(/Instalar/i)).not.toBeInTheDocument();
  });

  test('renders 3 clear visual steps for iPhone (iOS)', () => {
    jest.spyOn(pwaHelper, 'isAppStandalone').mockReturnValue(false);
    jest.spyOn(pwaHelper, 'getDevicePlatform').mockReturnValue('ios');

    render(<PwaInstallPrompt />);

    expect(screen.getByLabelText(/Instalar App en iPhone/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Compartir/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Añadir a pantalla de inicio/i)).toBeInTheDocument();
    expect(screen.getByText(/El botón Compartir está abajo en Safari/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entendido/i })).toBeInTheDocument();
  });

  test('renders direct 1-click install button for Android when native prompt is available', async () => {
    jest.spyOn(pwaHelper, 'isAppStandalone').mockReturnValue(false);
    jest.spyOn(pwaHelper, 'getDevicePlatform').mockReturnValue('android');

    render(<PwaInstallPrompt />);

    // Simulate beforeinstallprompt event
    const mockPrompt = jest.fn();
    const mockEvent = new Event('beforeinstallprompt');
    mockEvent.preventDefault = jest.fn();
    mockEvent.prompt = mockPrompt;
    mockEvent.userChoice = Promise.resolve({ outcome: 'accepted' });

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    const installBtn = screen.getByRole('button', { name: /Instalar Aplicación/i });
    expect(installBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(installBtn);
    });

    expect(mockPrompt).toHaveBeenCalled();
  });

  test('renders manual steps for Android when native prompt is unavailable', () => {
    jest.spyOn(pwaHelper, 'isAppStandalone').mockReturnValue(false);
    jest.spyOn(pwaHelper, 'getDevicePlatform').mockReturnValue('android');

    render(<PwaInstallPrompt />);

    // When native prompt has not fired, manual steps are rendered directly
    expect(screen.getByText(/tres puntos \(⋮\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Instalar aplicación/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entendido/i })).toBeInTheDocument();
  });

  test('dismisses and saves state in sessionStorage when close button is clicked', () => {
    jest.spyOn(pwaHelper, 'isAppStandalone').mockReturnValue(false);
    jest.spyOn(pwaHelper, 'getDevicePlatform').mockReturnValue('ios');

    render(<PwaInstallPrompt />);

    const closeBtn = screen.getByRole('button', { name: /Cerrar/i });
    fireEvent.click(closeBtn);

    expect(sessionStorage.getItem('da_pwa_dismissed')).toBe('true');
    expect(screen.queryByLabelText(/Instalar App en iPhone/i)).not.toBeInTheDocument();
  });

  test('re-opens prompt when da-open-pwa-install event is triggered', () => {
    sessionStorage.setItem('da_pwa_dismissed', 'true');
    jest.spyOn(pwaHelper, 'isAppStandalone').mockReturnValue(false);
    jest.spyOn(pwaHelper, 'getDevicePlatform').mockReturnValue('ios');

    render(<PwaInstallPrompt />);
    expect(screen.queryByLabelText(/Instalar App en iPhone/i)).not.toBeInTheDocument();

    act(() => {
      pwaHelper.triggerOpenPwaInstall();
    });

    expect(screen.getByLabelText(/Instalar App en iPhone/i)).toBeInTheDocument();
  });
});
