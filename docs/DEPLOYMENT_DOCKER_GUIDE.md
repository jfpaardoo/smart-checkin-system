# Guía de Despliegue en Servidor con Docker

Esta guía describe el procedimiento para desplegar el sistema **Distribution Academy (Smart Check-in System)** en servidores Linux (Ubuntu/Debian, AWS EC2, GCP Compute Engine, DigitalOcean, etc.) utilizando Docker y Docker Compose.

---

## Requisitos Previos del Servidor

- **Docker Engine** (v20.10 o superior)
- **Docker Compose** (v2.0 o superior)
- Acceso con privilegios de superusuario (`sudo`)
- Puertos abiertos en el cortafuegos (firewall): `80`, `443`, `8080` (según configuración)

---

## Procedimiento de Despliegue

### 1. Clonar el repositorio en el servidor
```bash
git clone https://github.com/jfpaardoo/smart-checkin-system.git
cd smart-checkin-system
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editar las credenciales de producción
nano .env
```

### 3. Levantar la aplicación con Docker Compose
```bash
docker-compose up -d --build
```

### 4. Verificar el estado de los contenedores
```bash
docker-compose ps
```

---

## Comandos de Operación y Mantenimiento

- **Inspección de registros (logs) en tiempo real:**
  ```bash
  docker-compose logs -f app
  ```

- **Detención de los servicios:**
  ```bash
  docker-compose down
  ```

- **Reinicio del servicio backend:**
  ```bash
  docker-compose restart app
  ```

- **Actualización a la última versión del código:**
  ```bash
  git pull origin main
  docker-compose up -d --build
  ```

---

## Acceso y Verificación

Una vez inicializados los contenedores, los servicios estarán disponibles en:
- **Interfaz Web Principal:** `http://<ip-o-dominio-servidor>:8080`
- **Consola Swagger UI (Rol ADMIN):** `http://<ip-o-dominio-servidor>:8080/swagger-ui/index.html`
- **Comprobación de Salud (Actuator Health):** `http://<ip-o-dominio-servidor>:8080/actuator/health`
