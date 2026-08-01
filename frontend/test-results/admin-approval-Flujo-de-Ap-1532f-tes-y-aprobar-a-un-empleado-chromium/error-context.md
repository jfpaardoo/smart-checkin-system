# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-approval.spec.js >> Flujo de Aprobación por Administrador (Admin Approval E2E) >> Debe permitir al Administrador ver la pestaña de solicitudes pendientes y aprobar a un empleado
- Location: frontend\e2e\admin-approval.spec.js:5:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=/Solicitudes Pendientes|Pending Requests/i')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=/Solicitudes Pendientes|Pending Requests/i')

```

```yaml
- navigation:
  - link "BA Glass Distribution Academy":
    - /url: /
    - img "BA Glass"
    - text: Distribution Academy
  - list:
    - listitem:
      - link "Administration":
        - /url: "#"
        - img
        - text: Administration
  - list:
    - listitem:
      - link "admin":
        - /url: "#"
        - img
        - text: admin
    - listitem:
      - link "🇬🇧 EN":
        - /url: "#"
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test.describe('Flujo de Aprobación por Administrador (Admin Approval E2E)', () => {
  4  | 
  5  |   test('Debe permitir al Administrador ver la pestaña de solicitudes pendientes y aprobar a un empleado', async ({ page }) => {
  6  |     
  7  |     // Mock /users/me porque el layout verifica al usuario actual para mantener la sesión
  8  |     await page.route('/api/v1/users/me', async (route) => {
  9  |       await route.fulfill({
  10 |         status: 200,
  11 |         contentType: 'application/json',
  12 |         body: JSON.stringify({ 
  13 |           id: 1, 
  14 |           username: 'admin', 
  15 |           authority: { authority: 'ADMIN' } 
  16 |         }),
  17 |       });
  18 |     });
  19 | 
  20 |     // Mock user list and pending user list APIs
  21 |     await page.route('/api/v1/users?*', async (route) => {
  22 |       await route.fulfill({
  23 |         status: 200,
  24 |         contentType: 'application/json',
  25 |         body: JSON.stringify([
  26 |           { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User', personalCode: '0000', isWorking: false, isApproved: true, authority: { authority: 'ADMIN' } }
  27 |         ]),
  28 |       });
  29 |     });
  30 | 
  31 |     await page.route('/api/v1/users', async (route) => {
  32 |       await route.fulfill({
  33 |         status: 200,
  34 |         contentType: 'application/json',
  35 |         body: JSON.stringify([
  36 |           { id: 1, username: 'admin', firstName: 'Admin', lastName: 'User', personalCode: '0000', isWorking: false, isApproved: true, authority: { authority: 'ADMIN' } }
  37 |         ]),
  38 |       });
  39 |     });
  40 | 
  41 |     await page.route('/api/v1/users/pending', async (route) => {
  42 |       await route.fulfill({
  43 |         status: 200,
  44 |         contentType: 'application/json',
  45 |         body: JSON.stringify([
  46 |           { id: 2, username: 'nuevoempleado', firstName: 'Juan', lastName: 'Pérez', personalCode: '1234', isWorking: false, isApproved: false, authority: { authority: 'EMPLOYEE' } }
  47 |         ]),
  48 |       });
  49 |     });
  50 | 
  51 |     await page.route('/api/v1/users/2/approve', async (route) => {
  52 |       await route.fulfill({
  53 |         status: 200,
  54 |         contentType: 'application/json',
  55 |         body: JSON.stringify({ message: 'User approved successfully' }),
  56 |       });
  57 |     });
  58 | 
  59 |     // Mock Admin token in localStorage (JWT con rol ADMIN y fecha de expiración en el año 9999)
  60 |     const validAdminJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImF1dGhvcml0aWVzIjpbIkFETUlOIl0sImV4cCI6MjUzNDAyMzAwNzk5fQ.mock";
  61 |     await page.addInitScript((token) => {
  62 |       window.localStorage.setItem('jwt', JSON.stringify(token));
  63 |     }, validAdminJwt);
  64 | 
  65 |     // 1. Ir a la raíz de la aplicación
  66 |     await page.goto('/');
  67 | 
  68 |     // 2. Navegar orgánicamente interactuando con el Navbar del Administrador
  69 |     await page.click('a:has-text("Administration"), a:has-text("Administración")'); 
  70 |     
  71 |     // Esperar a que la opción del menú desplegable esté visible y hacer clic
  72 |     const usersLink = page.locator('text=/Usuarios|Users/i').first();
  73 |     await expect(usersLink).toBeVisible();
  74 |     await usersLink.click();
  75 | 
  76 |     // Confirmar que el router de React ha cambiado la URL a /users
  77 |     await page.waitForURL('**/users');
  78 | 
  79 |     // 3. Ya en la página, esperar y cambiar a la pestaña de solicitudes pendientes
  80 |     const pendingTab = page.locator('text=/Solicitudes Pendientes|Pending Requests/i');
> 81 |     await expect(pendingTab).toBeVisible();
     |                              ^ Error: expect(locator).toBeVisible() failed
  82 |     await pendingTab.click();
  83 | 
  84 |     // Verify pending user appears in table
  85 |     await expect(page.locator('td', { hasText: 'nuevoempleado' })).toBeVisible();
  86 | 
  87 |     // Click Approve button
  88 |     await page.click('button:has-text("Aprobar"), button:has-text("Approve")');
  89 |   });
  90 | });
```