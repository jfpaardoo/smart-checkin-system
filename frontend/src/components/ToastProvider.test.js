import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { ToastProvider, useToast } from './ToastProvider';

jest.mock('../util/soundAndHaptics', () => ({
  playSuccess: jest.fn(),
  playError: jest.fn(),
  playWarning: jest.fn(),
  playInfo: jest.fn(),
  playClick: jest.fn(),
}));

function TestHarness({ onConfirm = jest.fn() }) {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.success('Guardado con éxito')}>Trigger Success</button>
      <button onClick={() => toast.error('Error de red')}>Trigger Error</button>
      <button onClick={() => toast.confirm('¿Confirmar acción?', onConfirm)}>Trigger Confirm</button>
      <button onClick={() => toast.clearAll()}>Clear All</button>
    </div>
  );
}

function renderWithToast(onConfirm) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ToastProvider>
        <TestHarness onConfirm={onConfirm} />
      </ToastProvider>
    </I18nextProvider>
  );
}

describe('ToastProvider & Fluid Animations', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders success toast and dismisses when close button is clicked', async () => {
    renderWithToast();

    fireEvent.click(screen.getByText('Trigger Success'));
    expect(screen.getAllByText('Guardado con éxito').length).toBeGreaterThanOrEqual(1);

    const closeBtn = screen.getByRole('button', { name: /cerrar|close/i });
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Guardado con éxito')).not.toBeInTheDocument();
    });
  });

  test('deduplicates identical consecutive toasts and displays count badge', () => {
    renderWithToast();

    fireEvent.click(screen.getByText('Trigger Success'));
    fireEvent.click(screen.getByText('Trigger Success'));

    expect(screen.getByText('×2')).toBeInTheDocument();
    // 1 toast = 2 matching text nodes (collapsed summary + expandable drawer)
    expect(screen.getAllByText('Guardado con éxito')).toHaveLength(2);
  });

  test('stacks multiple distinct toasts, expands stack controls, and clears all', async () => {
    renderWithToast();

    fireEvent.click(screen.getByText('Trigger Success'));
    fireEvent.click(screen.getByText('Trigger Error'));

    expect(screen.getByText('+1')).toBeInTheDocument();

    fireEvent.click(screen.getByText('+1'));
    const clearAllBtn = screen.getByRole('button', { name: /cerrar todas/i });
    expect(clearAllBtn).toBeInTheDocument();

    fireEvent.click(clearAllBtn);

    await waitFor(() => {
      expect(screen.queryByText('Guardado con éxito')).not.toBeInTheDocument();
      expect(screen.queryByText('Error de red')).not.toBeInTheDocument();
    });
  });

  test('executes onConfirm callback when confirming persistent confirm toast', async () => {
    const onConfirm = jest.fn();
    renderWithToast(onConfirm);

    fireEvent.click(screen.getByText('Trigger Confirm'));
    expect(screen.getAllByText('¿Confirmar acción?').length).toBeGreaterThanOrEqual(1);

    fireEvent.click(screen.getByRole('button', { name: /sí|yes/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByText('¿Confirmar acción?')).not.toBeInTheDocument();
    });
  });
});
