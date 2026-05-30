package com.hms.common.config;

import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Getter
@Component
public class PaginationProperties {

    @Value("${app.pagination.default-page}")
    private Integer defaultPage;

    @Value("${app.pagination.default-size}")
    private Integer defaultSize;

    @Value("${app.pagination.max-size}")
    private Integer maxSize;
}