package org.springframework.samples.smartcheckin.formation;

/**
 * Lifecycle status of a Formation.
 * - DRAFT: Formation is being drafted by administrators. Hidden from employees, check-in disabled.
 * - PUBLISHED: Active/upcoming formation. Visible to employees, check-in via QR/Code enabled.
 * - CLOSED: Training session completed, signatures captured, attendance locked.
 */
public enum FormationStatus {
    DRAFT,
    PUBLISHED,
    CLOSED
}
