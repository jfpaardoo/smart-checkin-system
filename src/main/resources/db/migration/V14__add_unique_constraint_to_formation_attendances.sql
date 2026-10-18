-- V14: Deduplicar y añadir restricción UNIQUE a (formation_id, user_id) en formation_attendances
-- 1. Eliminar duplicados manteniendo prioritariamente los que tengan asistencia registrada (check_in_date)
DELETE FROM formation_attendances
WHERE id IN (
    SELECT d1.id
    FROM formation_attendances d1
    INNER JOIN formation_attendances d2
        ON d1.formation_id = d2.formation_id
       AND d1.user_id = d2.user_id
       AND d1.id <> d2.id
       AND (
           (d1.check_in_date IS NULL AND d2.check_in_date IS NOT NULL)
           OR (
               (
                   (d1.check_in_date IS NOT NULL AND d2.check_in_date IS NOT NULL)
                   OR (d1.check_in_date IS NULL AND d2.check_in_date IS NULL)
               )
               AND d1.id > d2.id
           )
       )
);

-- 2. Añadir la restricción UNIQUE
ALTER TABLE formation_attendances
    ADD CONSTRAINT uk_formation_attendance_formation_user UNIQUE (formation_id, user_id);
