import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Ícone Material Symbols (fonte self-hosted, subset em public/fonts). */
@Component({
  selector: 'app-icon',
  template: `<span
    class="material-symbols-outlined"
    [style.font-variation-settings]="variacao()"
    [style.font-size.px]="tamanho()"
    aria-hidden="true"
    >{{ nome() }}</span
  >`,
  host: { class: 'inline-flex items-center justify-center leading-none' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Icon {
  readonly nome = input.required<string>();
  readonly preenchido = input(false);
  readonly tamanho = input(24);

  protected readonly variacao = computed(() => `"FILL" ${this.preenchido() ? 1 : 0}, "wght" 400`);
}
