package com.hms.common.config;

import org.springframework.context.annotation.Configuration;

/**
 * WebConfig — previously had duplicate /uploads/** resource handler.
 * Removed to avoid conflict with WebMvcConfig which handles this correctly.
 * WebMvcConfig uses absolute path via Paths.get().toAbsolutePath() which is more reliable.
 */
@Configuration
public class WebConfig {
    // Resource handler for /uploads/** is managed by WebMvcConfig
}