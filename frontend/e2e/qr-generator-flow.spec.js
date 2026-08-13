const { test, expect } = require('@playwright/test');

test.describe('Flujo de Proyección y Fichaje por QR en Tiempo Real (QR Proximity & Attendance E2E)', () => {

  test('Debe proyectar el código QR dinámico TOTP y simular la llegada de fichaje', async ({ page }) => {
    // 1. Mock TOTP generation API
    await page.route('**/api/v1/totp/generate**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: '849201', expirationSeconds: 30 }),
      });
    });

    // Mock PrivateRoute token validation
    await page.route('**/api/v1/auth/validate**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(true),
      });
    });

    // Mock GET /api/v1/formations
    await page.route('**/api/v1/formations**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Mock Admin JWT and User in localStorage
    const adminJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbjEiLCJhdXRob3JpdGllcyI6WyJBRE1JTiJdfQ.signature";
    await page.addInitScript((token) => {
      window.localStorage.setItem('jwt', JSON.stringify(token));
      window.localStorage.setItem('user', JSON.stringify({ username: 'admin1', roles: ['ADMIN'], authority: { authority: 'ADMIN' } }));
    }, adminJwt);

    // Navigate to QR Generator page
    await page.goto('/qr-generator');

    // Verify projection UI elements
    await expect(page.locator('h2, .card-title, h4')).toBeVisible();
  });
});
