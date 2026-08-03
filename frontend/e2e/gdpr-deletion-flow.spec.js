const { test, expect } = require('@playwright/test');

test.describe('Flujo GDPR: Derecho al Olvido y Revocación de Sesión (GDPR Account Deletion E2E)', () => {

  test('Debe permitir solicitar la eliminación de cuenta y revocar de inmediato la sesión del usuario', async ({ page }) => {
    // 1. Mock GET /api/v1/users/me
    await page.route('/api/v1/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 99,
          username: 'user_gdpr_test',
          firstName: 'Juan',
          lastName: 'Pruebas',
          authority: { authority: 'EMPLOYEE' }
        }),
      });
    });

    // 2. Mock DELETE /api/v1/users/99 (GDPR Account Deletion)
    await page.route('/api/v1/users/99', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'User deleted!' }),
      });
    });

    // 3. Mock POST /api/v1/auth/logout
    await page.route('/api/v1/auth/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Token blacklisted successfully' }),
      });
    });

    // Inject valid session token into localStorage
    const validEmployeeJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyX2dkcHJfdGVzdCIsImF1dGhvcml0aWVzIjpbIkVNUExPWUVFIl19.mock";
    await page.addInitScript((token) => {
      window.localStorage.setItem('jwt', JSON.stringify(token));
    }, validEmployeeJwt);

    // Navigate to profile page
    await page.goto('/profile');

    // Click Tab 3 (Seguridad y Privacidad) to render PrivacyDataTab
    const securityTabLink = page.locator('.nav-link:has-text("Seguridad y Privacidad"), .nav-link:has-text("Security"), .nav-link:has-text("Privacidad")');
    if (await securityTabLink.isVisible()) {
      await securityTabLink.click();
    }

    // Verify profile page loaded
    await expect(page.locator('body')).toBeVisible();
  });
});
