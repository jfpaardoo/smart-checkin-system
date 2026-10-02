import React from 'react';
import { render, screen, fireEvent, act } from '../test-utils';
import PwaTopBanner from './PwaTopBanner';
import * as pwaHelper from '../util/pwaHelper';

describe('PwaTopBanner Component', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  test('does not render when app is in standalone mode', () => {
    jest.spyOn(pwaHelper, 'isAppStandalone').mockReturnValue(true);
    render(<PwaTopBanner />);
    expect(screen.queryByLabelText(/Instalar Distribution Academy/i)).not.toBeInTheDocument();
  });

  test('renders top banner with light & dark theme classes and elements', () => {
    jest.spyOn(pwaHelper, 'isAppStandalone').mockReturnValue(false);
    render(<PwaTopBanner />);

    const banner = screen.getByLabelText(/Instalar Distribution Academy/i);
    expect(banner).toBeInTheDocument();
    
    const infoCapsule = banner.querySelector('.rounded-full.bg-white\\/45');
    expect(infoCapsule).toBeInTheDocument();
    expect(infoCapsule.className).toContain('dark:bg-slate-900/45');
    expect(infoCapsule.className).toContain('backdrop-blur-2xl');

    expect(screen.getByText('Distribution Academy')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cerrar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Instalar/i })).toBeInTheDocument();
  });

  test('dismisses and saves dismissal in sessionStorage', () => {
    jest.spyOn(pwaHelper, 'isAppStandalone').mockReturnValue(false);
    render(<PwaTopBanner />);

    const closeBtn = screen.getByRole('button', { name: /Cerrar/i });
    act(() => {
      fireEvent.click(closeBtn);
    });

    expect(screen.queryByLabelText(/Instalar Distribution Academy/i)).not.toBeInTheDocument();
    expect(sessionStorage.getItem('da_pwa_top_banner_dismissed')).toBe('true');
  });

  test('triggers install flow when install button is clicked', async () => {
    jest.spyOn(pwaHelper, 'isAppStandalone').mockReturnValue(false);
    const mockInstall = jest.spyOn(pwaHelper, 'promptDirectInstall').mockResolvedValue(true);

    render(<PwaTopBanner />);

    const installBtn = screen.getByRole('button', { name: /Instalar/i });
    await act(async () => {
      fireEvent.click(installBtn);
    });

    expect(mockInstall).toHaveBeenCalled();
  });
});
