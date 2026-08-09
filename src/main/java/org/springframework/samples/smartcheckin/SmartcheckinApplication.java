package org.springframework.samples.smartcheckin;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.util.TimeZone;

@SpringBootApplication()
@EnableScheduling
public class SmartcheckinApplication {

	public static void main(String[] args) {
		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
		System.setProperty("spring.profiles.default", "postgres");
		SpringApplication.run(SmartcheckinApplication.class, args);
	}

}
