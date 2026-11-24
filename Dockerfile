# ==============================================================================
# Multi-stage Dockerfile for Distribution Academy (Smart Checkin System)
# Stage 1: Build React (Vite) frontend with Node.js 22
# Stage 2: Build Java backend with Maven & Eclipse Temurin 21
# Stage 3: Production runtime image with Eclipse Temurin OpenJDK 21 JRE
# ==============================================================================

# STAGE 1: Build Frontend
FROM node:26-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend ./
RUN npm run build

# STAGE 2: Build Backend & Package Application
FROM maven:3.9.9-eclipse-temurin-21 AS builder

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline -B || true

COPY src ./src
COPY --from=frontend-builder /app/frontend/build ./frontend/build

RUN mvn package -DskipTests -Dfrontend.skip=true

# STAGE 3: Production Runtime
FROM eclipse-temurin:21-jre-alpine AS runner

# Upgrade OS packages and create non-root user for security compliance
RUN apk update && apk upgrade --no-cache && \
    addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy built JAR artifact from builder stage
COPY --from=builder /app/target/smartcheckin-*.jar app.jar

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

# Expose HTTP port
EXPOSE 8080

# Environment variables with sensible defaults (optimized for low-RAM / 512MB hosting)
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-Xms128m -Xmx320m -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError"

# Healthcheck to monitor app status
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar app.jar"]
