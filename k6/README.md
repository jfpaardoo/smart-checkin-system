# Pruebas de Carga y Rendimiento con k6 (Smart Check-in)

Esta carpeta contiene los scripts de prueba de carga, concurrencia y límites de velocidad (*rate limiting*) diseñados para validar el rendimiento y resiliencia del backend de **Distribution Academy / Smart Check-in**.

---

## 📋 Escenarios Disponibles

| Script | Propósito | Carga / Concurrencia | Métricas Objetivo |
| :--- | :--- | :--- | :--- |
| **`checkins-load-test.js`** | Simula la llegada en hora punta de empleados fichando. | Rampa gradual hasta 50 VUs concurrentes. | `p95 < 200ms`, `errores < 1%` |
| **`ratelimit-stress-test.js`** | Verifica la activación del filtro Rate Limiter ante ráfagas agresivas. | Ráfaga de 100 req/s desde la misma IP. | Respuesta `429 Too Many Requests` |

---

## 🚀 Cómo Ejecutar las Pruebas

### 1. Instalación de k6 (si no está instalado)

* **Windows (Winget)**:
  ```powershell
  winget install grafana.k6
  ```
* **Windows (Chocolatey)**:
  ```powershell
  choco install k6
  ```
* **Docker** (sin instalar binario):
  ```bash
  docker run --rm -i -e BASE_URL=http://host.docker.internal:8080 grafana/k6 run - < k6/checkins-load-test.js
  ```

---

### 2. Ejecución Local contra el Backend

Asegúrate de que la aplicación Spring Boot esté corriendo en el puerto 8080 (`http://localhost:8080`):

```powershell
# 1. Ejecutar test de carga nominal
k6 run k6/checkins-load-test.js

# 2. Ejecutar test de rate limiting y estrés
k6 run k6/ratelimit-stress-test.js

# 3. Especificar una URL o servidor diferente
k6 run -e BASE_URL=http://localhost:8080 k6/checkins-load-test.js
```

---

## 📊 Ejemplo de Resultados de Salida

```text
     ✓ system is UP
     ✓ get status is 200 or 401

     checks.........................: 100.00% ✓ 1520      ✗ 0   
     http_req_duration..............: avg=18.42ms  min=4.12ms med=14.30ms max=112.50ms p(95)=38.20ms p(99)=64.10ms
     http_req_failed................: 0.00%   ✓ 0         ✗ 1520
     http_reqs......................: 1520    50.66/s
     vus............................: 50      min=1       max=50
```
