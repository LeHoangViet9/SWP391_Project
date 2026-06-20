package com.hms;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import com.hms.repository.auth.UserRepository;
import com.hms.entity.auth.User;
import java.util.List;

@SpringBootTest
public class DebugDatabaseTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void patchDatabaseAndVerify() {
        System.out.println("=== PATCHING DATABASE: DROP COLUMN IF EXISTS user_name ===");
        try {
            jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS user_name CASCADE");
            System.out.println("Dropped user_name column successfully.");
        } catch (Exception e) {
            System.out.println("Failed to drop user_name column: " + e.getMessage());
        }

        System.out.println("=== VERIFYING: LOADING ALL USERS VIA JPA ===");
        try {
            List<User> users = userRepository.findAll();
            System.out.println("Successfully loaded " + users.size() + " users via JPA!");
            for (User u : users) {
                System.out.println("User Email: " + u.getEmail() + ", Status: " + u.getAccountStatus());
            }
        } catch (Exception e) {
            System.out.println("JPA Load failed!");
            e.printStackTrace();
        }
    }
}

