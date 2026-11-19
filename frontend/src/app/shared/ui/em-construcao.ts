import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { Icon } from './icon';

/** Página provisória das seções que entram nas próximas fases. */
@Component({
  selector: 'app-em-construcao',
  imports: [Icon],
  template: `
    <div class="mb-8">
      <h1 class="font-headline-lg text-headline-lg text-primary">{{ titulo() }}</h1>
    </div>
    <div
      class="flex flex-col items-center gap-3 rounded-xl border border-outline-variant bg-surface p-10 text-center shadow-sm"
    >
      <app-icon nome="bakery_dining" [tamanho]="40" class="text-primary" />
      <p class="font-headline-md text-[18px] text-primary">Em construção</p>
      <p class="max-w-md text-body-md text-on-surface-variant">
        Esta seção será entregue em uma das próximas fases do projeto.
      </p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmConstrucao {
  readonly titulo = input.required<string>();
}
