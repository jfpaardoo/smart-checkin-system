import React from 'react';
import { render, screen, fireEvent } from '../../../test-utils';
import ManualCheckinForm from './ManualCheckinForm';
import soundAndHaptics from '../../../util/soundAndHaptics';

vi.mock('../../../util/soundAndHaptics', () => {
  const mock = {
    playClick: vi.fn(),
    vibrateLight: vi.fn(),
    vibrateSuccess: vi.fn(),
    vibrateWarning: vi.fn(),
    vibrateError: vi.fn()
  };
  return { default: mock, ...mock };
});

const mockToastError = vi.fn();
vi.mock('../../../components/ToastProvider', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useToast: () => ({
      error: mockToastError,
      success: vi.fn(),
      info: vi.fn(),
      warning: vi.fn()
    })
  };
});

describe('ManualCheckinForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders manual check-in form heading, input and action buttons', () => {
    render(<ManualCheckinForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByRole('heading', { level: 4 })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /validar|validate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancelar|cancel/i })).toBeInTheDocument();
  });

  test('disables submit button and shows error toast on invalid form submission', () => {
    const handleSubmit = vi.fn();
    render(<ManualCheckinForm onSubmit={handleSubmit} onCancel={vi.fn()} />);

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
    const handleSubmit = vi.fn();
    render(<ManualCheckinForm onSubmit={handleSubmit} onCancel={vi.fn()} />);

    const input = screen.getByPlaceholderText('000000');
    fireEvent.change(input, { target: { value: '123456' } });

    expect(soundAndHaptics.playClick).toHaveBeenCalled();

    const submitBtn = screen.getByRole('button', { name: /validar|validate/i });
    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledWith('123456');
  });

  test('filters out non-digit characters from user input', () => {
    render(<ManualCheckinForm onSubmit={vi.fn()} onCancel={vi.fn()} />);

    const input = screen.getByPlaceholderText('000000');
    fireEvent.change(input, { target: { value: 'ab12c34' } });

    expect(input.value).toBe('1234');
  });

  test('calls onCancel callback when Cancel button is clicked', () => {
    const handleCancel = vi.fn();
    render(<ManualCheckinForm onSubmit={vi.fn()} onCancel={handleCancel} />);

    const cancelBtn = screen.getByRole('button', { name: /cancelar|cancel/i });
    fireEvent.click(cancelBtn);

    expect(handleCancel).toHaveBeenCalledTimes(1);
  });
});
