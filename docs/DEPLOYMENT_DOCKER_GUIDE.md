# 🚀 Guía de Despliegue en Servidor con Docker

Esta guía explica cómo desplegar el proyecto **BA Distribution Academy (Smart Checkin System)** en cualquier servidor Linux (Ubuntu/Debian, AWS EC2, GCP Compute Engine, DigitalOcean, etc.) en menos de 1 minuto usando Docker y Docker Compose.

---

## 📋 Requisitos Previos en el Servidor
- **Docker Engine** (v20.10 o superior)
- **Docker Compose** (v2.0 o superior)

---

## 🛠️ Pasos de Despliegue en 1 Minuto

### 1. Clonar el repositorio en el servidor
```bash
git clone https://github.com/jfpaardoo/smart-checkin-system.git
cd smart-checkin-system
```

### 2. Levantar la aplicación con Docker Compose
```bash
docker-compose up -d --build
```

### 3. Verificar el estado de los contenedores
```bash
docker-compose ps
```

---

## 🔍 Comandos de Gestión Útiles

- **Ver logs en tiempo real**:
  ```bash
  docker-compose logs -f app
  ```

- **Detener el servidor**:
  ```bash
  docker-compose down
  ```

- **Reiniciar el servidor**:
  ```bash
  docker-compose restart app
  ```

---

## 🌐 Acceso
Una vez iniciado, la aplicación estará disponible en:
- **Web principal**: `http://tu-ip-servidor:8080`
- **Swagger API Docs**: `http://tu-ip-servidor:8080/docs`
