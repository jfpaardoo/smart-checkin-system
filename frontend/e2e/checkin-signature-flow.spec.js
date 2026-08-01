const { test, expect } = require('@playwright/test');

test.describe('Flujo de Fichaje Manual y Firma Digital en Salida (Check-in & Signature E2E)', () => {

  test('Debe permitir fichar mediante código TOTP de 6 dígitos y requerir firma digital para la salida', async ({ page }) => {
    // Mock Checkin API - Return 202 Needs Signature for Checkout
    await page.route('/api/v1/checkins/qr-fichaje', async (route) => {
      const requestData = JSON.parse(route.request().postData());

      if (requestData.signature) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            formationName: 'Curso de Seguridad Industrial',
            checkin: { type: 'SALIDA' }
          }),
        });
      } else {
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: JSON.stringify({ needsSignature: true }),
        });
      }
    });

    // Mock token in localStorage (valid base64 JWT payload with EMPLOYEE role)
    const validEmployeeJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyIiwiYXV0aG9yaXRpZXMiOlsiRU1QTE9ZRUUiXX0.mock";
    await page.addInitScript((token) => {
      window.localStorage.setItem('jwt', JSON.stringify(token));
    }, validEmployeeJwt);

    await page.goto('/checkin');

    // Switch to manual input mode
    await page.click('button:has-text("Introducir código manualmente"), button:has-text("Enter code manually")');

    // Fill 6-digit code
    await page.fill('input#manualCodeInput', '654321');

    // Click Confirmar Fichaje
    await page.click('button:has-text("Confirmar Fichaje"), button:has-text("Confirm Check-in")');

    // Verify digital signature canvas is required
    await expect(page.locator('text=/Firma Requerida|Signature Required/i')).toBeVisible();

    // Draw signature on canvas
    const canvas = page.locator('canvas.sigCanvas');
    const boundingBox = await canvas.boundingBox();
    if (boundingBox) {
      await page.mouse.move(boundingBox.x + 20, boundingBox.y + 20);
      await page.mouse.down();
      await page.mouse.move(boundingBox.x + 100, boundingBox.y + 80);
      await page.mouse.up();
    }

    // Submit signature
    await page.click('button:has-text("Confirmar Firma"), button:has-text("Confirm Signature")');

    // Verify success modal
    await expect(page.locator('text=/Confirmada|Confirmed/i')).toBeVisible();
    await expect(page.locator('text=Curso de Seguridad Industrial')).toBeVisible();
  });
});
