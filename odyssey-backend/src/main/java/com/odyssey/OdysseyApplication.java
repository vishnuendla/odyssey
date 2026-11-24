
package com.odyssey;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class OdysseyApplication {
    public static void main(String[] args) {
        SpringApplication.run(OdysseyApplication.class, args);
    }
}
