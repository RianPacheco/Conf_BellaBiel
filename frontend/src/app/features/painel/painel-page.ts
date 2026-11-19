import { ChangeDetectionStrategy, Component } from '@angular/core';

/**
 * Fase 0: apenas o esqueleto do Painel (cabeçalho + grade bento em skeleton).
 * Os dados reais chegam na Fase 1.E; nenhum número de negócio é fixado aqui.
 */
@Component({
  selector: 'app-painel-page',
  template: `
    <div class="mb-8">
      <h1 class="font-headline-lg text-headline-lg text-primary">Painel Principal</h1>
      <p class="font-body-md text-body-md text-on-surface-variant">
        Resumo da sua confeitaria hoje.
      </p>
    </div>

    <div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2" aria-hidden="true">
      @for (i of dois; track i) {
        <div
          class="h-[74px] animate-pulse rounded-xl border border-outline-variant bg-surface-container"
        ></div>
      }
    </div>

    <div
      class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4"
      aria-busy="true"
    >
      @for (i of quatro; track i) {
        <div class="hover-lift rounded-xl border border-outline-variant bg-surface p-6 shadow-sm">
          <div class="h-3 w-28 animate-pulse rounded bg-surface-container-high"></div>
          <div class="mt-4 h-7 w-24 animate-pulse rounded bg-surface-container-high"></div>
        </div>
      }
    </div>

    <div class="grid grid-cols-12 gap-4 sm:gap-6" aria-hidden="true">
      <div
        class="col-span-12 h-80 animate-pulse rounded-xl border border-outline-variant bg-surface lg:col-span-8"
      ></div>
      <div
        class="col-span-12 h-80 animate-pulse rounded-xl border border-outline-variant bg-surface lg:col-span-4"
      ></div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PainelPage {
  protected readonly dois = [1, 2];
  protected readonly quatro = [1, 2, 3, 4];
}
