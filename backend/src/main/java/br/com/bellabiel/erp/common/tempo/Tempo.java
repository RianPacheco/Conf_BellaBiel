package br.com.bellabiel.erp.common.tempo;

import java.time.ZoneId;

/** Fuso do negócio. O banco guarda UTC; regras de "hoje", "mês" e "7 dias" usam este fuso. */
public final class Tempo {

  public static final ZoneId FUSO_NEGOCIO = ZoneId.of("America/Sao_Paulo");

  private Tempo() {}
}
