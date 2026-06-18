package com.hms.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.stereotype.Component;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;

/**
 * Chạy SQL cleanup TRƯỚC khi Hibernate DDL update.
 * Fix lỗi: column "user_name" of relation "users" contains null values
 * khi Hibernate cố ADD UNIQUE constraint trên table đã có NULL data.
 */
@Slf4j
public class PreHibernateDbCleanup implements ApplicationListener<ApplicationEnvironmentPreparedEvent> {

    @Override
    public void onApplicationEvent(ApplicationEnvironmentPreparedEvent event) {
        String url = event.getEnvironment().getProperty("spring.datasource.url");
        String username = event.getEnvironment().getProperty("spring.datasource.username");
        String password = event.getEnvironment().getProperty("spring.datasource.password");

        if (url == null) return;

        try {
            Class.forName("org.postgresql.Driver");
            try (Connection conn = DriverManager.getConnection(url, username, password);
                 Statement stmt = conn.createStatement()) {

                // Xóa các user row có user_name = NULL (từ schema migration cũ)
                int deleted = stmt.executeUpdate(
                        "DELETE FROM users WHERE user_name IS NULL OR user_name = ''");
                if (deleted > 0) {
                    log.warn("[PreHibernate] Đã xóa {} orphan user row(s) có user_name IS NULL", deleted);
                }

            }
        } catch (ClassNotFoundException e) {
            log.debug("[PreHibernate] PostgreSQL driver not found, skipping cleanup");
        } catch (Exception e) {
            // Table chưa tồn tại hoặc không connect được — bỏ qua an toàn
            log.debug("[PreHibernate] DB cleanup skipped: {}", e.getMessage());
        }
    }
}
