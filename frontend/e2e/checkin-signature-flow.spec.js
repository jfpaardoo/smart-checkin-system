const { test, expect } = require('@playwright/test');

test.describe('Flujo de Fichaje Manual y Firma Digital en Salida (Check-in & Signature E2E)', () => {

  test('Debe permitir fichar mediante código TOTP de 6 dígitos y requerir firma digital para la salida', async ({ page }) => {
    // Mock Checkin API - Return 202 Needs Signature for Checkout
    await page.route('**/api/v1/checkins/qr-fichaje**', async (route) => {
      let requestData = {};
      try {
        const postData = route.request().postData();
        if (postData) requestData = JSON.parse(postData);
      } catch (err) {
        console.error('Failed to parse postData in test mock:', err);
      }

      if (requestData && requestData.signature) {
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

    // Mock PrivateRoute token validation
    await page.route('**/api/v1/auth/validate**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(true),
      });
    });

    // Inject window.__PLAYWRIGHT__ = true BEFORE page load so GPS and Turnstile bypass
    // is guaranteed regardless of navigator.webdriver value in new headless Chrome.
    // Also seed localStorage with a valid mock JWT and user.
    const validEmployeeJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyIiwiYXV0aG9yaXRpZXMiOlsiRU1QTE9ZRUUiXX0.mock";
    await page.addInitScript((token) => {
      window.__PLAYWRIGHT__ = true;
      window.localStorage.setItem('jwt', JSON.stringify(token));
      window.localStorage.setItem('user', JSON.stringify({
        username: 'user',
        roles: ['EMPLOYEE'],
        authority: { authority: 'EMPLOYEE' }
      }));
    }, validEmployeeJwt);

    await page.goto('/checkin');

    // Switch to manual input mode
    await page.click('button:has-text("Ingresar código manualmente"), button:has-text("Enter code manually")');

    // Fill 6-digit code
    await page.fill('input[placeholder="000000"]', '654321');

    // Click Validar Código
    const submitBtn = page.locator('button:has-text("Validar Código"), button:has-text("Validate Code")');
    await expect(submitBtn).toBeEnabled({ timeout: 5000 });
    await submitBtn.click();

    // Verify digital signature canvas is shown (SignatureStep renders after needsSignature=true)
    await expect(
      page.locator('text=/Por favor, firme abajo para finalizar|Signature Required|Please sign below to finish/i')
    ).toBeVisible({ timeout: 15000 });

    // Draw signature on canvas
    const canvas = page.locator('canvas.sigCanvas');
    await canvas.scrollIntoViewIfNeeded();
    const boundingBox = await canvas.boundingBox();
    if (boundingBox) {
      await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(
        boundingBox.x + boundingBox.width / 2 + 50,
        boundingBox.y + boundingBox.height / 2 + 50,
        { steps: 20 }
      );
      await page.mouse.up();
    }

    // Submit signature
    await page.click('button:has-text("Confirmar Firma y Registrar Salida"), button:has-text("Confirmar Firma"), button:has-text("Confirm Signature")');

    // Verify success modal
    await expect(page.locator('text=Curso de Seguridad Industrial')).toBeVisible();
  });
});
