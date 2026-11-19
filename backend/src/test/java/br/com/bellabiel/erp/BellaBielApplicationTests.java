package br.com.bellabiel.erp;

import static org.assertj.core.api.Assertions.assertThat;

import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

@IntegrationTest
class BellaBielApplicationTests {

  @Autowired DataSource dataSource;

  @Test
  void contextoSobeEFlywayAplicaABaseline() {
    Integer versao =
        new JdbcTemplate(dataSource)
            .queryForObject(
                "SELECT count(*) FROM flyway_schema_history WHERE success = true", Integer.class);
    assertThat(versao).isGreaterThanOrEqualTo(1);
  }
}
