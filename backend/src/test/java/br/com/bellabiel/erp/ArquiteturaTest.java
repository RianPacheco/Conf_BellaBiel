package br.com.bellabiel.erp;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

/** Fronteiras do monolito modular (ver docs/ARQUITETURA.md §4.2). Cresce junto com as features. */
@AnalyzeClasses(
    packages = "br.com.bellabiel.erp",
    importOptions = ImportOption.DoNotIncludeTests.class)
class ArquiteturaTest {

  @ArchTest
  static final ArchRule controllersNaoUsamRepositorios =
      noClasses()
          .that()
          .haveSimpleNameEndingWith("Controller")
          .should()
          .dependOnClassesThat()
          .haveSimpleNameEndingWith("Repository")
          .because("controller -> service -> repository")
          .allowEmptyShould(true); // ainda não há controllers (Fase 0)

  @ArchTest
  static final ArchRule commonNaoDependeDeFeatures =
      noClasses()
          .that()
          .resideInAPackage("br.com.bellabiel.erp.common..")
          .should()
          .dependOnClassesThat()
          .resideInAnyPackage(
              "br.com.bellabiel.erp.auth..",
              "br.com.bellabiel.erp.usuarios..",
              "br.com.bellabiel.erp.clientes..",
              "br.com.bellabiel.erp.produtos..",
              "br.com.bellabiel.erp.insumos..",
              "br.com.bellabiel.erp.estoque..",
              "br.com.bellabiel.erp.pedidos..",
              "br.com.bellabiel.erp.producao..",
              "br.com.bellabiel.erp.financeiro..",
              "br.com.bellabiel.erp.dashboard..")
          .allowEmptyShould(true);
}
