import { render, screen } from "../../test-utils";
import UserListAdmin from "./UserListAdmin";

describe('UserListAdmin', () => {
    test('renders user management header correctly', () => {
        render(<UserListAdmin />);
        expect(screen.getByText(/Gestión de Usuarios|User Management/i)).toBeInTheDocument();
    });

    test('renders tabs and action buttons', () => {
        render(<UserListAdmin />);
        expect(screen.getByText(/Todos Activos|All Active/i)).toBeInTheDocument();
        expect(screen.getByText(/Administradores|Admins/i)).toBeInTheDocument();
        expect(screen.getByText(/Empleados|Employees/i)).toBeInTheDocument();
        expect(screen.getByText(/Solicitudes Pendientes|Pending Requests/i)).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Añadir|Add/i })).toBeInTheDocument();
    });
});