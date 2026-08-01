# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 2fa-flow.spec.js >> Flujo de Activación de 2FA y Verificación TOTP (2FA Setup E2E) >> Debe permitir al usuario iniciar la configuración de 2FA, ver el QR y confirmar el código de 6 dígitos
- Location: frontend\e2e\2fa-flow.spec.js:5:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=/Seguridad|Security/i')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=/Seguridad|Security/i')

```

```yaml
- navigation:
  - link "BA Glass Distribution Academy":
    - /url: /
    - img "BA Glass"
    - text: Distribution Academy
  - list
  - list:
    - listitem:
      - link "user":
        - /url: "#"
        - img
        - text: user
    - listitem:
      - link "🇬🇧 EN":
        - /url: "#"
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test.describe('Flujo de Activación de 2FA y Verificación TOTP (2FA Setup E2E)', () => {
  4  | 
  5  |   test('Debe permitir al usuario iniciar la configuración de 2FA, ver el QR y confirmar el código de 6 dígitos', async ({ page }) => {
  6  |     // Mock user profile API
  7  |     await page.route('/api/v1/users/me', async (route) => {
  8  |       await route.fulfill({
  9  |         status: 200,
  10 |         contentType: 'application/json',
  11 |         body: JSON.stringify({
  12 |           id: 1,
  13 |           username: 'juanperez',
  14 |           firstName: 'Juan',
  15 |           lastName: 'Pérez',
  16 |           personalCode: '1234',
  17 |           twoFactorEnabled: false,
  18 |           isWorking: false,
  19 |           authority: { authority: 'EMPLOYEE' }
  20 |         }),
  21 |       });
  22 |     });
  23 | 
  24 |     await page.route('/api/v1/users/me/formations', async (route) => {
  25 |       await route.fulfill({
  26 |         status: 200,
  27 |         contentType: 'application/json',
  28 |         body: JSON.stringify([]),
  29 |       });
  30 |     });
  31 | 
  32 |     // Mock 2FA setup API
  33 |     await page.route('/api/v1/users/2fa/setup', async (route) => {
  34 |       await route.fulfill({
  35 |         status: 200,
  36 |         contentType: 'application/json',
  37 |         body: JSON.stringify({
  38 |           secret: 'JBSWY3DPEHPK3PXP',
  39 |           qrUri: 'otpauth://totp/SmartCheckIn:juanperez?secret=JBSWY3DPEHPK3PXP&issuer=SmartCheckIn'
  40 |         }),
  41 |       });
  42 |     });
  43 | 
  44 |     // Mock 2FA enable API
  45 |     await page.route('/api/v1/users/2fa/enable', async (route) => {
  46 |       await route.fulfill({
  47 |         status: 200,
  48 |         contentType: 'application/json',
  49 |         body: JSON.stringify({ message: '2FA enabled successfully' }),
  50 |       });
  51 |     });
  52 | 
  53 |     // Mock token in localStorage (JWT con rol EMPLOYEE y fecha de expiración en el año 9999)
  54 |     const validEmployeeJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyIiwiYXV0aG9yaXRpZXMiOlsiRU1QTE9ZRUUiXSwiZXhwIjoyNTM0MDIzMDA3OTl9.mock";
  55 |     await page.addInitScript((token) => {
  56 |       window.localStorage.setItem('jwt', JSON.stringify(token));
  57 |     }, validEmployeeJwt);
  58 | 
  59 |     // 1. Ir a la raíz para cargar el estado de React correctamente
  60 |     await page.goto('/');
  61 | 
  62 |     // 2. Navegar orgánicamente a través del Navbar
  63 |     await page.click('a:has-text("user")'); 
  64 |     
  65 |     // Esperar a que la opción del menú desplegable esté visible y hacer clic
  66 |     const profileLink = page.locator('text=/Perfil|Profile/i').first();
  67 |     await expect(profileLink).toBeVisible();
  68 |     await profileLink.click();
  69 | 
  70 |     // Confirmar que el router de React ha cambiado la URL a /profile
  71 |     await page.waitForURL('**/profile');
  72 | 
  73 |     // 3. Esperar la pestaña de seguridad y hacer clic
  74 |     const securityTab = page.locator('text=/Seguridad|Security/i');
> 75 |     await expect(securityTab).toBeVisible();
     |                               ^ Error: expect(locator).toBeVisible() failed
  76 |     await securityTab.click();
  77 | 
  78 |     // Click Configurar 2FA button
  79 |     await page.click('button:has-text("Configurar 2FA"), button:has-text("Setup 2FA")');
  80 | 
  81 |     // Verify QR secret is displayed
  82 |     await expect(page.locator('text=JBSWY3DPEHPK3PXP')).toBeVisible();
  83 | 
  84 |     // Enter 6-digit TOTP verification code
  85 |     await page.fill('input#verificationCode', '123456');
  86 | 
  87 |     // Click Confirmar y Activar
  88 |     await page.click('button:has-text("Confirmar y Activar"), button:has-text("Confirm & Enable")');
  89 | 
  90 |     // Verify 2FA status active
  91 |     await expect(page.locator('text=/activado|enabled/i')).toBeVisible();
  92 |   });
  93 | });
```