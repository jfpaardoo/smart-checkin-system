const { test, expect } = require('@playwright/test');

test.describe('Flujo de Aprobación por Administrador (Admin Approval E2E)', () => {

  test('Debe permitir al Administrador ver la pestaña de solicitudes pendientes y aprobar a un empleado', async ({ page }) => {

    // Interceptar validación de token JWT — el endpoint real devuelve un booleano crudo
    await page.route('**/api/v1/auth/validate**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(true),
      });
    });

    // Interceptar API de datos propios
    await page.route('**/api/v1/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, username: 'admin', authority: { authority: 'ADMIN' } }),
      });
    });

    await page.route('**/api/v1/users/me/formations', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // Interceptar API de lista de usuarios aprobados
    await page.route('**/api/v1/users?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User', personalCode: '0000', isWorking: false, isApproved: true, authority: { authority: 'ADMIN' } }
        ]),
      });
    });

    await page.route('**/api/v1/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User', personalCode: '0000', isWorking: false, isApproved: true, authority: { authority: 'ADMIN' } }
        ]),
      });
    });

    // Interceptar API de usuarios pendientes
    await page.route('**/api/v1/users/pending', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 2, username: 'nuevoempleado', firstName: 'Juan', lastName: 'Pérez', personalCode: '1234', isWorking: false, isApproved: false, authority: { authority: 'EMPLOYEE' } }
        ]),
      });
    });

    // Interceptar API de aprobación del empleado
    await page.route('**/api/v1/users/2/approve', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'User approved successfully' }),
      });
    });

    // Inyectar Admin JWT y Usuario en localStorage
  const validAdminJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImF1dGhvcml0aWVzIjpbIkFETUlOIl0sImV4cCI6MjUzNDAyMzAwNzk5fQ.mock";
  await page.addInitScript((token) => {
    window.localStorage.setItem('jwt', JSON.stringify(token));
    window.localStorage.setItem('user', JSON.stringify({ username: 'admin', roles: ['ADMIN'], authority: { authority: 'ADMIN' } }));
  }, validAdminJwt);

    // 1. Cargar aplicación en la raíz
    await page.goto('/');

    // 2. Abrir menú de Administración en el Navbar
    const adminMenu = page.getByRole('button', { name: /administration|administración/i }).or(page.getByRole('link', { name: /administration|administración/i }));
    await expect(adminMenu).toBeVisible();
    await adminMenu.click();

    // Hacer clic en la opción "Usuarios" / "Empleados"
    const usersLink = page.getByRole('menuitem', { name: /usuarios|users|empleados/i }).or(page.getByRole('link', { name: /usuarios|users|empleados/i }));
    await expect(usersLink).toBeVisible();
    await usersLink.click();

    // Confirmar cambio de URL
    await page.waitForURL('**/users');

    // 3. Cambiar a la pestaña "Solicitudes Pendientes"
    const pendingTab = page.getByRole('tab', { name: /solicitudes pendientes|pending requests/i }).or(page.getByText(/solicitudes pendientes|pending requests/i));
    await expect(pendingTab).toBeVisible({ timeout: 15000 });
    await pendingTab.click();

    // 4. Verificar que el usuario pendiente figura en la tabla
    await expect(page.getByRole('cell', { name: 'nuevoempleado' })).toBeVisible();

    // 5. Hacer clic en el botón Aprobar
    const approveBtn = page.getByRole('button', { name: /aprobar|approve/i }).first();
    await approveBtn.click();
  });
});