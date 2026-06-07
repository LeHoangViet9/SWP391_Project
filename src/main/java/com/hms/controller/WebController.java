package com.hms.controller;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class WebController {
    @GetMapping("/register")
    public String showRegisterPage() {
        return "pages/auth/register";
    }

    @GetMapping("/login")
    public String showLoginPage() {
        return "pages/auth/login";
    }
}
