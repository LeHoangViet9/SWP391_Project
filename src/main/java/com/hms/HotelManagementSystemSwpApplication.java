package com.hms;

import com.hms.common.config.PreHibernateDbCleanup;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HotelManagementSystemSwpApplication {

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(HotelManagementSystemSwpApplication.class);
        application.addListeners(new PreHibernateDbCleanup());
        application.run(args);
    }

}
