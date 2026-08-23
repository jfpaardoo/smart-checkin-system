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

    // 2. Hacer clic en el enlace de "¿Has olvidado tu contraseña?" (soporta i18n español e inglés)
    const forgotPasswordLink = page.getByRole('link', { name: /olvidado tu contraseña|forgot your password/i });
    await expect(forgotPasswordLink).toBeVisible({ timeout: 10000 });
    await forgotPasswordLink.click();

    // 3. Confirmar que hemos navegado a la pantalla correcta
    await page.waitForURL('**/forgot-password');
    await expect(page.getByRole('heading', { name: /recuperar contraseña|recover password|reset password/i })).toBeVisible();

    // 4. Rellenar el formulario
    await page.locator('input#email').fill('empleado@example.com');

    // 5. Esperar a que el captcha de Turnstile habilite el botón y enviar
    const sendButton = page.getByRole('button', { name: /enviar enlace|send link|enviar|send/i });
    await expect(sendButton).toBeEnabled({ timeout: 15000 });
    await sendButton.click();

    // 6. Verificar el mensaje de éxito del servidor
    await expect(page.getByText(/recibirás un enlace|recovery link|success|correo/i)).toBeVisible();
  });

  test('Debe mostrar pantalla de error si se accede a reset-password sin token', async ({ page }) => {
    // 1. Navegar directamente sin query params
    await page.goto('/reset-password');

    // 2. Verificar que se bloquea el acceso y se muestra el error (i18n resiliente)
    await expect(page.getByRole('heading', { name: /enlace inválido|invalid link|error/i })).toBeVisible();
    await expect(page.getByText(/no se encontró ningún token|no password recovery token/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /volver al inicio|back to home|back to login|volver/i })).toBeVisible();
  });

  test('Debe mostrar error si las nuevas contraseñas no coinciden', async ({ page }) => {
    // 1. Navegar con un token simulado
    await page.goto('/reset-password?token=mocked-valid-token-123');

    // 2. Comprobar encabezado real
    await expect(page.getByRole('heading', { name: /restablecer contraseña|reset password|cambiar contraseña/i })).toBeVisible();

    // 3. Rellenar con contraseñas distintas y asegurar que el estado de React se aplicó
    const newPassInput = page.locator('input#newPassword');
    await expect(newPassInput).toBeVisible({ timeout: 10000 });
    await newPassInput.fill('SecurePass123!');
    await expect(newPassInput).toHaveValue('SecurePass123!');

    const confirmPassInput = page.locator('input#confirmPassword');
    await expect(confirmPassInput).toBeVisible({ timeout: 10000 });
    await confirmPassInput.fill('DifferentPass456!');
    await expect(confirmPassInput).toHaveValue('DifferentPass456!');

    // 4. Enviar
    const changeBtn = page.locator('button[type="submit"]');
    await expect(changeBtn).toBeVisible({ timeout: 10000 });
    await changeBtn.click();

    // 5. Verificar error de validación en el frontend sin llamar a la API
    await expect(page.locator('[class*="border-red"] p')).toBeVisible({ timeout: 10000 });
  });

  test('Debe permitir restablecer la contraseña con un token válido y redirigir al login', async ({ page }) => {
    // Interceptar la API de cambio de contraseña
    await page.route('**/api/v1/auth/reset-password', async (route) => {
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

    // 2. Rellenar contraseñas válidas e idénticas y asegurar estado
    const newPassInput = page.locator('input#newPassword');
    await expect(newPassInput).toBeVisible({ timeout: 10000 });
    await newPassInput.fill('SecurePass123!');
    await expect(newPassInput).toHaveValue('SecurePass123!');

    const confirmPassInput = page.locator('input#confirmPassword');
    await expect(confirmPassInput).toBeVisible({ timeout: 10000 });
    await confirmPassInput.fill('SecurePass123!');
    await expect(confirmPassInput).toHaveValue('SecurePass123!');

    // 3. Enviar formulario
    const changeBtn = page.locator('button[type="submit"]');
    await expect(changeBtn).toBeVisible({ timeout: 10000 });
    await changeBtn.click();

    // 4. Verificar mensaje de éxito
    await expect(page.locator('[class*="border-emerald"] p')).toBeVisible({ timeout: 10000 });

    // 5. Esperar a que el setTimeout(3000) nos redirija automáticamente al login
    await page.waitForURL('**/login', { timeout: 6000 });
  });

});