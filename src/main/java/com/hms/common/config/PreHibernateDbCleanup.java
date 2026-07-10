package com.hms.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

/**
 * Runs compatibility SQL before Hibernate DDL update.
 */
@Slf4j
public class PreHibernateDbCleanup implements ApplicationListener<ApplicationEnvironmentPreparedEvent> {

    @Override
    public void onApplicationEvent(ApplicationEnvironmentPreparedEvent event) {
        String url = event.getEnvironment().getProperty("spring.datasource.url");
        String username = event.getEnvironment().getProperty("spring.datasource.username");
        String password = event.getEnvironment().getProperty("spring.datasource.password");

        if (url == null) {
            return;
        }

        try {
            Class.forName("org.postgresql.Driver");
            try (Connection conn = DriverManager.getConnection(url, username, password);
                 Statement stmt = conn.createStatement()) {

                cleanupLegacyUsers(stmt);
                syncInvoiceConstraints(stmt);
                syncBookingStatusConstraint(stmt);
                syncWorkStatusConstraint(stmt);
            }
        } catch (ClassNotFoundException e) {
            log.debug("[PreHibernate] PostgreSQL driver not found, skipping cleanup");
        } catch (Exception e) {
            log.debug("[PreHibernate] DB cleanup skipped: {}", e.getMessage());
        }
    }

    private void cleanupLegacyUsers(Statement stmt) {
        try {
            int deleted = stmt.executeUpdate(
                    "DELETE FROM users WHERE user_name IS NULL OR user_name = ''");
            if (deleted > 0) {
                log.warn("[PreHibernate] Deleted {} orphan user row(s) with empty user_name", deleted);
            }
        } catch (Exception e) {
            log.debug("[PreHibernate] Legacy user cleanup skipped: {}", e.getMessage());
        }
    }

    private void syncInvoiceConstraints(Statement stmt) {
        try {
            stmt.execute("""
                    DO $$
                    DECLARE
                        constraint_record record;
                    BEGIN
                        FOR constraint_record IN
                            SELECT tc.constraint_name
                            FROM information_schema.table_constraints tc
                            JOIN information_schema.key_column_usage kcu
                                ON tc.constraint_schema = kcu.constraint_schema
                                AND tc.constraint_name = kcu.constraint_name
                                AND tc.table_name = kcu.table_name
                            WHERE tc.table_schema = 'public'
                                AND tc.table_name = 'invoices'
                                AND tc.constraint_type = 'UNIQUE'
                            GROUP BY tc.constraint_name
                            HAVING array_agg(kcu.column_name ORDER BY kcu.ordinal_position) = ARRAY['booking_id']
                        LOOP
                            EXECUTE format('ALTER TABLE invoices DROP CONSTRAINT %I', constraint_record.constraint_name);
                        END LOOP;
                    END $$;
                    """);
            stmt.execute("""
                    CREATE UNIQUE INDEX IF NOT EXISTS uk_invoices_booking_invoice_type
                    ON invoices (booking_id, invoice_type)
                    """);
            log.info("[PreHibernate] Invoice constraints synchronized");
        } catch (Exception e) {
            log.debug("[PreHibernate] Invoice constraint cleanup skipped: {}", e.getMessage());
        }
    }

    private void syncBookingStatusConstraint(Statement stmt) {
        try {
            stmt.execute("""
                    ALTER TABLE bookings
                    DROP CONSTRAINT IF EXISTS bookings_booking_status_check
                    """);
            stmt.execute("""
                    ALTER TABLE bookings
                    ADD CONSTRAINT bookings_booking_status_check
                    CHECK (booking_status IN (
                        'PENDING_PAYMENT',
                        'CONFIRMED',
                        'CHECKED_IN',
                        'CHECKED_OUT',
                        'CANCELLED',
                        'NO_SHOW',
                        'PENDING'
                    ))
                    """);
            log.info("[PreHibernate] Booking status check constraint synchronized");
        } catch (Exception e) {
            log.debug("[PreHibernate] Booking status constraint cleanup skipped: {}", e.getMessage());
        }
    }

    private void syncWorkStatusConstraint(Statement stmt) {
        try {
            stmt.execute("""
                    ALTER TABLE users
                    DROP CONSTRAINT IF EXISTS users_work_status_check
                    """);
            stmt.execute("""
                    ALTER TABLE users
                    ADD CONSTRAINT users_work_status_check
                    CHECK (work_status IN (
                        'AVAILABLE',
                        'WORKING',
                        'WAITING_CONFIRM',
                        'OFF'
                    ))
                    """);
            log.info("[PreHibernate] User work status check constraint synchronized");
        } catch (Exception e) {
            log.debug("[PreHibernate] User work status constraint cleanup skipped: {}", e.getMessage());
        }
    }
}
