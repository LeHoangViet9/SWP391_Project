package com.hms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.i18n.CookieLocaleResolver;
import org.springframework.web.servlet.i18n.LocaleChangeInterceptor;
import org.springframework.context.MessageSource;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;


import java.time.Duration;
import java.util.Locale;

@Configuration
public class LocaleConfig implements WebMvcConfigurer {
    // 1. Xác định nơi lưu trữ và cấu hình ngôn ngữ mặc định (Đã sửa chuẩn Spring Boot 3.x)
    @Bean
    public LocaleResolver localeResolver() {
        // Truyền thẳng tên Cookie vào hàm khởi tạo (Constructor) để tránh lỗi setCookieName
        CookieLocaleResolver resolver = new CookieLocaleResolver("hms_lang");

        // Thiết lập ngôn ngữ mặc định ban đầu là Tiếng Anh
        resolver.setDefaultLocale(Locale.ENGLISH);

        // Thiết lập thời gian sống của Cookie là 30 ngày bằng đối tượng Duration
        resolver.setCookieMaxAge(Duration.ofDays(30));

        return resolver;
    }

    // 2. Bộ chặn (Interceptor) dùng để bắt tham số thay đổi ngôn ngữ trên URL (?lang=vi hoặc ?lang=en)
    @Bean
    public LocaleChangeInterceptor localeChangeInterceptor() {
        LocaleChangeInterceptor interceptor = new LocaleChangeInterceptor();
        interceptor.setParamName("lang");
        return interceptor;
    }

    // Đăng ký bộ chặn (Interceptor) vào hệ thống xử lý Web MVC
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(localeChangeInterceptor());
    }

    // 3. Liên kết hệ thống đến các file từ điển cấu hình ngôn ngữ messages.properties
    @Bean
    public MessageSource messageSource() {
        ReloadableResourceBundleMessageSource messageSource = new ReloadableResourceBundleMessageSource();
        messageSource.setBasename("classpath:messages"); // Trỏ đến các file bắt đầu bằng cụm "messages"
        messageSource.setDefaultEncoding("UTF-8"); // Đọc định dạng UTF-8 để hiển thị được tiếng Việt có dấu
        return messageSource;
    }

    // 4. Nhúng từ điển đa ngôn ngữ vào trình xác thực dữ liệu đầu vào (Validator)
    @Bean
    public LocalValidatorFactoryBean getValidator() {
        LocalValidatorFactoryBean bean = new LocalValidatorFactoryBean();
        bean.setValidationMessageSource(messageSource());
        return bean;
    }
}
