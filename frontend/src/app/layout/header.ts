import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { Icon } from '../shared/ui/icon';
import { LayoutService } from './layout.service';

@Component({
  selector: 'app-header',
  imports: [Icon],
  template: `
    <header
      class="glass-header sticky top-0 z-30 flex h-16 items-center justify-between gap-2 border-b border-outline-variant px-4 sm:px-6"
    >
      <div class="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          class="-ml-2 rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low lg:hidden"
          aria-label="Abrir menu"
          aria-controls="menu-lateral"
          [attr.aria-expanded]="layout.menuAberto()"
          (click)="layout.alternarMenu()"
        >
          <app-icon nome="menu" />
        </button>

        <label
          class="hidden w-full max-w-sm items-center rounded-full border border-outline-variant bg-surface-container
                 px-4 py-1.5 transition-all focus-within:ring-2 focus-within:ring-primary/20 sm:flex lg:max-w-96"
        >
          <app-icon nome="search" class="text-outline" />
          <span class="sr-only">Buscar</span>
          <input
            type="search"
            class="ml-2 w-full border-none bg-transparent text-body-md text-on-surface outline-none focus:ring-0"
            placeholder="Buscar pedidos, clientes ou produtos..."
            disabled
          />
        </label>
        <button
          type="button"
          class="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low sm:hidden"
          aria-label="Buscar"
          [attr.aria-expanded]="layout.buscaAberta()"
          (click)="layout.alternarBusca()"
        >
          <app-icon nome="search" />
        </button>
      </div>

      <div class="flex items-center gap-1 sm:gap-4">
        <button
          type="button"
          class="rounded-full p-2 text-on-surface-variant transition-all hover:bg-surface-container-low"
          aria-label="Notificações"
        >
          <app-icon nome="notifications" />
        </button>
        <!-- Usuário: preenchido com a autenticação (Fase 1). Até lá, apenas estrutura. -->
        <div
          class="flex items-center gap-3 border-l border-outline-variant pl-3 sm:pl-4"
          aria-busy="true"
        >
          <div class="hidden text-right sm:block" aria-hidden="true">
            <div class="ml-auto h-3 w-24 animate-pulse rounded bg-surface-container-high"></div>
            <div
              class="ml-auto mt-1.5 h-2 w-16 animate-pulse rounded bg-surface-container-high"
            ></div>
          </div>
          <div
            class="h-8 w-8 animate-pulse rounded-full border border-primary/20 bg-surface-container-high"
          ></div>
        </div>
      </div>
    </header>

    @if (layout.buscaAberta()) {
      <div class="glass-header border-b border-outline-variant px-4 py-2 sm:hidden">
        <label
          class="flex items-center rounded-full border border-outline-variant bg-surface-container px-4 py-1.5"
        >
          <app-icon nome="search" class="text-outline" />
          <span class="sr-only">Buscar</span>
          <input
            type="search"
            class="ml-2 w-full border-none bg-transparent text-body-md outline-none focus:ring-0"
            placeholder="Buscar..."
            disabled
          />
        </label>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly layout = inject(LayoutService);
}
