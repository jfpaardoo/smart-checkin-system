# Optimización de Consultas Analíticas: Vistas Materializadas en PostgreSQL

Este documento describe la arquitectura y script SQL para implementar una **Vista Materializada (Materialized View)** en PostgreSQL con refresco concurrente (`REFRESH MATERIALIZED VIEW CONCURRENTLY`) para despliegues empresariales de `smart-checkin-system` con alto volumen transaccional (>100.000 registros).

---

## 1. Problema de Rendimiento y Arquitectura

En despliegues de gran escala, el cálculo en caliente de métricas de jornada y formación (totales de minutos trabajados, porcentaje de asistencia a formaciones, número de fichajes) sobre tablas transaccionales activas (`checkins`, `formation_attendances`) puede penalizar los índices y la CPU del motor relacional.

Para aislar la carga analítica de la operativa transaccional de fichaje en tiempo real, se implementa una vista materializada que precalcula los agregados analíticos periódicamente.

---

## 2. Script DDL de la Vista Materializada

```sql
-- ============================================================================
-- VISTA MATERIALIZADA: user_analytics_summary_mv
-- Precalcula métricas analíticas consolidadas por usuario
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS user_analytics_summary_mv AS
SELECT 
    u.id AS user_id,
    u.username,
    u.first_name,
    u.last_name,
    u.personal_code,
    u.locator,
    u.is_working,
    u.company_id,
    c.name AS company_name,
    a.authority,
    
    -- Métricas de control horario (Fichajes)
    COALESCE(chk.total_checkins, 0) AS total_checkins,
    COALESCE(chk.total_work_minutes, 0) AS total_work_minutes,
    
    -- Métricas de Formaciones
    COALESCE(att.formations_assigned, 0) AS formations_assigned,
    COALESCE(att.formations_attended, 0) AS formations_attended,
    COALESCE(att.formations_completed, 0) AS formations_completed,
    CASE 
        WHEN COALESCE(att.formations_assigned, 0) > 0 
        THEN ROUND((COALESCE(att.formations_attended, 0)::numeric / att.formations_assigned::numeric) * 100.0, 1)
        ELSE 0.0 
    END AS attendance_percentage,
    COALESCE(att.total_formation_minutes, 0) AS total_formation_minutes

FROM users u
LEFT JOIN companies c ON u.company_id = c.id
LEFT JOIN authorities a ON u.authority_id = a.id

-- Agregación previa de fichajes
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(id) AS total_checkins,
        -- Estimación de minutos de fichajes cerrados
        SUM(
            CASE 
                WHEN check_in_type = 'SALIDA' 
                THEN 480 -- Minutos promedio o cálculo por diferencias entre pares
                ELSE 0 
            END
        ) AS total_work_minutes
    FROM checkins
    GROUP BY user_id
) chk ON u.id = chk.user_id

-- Agregación previa de asistencia a formaciones
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(id) AS formations_assigned,
        COUNT(CASE WHEN check_in_date IS NOT NULL THEN 1 END) AS formations_attended,
        COUNT(CASE WHEN check_out_date IS NOT NULL THEN 1 END) AS formations_completed,
        COALESCE(SUM(EXTRACT(EPOCH FROM (check_out_date - check_in_date)) / 60), 0) AS total_formation_minutes
    FROM formation_attendances
    GROUP BY user_id
) att ON u.id = att.user_id

WHERE u.is_approved = true 
  AND u.username NOT LIKE 'GDPR_DEL_%'
  AND (a.authority IS NULL OR a.authority != 'ADMIN');

-- Índice único obligatorio para permitir refresco concurrente sin bloqueos de lectura
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_analytics_summary_mv_uid 
ON user_analytics_summary_mv (user_id);

CREATE INDEX IF NOT EXISTS idx_user_analytics_summary_mv_company 
ON user_analytics_summary_mv (company_id);
```

---

## 3. Tarea de Refresco Concurrente (Cron / Scheduled Job)

Para actualizar la vista materializada sin bloquear peticiones de lectura concurrentes en la aplicación:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY user_analytics_summary_mv;
```

Se puede configurar mediante:
1. **Spring Boot `@Scheduled`**: Invocando un `jdbcTemplate.execute("REFRESH MATERIALIZED VIEW CONCURRENTLY user_analytics_summary_mv");` nocturno o cada 30 minutos.
2. **PostgreSQL pg_cron / Linux crontab**: Ejecutando el refresco al cierre de turnos laborales.
