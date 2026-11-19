package br.com.bellabiel.erp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@IntegrationTest
@AutoConfigureMockMvc
class SegurancaBaseTest {

  @Autowired MockMvc mvc;

  @Test
  void healthExpoeApenasStatus() throws Exception {
    MvcResult r =
        mvc.perform(get("/actuator/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"))
            .andReturn();
    assertThat(r.getResponse().getContentAsString()).doesNotContain("components", "details");
  }

  @Test
  void outrosEndpointsDoActuatorNaoSaoExpostos() throws Exception {
    mvc.perform(get("/actuator/env")).andExpect(status().isUnauthorized());
    mvc.perform(get("/actuator/beans")).andExpect(status().isUnauthorized());
  }

  @Test
  void rotaProtegidaSemTokenRetorna401ComProblemDetailSemStackTrace() throws Exception {
    MvcResult r =
        mvc.perform(get("/api/v1/clientes"))
            .andExpect(status().isUnauthorized())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.status").value(401))
            .andReturn();
    assertThat(r.getResponse().getContentAsString()).doesNotContain("Exception", "at br.com");
  }

  @Test
  void cabecalhosDeSegurancaPresentes() throws Exception {
    mvc.perform(get("/actuator/health"))
        .andExpect(header().string("X-Content-Type-Options", "nosniff"))
        .andExpect(header().string("X-Frame-Options", "DENY"))
        .andExpect(header().string("Referrer-Policy", "same-origin"))
        .andExpect(
            header()
                .string(
                    "Content-Security-Policy",
                    org.hamcrest.Matchers.containsString("frame-ancestors 'none'")));
  }
}
