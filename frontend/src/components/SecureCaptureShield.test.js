import React from 'react';
import { render, screen, act } from '@testing-library/react';
import SecureCaptureShield from './SecureCaptureShield';

describe('SecureCaptureShield Component', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('renders children in normal state', () => {
        render(
            <SecureCaptureShield>
                <div data-testid="protected-content">Secret QR Content</div>
            </SecureCaptureShield>
        );

        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
        expect(screen.queryByText(/Contenido protegido contra capturas/i)).not.toBeInTheDocument();
    });

    test('triggers blackout overlay when window loses focus (blur)', () => {
        render(
            <SecureCaptureShield>
                <div data-testid="protected-content">Secret QR Content</div>
            </SecureCaptureShield>
        );

        act(() => {
            window.dispatchEvent(new Event('blur'));
        });

        expect(screen.getByText(/Contenido protegido contra capturas/i)).toBeInTheDocument();
    });

    test('restores content when window regains focus', () => {
        render(
            <SecureCaptureShield>
                <div data-testid="protected-content">Secret QR Content</div>
            </SecureCaptureShield>
        );

        act(() => {
            window.dispatchEvent(new Event('blur'));
        });
        expect(screen.getByText(/Contenido protegido contra capturas/i)).toBeInTheDocument();

        // Simulate focus event
        Object.defineProperty(document, 'hasFocus', { value: () => true, configurable: true });
        Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });

        act(() => {
            window.dispatchEvent(new Event('focus'));
            jest.advanceTimersByTime(300);
        });

        expect(screen.queryByText(/Contenido protegido contra capturas/i)).not.toBeInTheDocument();
    });

    test('triggers blackout when PrintScreen key is pressed', () => {
        render(
            <SecureCaptureShield>
                <div data-testid="protected-content">Secret QR Content</div>
            </SecureCaptureShield>
        );

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PrintScreen' }));
        });

        expect(screen.getByText(/Contenido protegido contra capturas/i)).toBeInTheDocument();
    });

    test('PrintScreen blackout unlocks automatically on focus or when clicking overlay', () => {
        render(
            <SecureCaptureShield>
                <div data-testid="protected-content">Secret QR Content</div>
            </SecureCaptureShield>
        );

        act(() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'PrintScreen' }));
        });

        const overlay = screen.getByText(/Contenido protegido contra capturas/i);
        expect(overlay).toBeInTheDocument();

        // Clicking the overlay dismisses it immediately
        act(() => {
            screen.getByText(/Haz clic aquí para restablecer la vista/i).click();
        });
        expect(screen.queryByText(/Contenido protegido contra capturas/i)).not.toBeInTheDocument();
    });

    test('prevents context menu and drag start', () => {
        const { container } = render(
            <SecureCaptureShield>
                <div data-testid="protected-content">Secret QR Content</div>
            </SecureCaptureShield>
        );

        const rootEl = container.firstChild;
        const contextMenuEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
        const dragStartEvent = new MouseEvent('dragstart', { bubbles: true, cancelable: true });

        const contextDefaultPrevented = !rootEl.dispatchEvent(contextMenuEvent);
        const dragDefaultPrevented = !rootEl.dispatchEvent(dragStartEvent);

        expect(contextDefaultPrevented).toBe(true);
        expect(dragDefaultPrevented).toBe(true);
    });
});
