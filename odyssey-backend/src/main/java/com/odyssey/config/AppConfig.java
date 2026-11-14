package com.odyssey.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class AppConfig {

    /** Injectable so services can pin a fixed clock in tests. */
    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
