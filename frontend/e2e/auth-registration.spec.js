/* eslint-disable testing-library/prefer-screen-queries */
const { test, expect } = require('@playwright/test');

test.describe('Flujo de Autorregistro de Usuario (User Self-Registration E2E)', () => {

  test('Debe permitir a un nuevo empleado llenar y enviar su formulario de registro', async ({ page }) => {
    // Intercept API signup call to mock successful response
    await page.route('**/api/v1/auth/signup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'User registered successfully!' }),
      });
    });

    await page.goto('/register');

    // Verify Title (bilingual support)
    await expect(page.getByRole('heading', { name: /Solicitud de Registro|Registration Request/i })).toBeVisible();

    // Fill form fields
    await page.fill('input#firstName', 'Carlos');
    await page.fill('input#lastName', 'Gómez');
    await page.fill('input#username', 'cgomez');
    await page.fill('input#personalCode', '8899');
    await page.fill('input#password', 'securePass123');
    await page.fill('input#confirmPassword', 'securePass123');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify Success Screen
    await expect(page.getByRole('heading', { name: /¡Solicitud Enviada!|Request Sent!|Request Submitted!/i })).toBeVisible();
  });

  test('Debe validar que las contraseñas coincidan', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input#firstName', 'Carlos');
    await page.fill('input#lastName', 'Gómez');
    await page.fill('input#username', 'cgomez');
    await page.fill('input#personalCode', '8899');
    await page.fill('input#password', 'securePass123');
    await page.fill('input#confirmPassword', 'differentPass');

    await page.click('button[type="submit"]');

    // Confirm that submission did not navigate away
    await expect(page.getByRole('heading', { name: /Solicitud de Registro|Registration Request/i })).toBeVisible();
  });
});