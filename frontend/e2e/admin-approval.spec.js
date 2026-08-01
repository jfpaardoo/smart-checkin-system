const { test, expect } = require('@playwright/test');

test.describe('Flujo de Aprobación por Administrador (Admin Approval E2E)', () => {

  test('Debe permitir al Administrador ver la pestaña de solicitudes pendientes y aprobar a un empleado', async ({ page }) => {
    
    // Mock /users/me porque el layout verifica al usuario actual para mantener la sesión
    await page.route('/api/v1/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          id: 1, 
          username: 'admin', 
          authority: { authority: 'ADMIN' } 
        }),
      });
    });

    // Mock user list and pending user list APIs
    await page.route('/api/v1/users?*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User', personalCode: '0000', isWorking: false, isApproved: true, authority: { authority: 'ADMIN' } }
        ]),
      });
    });

    await page.route('/api/v1/users', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User', personalCode: '0000', isWorking: false, isApproved: true, authority: { authority: 'ADMIN' } }
        ]),
      });
    });

    await page.route('/api/v1/users/pending', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 2, username: 'nuevoempleado', firstName: 'Juan', lastName: 'Pérez', personalCode: '1234', isWorking: false, isApproved: false, authority: { authority: 'EMPLOYEE' } }
        ]),
      });
    });

    await page.route('/api/v1/users/2/approve', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'User approved successfully' }),
      });
    });

    // Mock Admin token in localStorage (JWT con rol ADMIN y fecha de expiración en el año 9999)
    const validAdminJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImF1dGhvcml0aWVzIjpbIkFETUlOIl0sImV4cCI6MjUzNDAyMzAwNzk5fQ.mock";
    await page.addInitScript((token) => {
      window.localStorage.setItem('jwt', JSON.stringify(token));
    }, validAdminJwt);

    // 1. Ir a la raíz de la aplicación
    await page.goto('/');

    // 2. Navegar orgánicamente interactuando con el Navbar del Administrador
    await page.click('a:has-text("Administration"), a:has-text("Administración")'); 
    
    // Esperar a que la opción del menú desplegable esté visible y hacer clic
    const usersLink = page.locator('text=/Usuarios|Users/i').first();
    await expect(usersLink).toBeVisible();
    await usersLink.click();

    // Confirmar que el router de React ha cambiado la URL a /users
    await page.waitForURL('**/users');

    // 3. Ya en la página, esperar y cambiar a la pestaña de solicitudes pendientes
    const pendingTab = page.locator('text=/Solicitudes Pendientes|Pending Requests/i');
    await expect(pendingTab).toBeVisible();
    await pendingTab.click();

    // Verify pending user appears in table
    await expect(page.locator('td', { hasText: 'nuevoempleado' })).toBeVisible();

    // Click Approve button
    await page.click('button:has-text("Aprobar"), button:has-text("Approve")');
  });
});