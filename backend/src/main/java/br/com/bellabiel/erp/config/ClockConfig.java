package br.com.bellabiel.erp.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
class ClockConfig {

  /** Relógio injetável (UTC) para que regras dependentes de data sejam testáveis. */
  @Bean
  Clock clock() {
    return Clock.systemUTC();
  }
}
