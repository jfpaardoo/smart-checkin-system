import AppNavbar from "./AppNavbar";
import { render, screen } from "./test-utils";

describe('AppNavbar', () => {

    test('renders public links correctly', () => {
        render(<AppNavbar />);
        const linkHomeElement = screen.getByRole('link', { name: /DISTRIBUTION ACADEMY/i });
        expect(linkHomeElement).toBeInTheDocument();

        const loginLinks = screen.getAllByRole('link', { name: /Iniciar Sesión|Login/i });
        expect(loginLinks.length).toBeGreaterThan(0);
    });

    test('renders register link correctly', () => {
        render(<AppNavbar />);
        const registerLinks = screen.getAllByRole('link', { name: /Solicitar Registro|Register/i });
        expect(registerLinks.length).toBeGreaterThan(0);
    });

});
