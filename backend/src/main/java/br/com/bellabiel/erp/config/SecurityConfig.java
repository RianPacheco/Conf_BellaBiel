package br.com.bellabiel.erp.config;

import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Fase 0: base de segurança. Tudo é negado, exceto o health. A autenticação JWT entra na Fase 1.A.
 * API stateless: sem sessão e sem CSRF de formulário (tokens vão em Authorization: Bearer).
 */
@Configuration
@EnableMethodSecurity
class SecurityConfig {

  private static final String CSP =
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

  @Bean
  SecurityFilterChain api(
      HttpSecurity http, @Qualifier("appCorsConfigurationSource") CorsConfigurationSource cors)
      throws Exception {
    http.cors(c -> c.configurationSource(cors))
        .csrf(csrf -> csrf.disable())
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .httpBasic(b -> b.disable())
        .formLogin(f -> f.disable())
        .logout(l -> l.disable())
        .headers(this::securityHeaders)
        .authorizeHttpRequests(a ->
            a.requestMatchers(HttpMethod.GET, "/actuator/health", "/actuator/health/**")
                .permitAll()
                .anyRequest()
                .authenticated())
        .exceptionHandling(e ->
            e.authenticationEntryPoint((req, res, ex) ->
                    problem(res, 401, "Não autenticado", "Autenticação necessária."))
                .accessDeniedHandler((req, res, ex) ->
                    problem(res, 403, "Acesso negado", "Sem permissão para este recurso.")));
    return http.build();
  }

  /** Swagger/OpenAPI somente no perfil dev. */
  @Bean
  @Order(0)
  @Profile("dev")
  SecurityFilterChain docsDev(HttpSecurity http) throws Exception {
    http.securityMatcher("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html")
        .authorizeHttpRequests(a -> a.anyRequest().permitAll())
        .csrf(csrf -> csrf.disable())
        .headers(h -> h.frameOptions(HeadersConfigurer.FrameOptionsConfig::deny));
    return http.build();
  }

  private void securityHeaders(HeadersConfigurer<HttpSecurity> h) {
    h.contentSecurityPolicy(csp -> csp.policyDirectives(CSP))
        .frameOptions(HeadersConfigurer.FrameOptionsConfig::deny)
        .httpStrictTransportSecurity(
            hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31_536_000))
        .contentTypeOptions(Customizer.withDefaults())
        .referrerPolicy(r -> r.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.SAME_ORIGIN))
        .permissionsPolicyHeader(p -> p.policy("geolocation=(), camera=(), microphone=()"));
  }

  @Bean("appCorsConfigurationSource")
  CorsConfigurationSource corsConfigurationSource(AppProperties props) {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(props.cors().allowedOrigins());
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-Requested-With"));
    cfg.setAllowCredentials(true);
    cfg.setMaxAge(3600L);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", cfg);
    return source;
  }

  private static void problem(
      jakarta.servlet.http.HttpServletResponse res, int status, String title, String detail)
      throws java.io.IOException {
    res.setStatus(status);
    res.setHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PROBLEM_JSON_VALUE);
    res.setCharacterEncoding(StandardCharsets.UTF_8.name());
    res.getWriter()
        .write(
            "{\"type\":\"about:blank\",\"title\":\"%s\",\"status\":%d,\"detail\":\"%s\"}"
                .formatted(title, status, detail));
  }
}
