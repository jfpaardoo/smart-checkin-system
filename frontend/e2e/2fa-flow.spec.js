const { test, expect } = require('@playwright/test');

test.describe('Flujo de Activación de 2FA y Verificación TOTP (2FA Setup E2E)', () => {

  test('Debe permitir al usuario iniciar la configuración de 2FA, ver el QR y confirmar el código de 6 dígitos', async ({ page }) => {
    // Mock user profile API
    await page.route('/api/v1/users/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          username: 'juanperez',
          firstName: 'Juan',
          lastName: 'Pérez',
          personalCode: '1234',
          twoFactorEnabled: false,
          isWorking: false,
          authority: { authority: 'EMPLOYEE' }
        }),
      });
    });

    await page.route('/api/v1/users/me/formations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    // Mock 2FA setup API
    await page.route('/api/v1/users/2fa/setup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          secret: 'JBSWY3DPEHPK3PXP',
          qrUri: 'otpauth://totp/SmartCheckIn:juanperez?secret=JBSWY3DPEHPK3PXP&issuer=SmartCheckIn'
        }),
      });
    });

    // Mock 2FA enable API
    await page.route('/api/v1/users/2fa/enable', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '2FA enabled successfully' }),
      });
    });

    // Mock token in localStorage (JWT con rol EMPLOYEE y fecha de expiración en el año 9999)
    const validEmployeeJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyIiwiYXV0aG9yaXRpZXMiOlsiRU1QTE9ZRUUiXSwiZXhwIjoyNTM0MDIzMDA3OTl9.mock";
    await page.addInitScript((token) => {
      window.localStorage.setItem('jwt', JSON.stringify(token));
    }, validEmployeeJwt);

    // 1. Ir a la raíz para cargar el estado de React correctamente
    await page.goto('/');

    // 2. Navegar orgánicamente a través del Navbar
    await page.click('a:has-text("user")'); 
    
    // Esperar a que la opción del menú desplegable esté visible y hacer clic
    const profileLink = page.locator('text=/Perfil|Profile/i').first();
    await expect(profileLink).toBeVisible();
    await profileLink.click();

    // Confirmar que el router de React ha cambiado la URL a /profile
    await page.waitForURL('**/profile');

    // 3. Esperar la pestaña de seguridad y hacer clic
    const securityTab = page.locator('text=/Seguridad|Security/i');
    await expect(securityTab).toBeVisible();
    await securityTab.click();

    // Click Configurar 2FA button
    await page.click('button:has-text("Configurar 2FA"), button:has-text("Setup 2FA")');

    // Verify QR secret is displayed
    await expect(page.locator('text=JBSWY3DPEHPK3PXP')).toBeVisible();

    // Enter 6-digit TOTP verification code
    await page.fill('input#verificationCode', '123456');

    // Click Confirmar y Activar
    await page.click('button:has-text("Confirmar y Activar"), button:has-text("Confirm & Enable")');

    // Verify 2FA status active
    await expect(page.locator('text=/activado|enabled/i')).toBeVisible();
  });
});