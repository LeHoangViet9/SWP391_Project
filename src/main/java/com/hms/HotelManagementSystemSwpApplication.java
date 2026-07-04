package com.hms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HotelManagementSystemSwpApplication {

    public static void main(String[] args) {
        SpringApplication.run(HotelManagementSystemSwpApplication.class, args);
    }

}
