//package com.hms;
//
//import org.junit.jupiter.api.Test;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.context.SpringBootTest;
//import org.springframework.jdbc.core.JdbcTemplate;
//import com.hms.repository.auth.UserRepository;
//import com.hms.entity.auth.User;
//import java.util.List;
//
//@SpringBootTest
//public class DebugDatabaseTest {
//
//    @Autowired
//    private JdbcTemplate jdbcTemplate;
//
//    @Autowired
//    private UserRepository userRepository;
//
//    @Test
//    public void patchDatabaseAndVerify() {
//        System.out.println("=== PATCHING DATABASE: SET enabled = true WHERE enabled IS NULL ===");
//        int updated = jdbcTemplate.update("UPDATE users SET enabled = true WHERE enabled IS NULL or enabled = false");
//        System.out.println("Updated " + updated + " users.");
//
//        System.out.println("=== VERIFYING: LOADING ALL USERS VIA JPA ===");
//        try {
//            List<User> users = userRepository.findAll();
//            System.out.println("Successfully loaded " + users.size() + " users via JPA!");
//            for (User u : users) {
//                System.out.println("User: " + u.getUserName() + ", Enabled: " + u.isEnabled());
//            }
//        } catch (Exception e) {
//            System.out.println("JPA Load failed again!");
//            e.printStackTrace();
//        }
//    }
//}
