/* eslint-disable testing-library/prefer-screen-queries */
const { test, expect } = require('@playwright/test');

test.describe('Flujo de Activación de 2FA y Verificación TOTP (2FA Setup E2E)', () => {

  test('Debe permitir al usuario iniciar la configuración de 2FA, ver el QR y confirmar el código de 6 dígitos', async ({ page }) => {

    // Interceptar validación de token JWT — el endpoint real devuelve un booleano crudo
    await page.route('**/api/v1/auth/validate**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(true),
      });
    });

    // Interceptar API del perfil de usuario
    await page.route('**/api/v1/users/me', async (route) => {
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

    await page.route('**/api/v1/users/me/formations', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    // Interceptar API de configuración 2FA
    await page.route('**/api/v1/users/2fa/setup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          secret: 'JBSWY3DPEHPK3PXP',
          qrUri: 'otpauth://totp/SmartCheckIn:juanperez?secret=JBSWY3DPEHPK3PXP&issuer=SmartCheckIn'
        }),
      });
    });

    // Interceptar API de activación 2FA
    await page.route('**/api/v1/users/2fa/enable', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: '2FA enabled successfully' }),
      });
    });

    // Inyectar JWT en localStorage
    const validEmployeeJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqdWFucGVyZXoiLCJhdXRob3JpdGllcyI6WyJFTVBMT1lFRSJdLCJleHAiOjI1MzQwMjMwMDc5OX0.mock";
    await page.addInitScript((token) => {
      window.localStorage.setItem('jwt', JSON.stringify(token));
    }, validEmployeeJwt);

    // 1. Cargar aplicación en la raíz
    await page.goto('/');

    // 2. Navegar desplegando el menú de usuario en la barra superior
    const userMenu = page.getByRole('button', { name: /juanperez/i }).or(page.getByRole('link', { name: /juanperez/i }));
    await expect(userMenu).toBeVisible();
    await userMenu.click();

    // Click en la opción Perfil del menú desplegable
    const profileLink = page.getByRole('menuitem', { name: /perfil|profile/i }).or(page.getByRole('link', { name: /perfil|profile/i }));
    await expect(profileLink).toBeVisible();
    await profileLink.click();

    // Confirmar cambio de URL
    await page.waitForURL('**/profile');

    // 3. Hacer clic en la pestaña "Seguridad y Contraseña"
    const securityTab = page.getByRole('tab', { name: /seguridad|security/i }).or(page.getByText(/seguridad y contraseña|security/i));
    await expect(securityTab).toBeVisible({ timeout: 15000 });
    await securityTab.click();

    // 4. Iniciar la configuración de 2FA
    const setup2faBtn = page.getByRole('button', { name: /configurar 2fa|setup 2fa/i });
    await expect(setup2faBtn).toBeVisible();
    await setup2faBtn.click();

    // 5. Verificar que el secreto del QR se muestra en pantalla
    await expect(page.getByText('JBSWY3DPEHPK3PXP')).toBeVisible();

    // 6. Introducir el código TOTP de 6 dígitos
    await page.locator('input#verificationCode').fill('123456');

    // 7. Confirmar y activar
    const confirmBtn = page.getByRole('button', { name: /confirmar y activar|confirm & enable/i });
    await confirmBtn.click();

    // 8. Validar el mensaje de éxito
    await expect(page.getByText(/activado|enabled/i).first()).toBeVisible();
  });
});