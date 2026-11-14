import React from 'react';
import { render, screen, fireEvent } from '../../../test-utils';
import ManualCheckinForm from './ManualCheckinForm';
import soundAndHaptics from '../../../util/soundAndHaptics';

jest.mock('../../../util/soundAndHaptics', () => ({
  playClick: jest.fn(),
  vibrateLight: jest.fn(),
  vibrateSuccess: jest.fn(),
  vibrateWarning: jest.fn(),
  vibrateError: jest.fn()
}));

const mockToastError = jest.fn();
jest.mock('../../../components/ToastProvider', () => {
  const actual = jest.requireActual('../../../components/ToastProvider');
  return {
    ...actual,
    useToast: () => ({
      error: mockToastError,
      success: jest.fn(),
      info: jest.fn(),
      warning: jest.fn()
    })
  };
});

describe('ManualCheckinForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders manual check-in form heading, input and action buttons', () => {
    render(<ManualCheckinForm onSubmit={jest.fn()} onCancel={jest.fn()} />);

    expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /validar|validate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar|cancel/i })).toBeInTheDocument();
  });

  test('disables submit button and shows error toast on invalid form submission', () => {
    const handleSubmit = jest.fn();
    render(<ManualCheckinForm onSubmit={handleSubmit} onCancel={jest.fn()} />);

    const input = screen.getByPlaceholderText('000000');
    fireEvent.change(input, { target: { value: '123' } });

    const submitBtn = screen.getByRole('button', { name: /validar|validate/i });
    expect(submitBtn).toBeDisabled();

    // Directly submit form to test validation guard
    fireEvent.submit(submitBtn.closest('form'));

    expect(handleSubmit).not.toHaveBeenCalled();
    expect(mockToastError).toHaveBeenCalledWith(
      expect.stringMatching(/6 dígitos|6 digits/i)
    );
  });

  test('calls onSubmit with 6 digits code and plays click sound', () => {
    const handleSubmit = jest.fn();
    render(<ManualCheckinForm onSubmit={handleSubmit} onCancel={jest.fn()} />);

    const input = screen.getByPlaceholderText('000000');
    fireEvent.change(input, { target: { value: '123456' } });

    expect(soundAndHaptics.playClick).toHaveBeenCalled();

    const submitBtn = screen.getByRole('button', { name: /validar|validate/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledWith('123456');
  });

  test('filters out non-digit characters from user input', () => {
    render(<ManualCheckinForm onSubmit={jest.fn()} onCancel={jest.fn()} />);

    const input = screen.getByPlaceholderText('000000');
    fireEvent.change(input, { target: { value: 'ab12c34' } });

    expect(input.value).toBe('1234');
  });

  test('calls onCancel callback when Cancel button is clicked', () => {
    const handleCancel = jest.fn();
    render(<ManualCheckinForm onSubmit={jest.fn()} onCancel={handleCancel} />);

    const cancelBtn = screen.getByRole('button', { name: /cancelar|cancel/i });
    fireEvent.click(cancelBtn);

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
