package com.hms.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Hibernate ddl-auto=update does not refresh enum CHECK constraints in
 * PostgreSQL. Keep the existing database compatible with the new workflow.
 */
@Component
@RequiredArgsConstructor
public class BookingStatusConstraintMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.execute("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_booking_status_check");
        jdbcTemplate.execute("""
                ALTER TABLE bookings ADD CONSTRAINT bookings_booking_status_check
                CHECK (booking_status IN (
                    'PENDING_PAYMENT', 'PENDING_CHECK_IN', 'CHECKED_IN',
                    'CHECKED_OUT', 'CANCELLED', 'NO_SHOW', 'PENDING', 'CONFIRMED'
                ))
                """);
    }
}
