# ==============================================================================
# Multi-stage Dockerfile for Distribution Academy (Smart Checkin System)
# Stage 1: Build Java backend + React frontend using Maven & Node.js
# Stage 2: Production runtime image with Eclipse Temurin OpenJDK 21 JRE
# ==============================================================================

# STAGE 1: Build Application
FROM maven:3.9.9-eclipse-temurin-21 AS builder

WORKDIR /app

# Copy pom.xml and download dependencies (layer caching)
COPY pom.xml .
COPY frontend/package*.json ./frontend/

# Download Maven dependencies in offline mode where possible
RUN mvn dependency:go-offline -B || true

# Copy source code and frontend
COPY src ./src
COPY frontend ./frontend

# Build full package (frontend npm build is triggered via frontend-maven-plugin if configured, or mvn package)
RUN mvn clean package -DskipTests

# STAGE 2: Production Runtime
FROM eclipse-temurin:21-jre-alpine AS runner

# Create non-root user for security compliance
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy built JAR artifact from stage 1
COPY --from=builder /app/target/ba-distribution-academy-*.jar app.jar

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

USER appuser

# Expose HTTP port
EXPOSE 8080

# Environment variables with sensible defaults
ENV SPRING_PROFILES_ACTIVE=prod \
    JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"

# Healthcheck to monitor app status
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
