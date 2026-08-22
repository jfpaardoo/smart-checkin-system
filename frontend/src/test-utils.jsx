import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { ToastProvider } from './components/ToastProvider';
import { ThemeProvider } from './context/ThemeContext';

const AllProviders = ({ children }) => (
    <BrowserRouter>
        <ThemeProvider>
            <I18nextProvider i18n={i18n}>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </I18nextProvider>
        </ThemeProvider>
    </BrowserRouter>
);

const customRender = (ui, options) =>
    render(ui, { wrapper: AllProviders, ...options });

const testRenderList = (title) => {
    const re = new RegExp(title, 'i');

    const heading = screen.getByRole('heading', { 'name': re });
    expect(heading).toBeInTheDocument();

    const table = screen.getByRole('table', { 'name': re });
    expect(table).toBeInTheDocument();

    const addLink = screen.getByRole('link', { 'name': /Add/ });
    expect(addLink).toBeInTheDocument();

    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(1);

}

// re-export everything
export * from '@testing-library/react'

// override render method
export { customRender as render, testRenderList }