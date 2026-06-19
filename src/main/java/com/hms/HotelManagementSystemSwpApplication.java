package com.hms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HotelManagementSystemSwpApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(HotelManagementSystemSwpApplication.class);
        app.addListeners(new com.hms.common.config.PreHibernateDbCleanup());
        app.run(args);
    }

}
