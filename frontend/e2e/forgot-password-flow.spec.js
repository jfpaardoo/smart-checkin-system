/* eslint-disable testing-library/prefer-screen-queries */
const { test, expect } = require('@playwright/test');

test.describe('Flujo de Recuperación de Contraseña (Forgot Password E2E)', () => {

  test('Debe permitir al usuario navegar desde el login y solicitar un enlace de recuperación', async ({ page }) => {
    // Interceptar la API de solicitud de contraseña
    await page.route('**/api/v1/auth/forgot-password', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Si el correo está registrado, recibirás un enlace de recuperación.' }),
      });
    });

    // 1. Cargar la página de login
    await page.goto('/login');

    // 2. Hacer clic en el enlace de "¿Has olvidado tu contraseña?"
    const forgotPasswordLink = page.getByRole('link', { name: /olvidado tu contraseña/i });
    await expect(forgotPasswordLink).toBeVisible();
    await forgotPasswordLink.click();

    // 3. Confirmar que hemos navegado a la pantalla correcta
    await page.waitForURL('**/forgot-password');
    await expect(page.getByRole('heading', { name: /Recuperar Contraseña/i })).toBeVisible();

    // 4. Rellenar el formulario
    await page.locator('input#email').fill('empleado@example.com');

    // 5. Esperar a que el captcha de Turnstile habilite el botón y enviar
    const sendButton = page.getByRole('button', { name: /Enviar enlace/i });
    await expect(sendButton).toBeEnabled({ timeout: 15000 });
    await sendButton.click();

    // 6. Verificar el mensaje de éxito del servidor
    await expect(page.getByText(/recibirás un enlace de recuperación/i)).toBeVisible();
  });

  test('Debe mostrar pantalla de error si se accede a reset-password sin token', async ({ page }) => {
    // 1. Navegar directamente sin query params
    await page.goto('/reset-password');

    // 2. Verificar que se bloquea el acceso y se muestra el error
    await expect(page.getByRole('heading', { name: /Enlace inválido/i })).toBeVisible();
    await expect(page.getByText(/No se encontró ningún token/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Volver al inicio/i })).toBeVisible();
  });

  test('Debe mostrar error si las nuevas contraseñas no coinciden', async ({ page }) => {
    // 1. Navegar con un token simulado
    await page.goto('/reset-password?token=mocked-valid-token-123');

    // 2. Comprobar encabezado real
    await expect(page.getByRole('heading', { name: /Restablecer Contraseña|Reset Password/i })).toBeVisible();

    // 3. Rellenar con contraseñas distintas
    await page.locator('input#newPassword').fill('SecurePass123!');
    await page.locator('input#confirmPassword').fill('DifferentPass456!');

    // 4. Enviar
    await page.getByRole('button', { name: /Cambiar Contraseña/i }).click();

    // 5. Verificar error de validación en el frontend sin llamar a la API
    await expect(page.getByText(/Las contraseñas no coinciden/i)).toBeVisible();
  });

  test('Debe permitir restablecer la contraseña con un token válido y redirigir al login', async ({ page }) => {
    // Interceptar la API de cambio de contraseña
    await page.route('**/api/v1/auth/reset-password', async (route) => {
      // Verificar que el payload lleva los datos correctos
      const requestData = JSON.parse(route.request().postData());
      expect(requestData.token).toBe('mocked-valid-token-123');
      expect(requestData.newPassword).toBe('SecurePass123!');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Contraseña restablecida con éxito. Ya puedes iniciar sesión con tu nueva contraseña.' }),
      });
    });

    // 1. Navegar con un token simulado
    await page.goto('/reset-password?token=mocked-valid-token-123');

    // 2. Rellenar contraseñas válidas e idénticas
    await page.locator('input#newPassword').fill('SecurePass123!');
    await page.locator('input#confirmPassword').fill('SecurePass123!');

    // 3. Enviar formulario
    await page.getByRole('button', { name: /Cambiar Contraseña/i }).click();

    // 4. Verificar mensaje de éxito
    await expect(page.getByText(/Contraseña restablecida con éxito/i)).toBeVisible();

    // 5. Esperar a que el setTimeout(3000) nos redirija automáticamente al login
    await page.waitForURL('**/login', { timeout: 5000 });
  });

});