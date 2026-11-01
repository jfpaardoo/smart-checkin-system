import React from 'react';
import { render, screen, fireEvent, act } from '../test-utils';
import BottomTabBar from './BottomTabBar';
import tokenService from '../services/token.service';
import soundAndHaptics from '../util/soundAndHaptics';

jest.mock('../services/token.service');
jest.mock('../util/soundAndHaptics', () => ({
    playClick: jest.fn(),
    vibrateLight: jest.fn(),
    vibrateSuccess: jest.fn(),
    vibrateWarning: jest.fn(),
    vibrateError: jest.fn()
}));

describe('BottomTabBar Component', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders nothing when user is not logged in', () => {
        tokenService.getUser.mockReturnValue(null);
        render(<BottomTabBar />);
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    });

    test('renders standard employee tabs including checkin', () => {
        tokenService.getUser.mockReturnValue({
            username: 'employee1',
            roles: ['EMPLOYEE']
        });

        render(<BottomTabBar />);

        expect(screen.getByRole('navigation', { name: /Navegación inferior móvil|bottom/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Inicio|Home/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Fichar|Check-in/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Mis Cursos|My Courses/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Perfil|Profile/i })).toBeInTheDocument();
    });

    test('renders admin tabs without checkin option', () => {
        tokenService.getUser.mockReturnValue({
            username: 'admin',
            roles: ['ADMIN']
        });

        render(<BottomTabBar />);

        expect(screen.getByRole('link', { name: /Inicio|Home/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Formaciones|Formations/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Generador QR|QR Aula|QR Generator/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Perfil|Profile/i })).toBeInTheDocument();
        expect(screen.queryByRole('link', { name: /Fichar|Check-in/i })).not.toBeInTheDocument();
    });

    test('renders HR manager tabs with analytics', () => {
        tokenService.getUser.mockReturnValue({
            username: 'hr_user',
            roles: ['HR_MANAGER']
        });

        render(<BottomTabBar />);

        expect(screen.getByRole('link', { name: /Inicio|Home/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Formaciones|Formations/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Analíticas|Analytics/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Perfil|Profile/i })).toBeInTheDocument();
    });

    test('calls soundAndHaptics.playClick when a tab is clicked', () => {
        tokenService.getUser.mockReturnValue({
            username: 'employee1',
            roles: ['EMPLOYEE']
        });

        render(<BottomTabBar />);
        const homeLink = screen.getByRole('link', { name: /Inicio|Home/i });
        fireEvent.click(homeLink);

        expect(soundAndHaptics.playClick).toHaveBeenCalled();
    });

    test('updates reactively when auth-change event is dispatched', () => {
        tokenService.getUser.mockReturnValue(null);
        render(<BottomTabBar />);
        expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

        // Simulate login
        tokenService.getUser.mockReturnValue({
            username: 'admin',
            roles: ['ADMIN']
        });

        act(() => {
            window.dispatchEvent(new Event('auth-change'));
        });

        expect(screen.getByRole('navigation', { name: /Navegación inferior móvil|bottom/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Formaciones|Formations/i })).toBeInTheDocument();
    });
});
