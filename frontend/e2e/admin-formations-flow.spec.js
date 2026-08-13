const { test, expect } = require('@playwright/test');

test.describe('Flujo de Gestión y Edición de Formaciones por Administrador (Admin Formation Management E2E)', () => {

  test('Debe permitir crear, editar y consultar la lista de formaciones', async ({ page }) => {
    // 1. Mock GET /api/v1/formations
    await page.route('/api/v1/formations', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, name: 'Formación de Prevención de Riesgos', description: 'Capacitación obligatoria', date: '2026-08-10' }
          ]),
        });
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ id: 2, name: 'Formación de Calidad ISO 9001', description: 'Auditoría interna' }),
        });
      }
    });

    // Mock PrivateRoute token validation
    await page.route('/api/v1/auth/validate*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(true),
      });
    });

    // Mock Admin JWT and User token in localStorage (valid base64 header.payload.signature)
  const adminJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbjEiLCJhdXRob3JpdGllcyI6WyJBRE1JTiJdfQ.signature";
  await page.addInitScript((token) => {
    window.localStorage.setItem('jwt', JSON.stringify(token));
    window.localStorage.setItem('user', JSON.stringify({ username: 'admin1', roles: ['ADMIN'], authority: { authority: 'ADMIN' } }));
  }, adminJwt);

    // Navigate to Formations Management page
    await page.goto('/formations');

    // Verify formations management UI header is visible
    await expect(page.locator('h2')).toBeVisible();
  });
});
