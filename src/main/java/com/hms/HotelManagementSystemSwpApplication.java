package com.hms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@org.springframework.scheduling.annotation.EnableScheduling
public class HotelManagementSystemSwpApplication {

    public static void main(String[] args) {
        SpringApplication.run(HotelManagementSystemSwpApplication.class, args);
    }

}
