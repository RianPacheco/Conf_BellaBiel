package br.com.bellabiel.erp.config;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;

/** Propriedades da aplicação (todas vindas de variáveis de ambiente / application.yml). */
@ConfigurationProperties(prefix = "app")
public record AppProperties(Cors cors) {

  public AppProperties {
    cors = cors == null ? new Cors(List.of()) : cors;
  }

  /** Origens permitidas. Lista vazia = nenhuma origem cruzada (produção usa o mesmo domínio). */
  public record Cors(List<String> allowedOrigins) {
    public Cors {
      allowedOrigins = allowedOrigins == null ? List.of() : List.copyOf(allowedOrigins);
    }
  }
}
