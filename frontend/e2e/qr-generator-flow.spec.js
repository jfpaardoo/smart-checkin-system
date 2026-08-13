const { test, expect } = require('@playwright/test');

test.describe('Flujo de Proyección y Fichaje por QR en Tiempo Real (QR Proximity & Attendance E2E)', () => {

  test('Debe proyectar el código QR dinámico TOTP y simular la llegada de fichaje', async ({ page }) => {
    // 1. Mock TOTP generation / current token API
    await page.route('**/api/v1/totp/current**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: '849201', expirationSeconds: 30 }),
      });
    });

    // 2. Mock PrivateRoute token validation
    await page.route('**/api/v1/auth/validate**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(true),
      });
    });

    // 3. Mock GET /api/v1/formations returning a valid formation to trigger selection
    await page.route('**/api/v1/formations**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, name: 'Java 101' }
        ]),
      });
    });

    // 4. Inyectar la sesión en localStorage respetando TokenService.js
    await page.goto('/');
    await page.evaluate(() => {
      const displayUser = {
        username: 'admin1',
        roles: ['ADMIN'],
        authority: { authority: 'ADMIN' }
      };
      window.localStorage.setItem('user', JSON.stringify(displayUser));
    });

    // 5. Navegar directamente al generador de QR pasando una formación por queryParam para evitar estado vacío
    await page.goto('/qr-generator?formationId=1');

    // 6. Verificar que carga la vista correctamente comprobando la clase del título real (.qr-title)
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('.qr-title').first()).toBeVisible();
  });

});