import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { Icon } from '../shared/ui/icon';
import { Logo } from '../shared/ui/logo';
import { LayoutService } from './layout.service';
import { NAV_ITEMS } from './nav';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, Icon, Logo],
  template: `
    <!-- Fundo escurecido (somente mobile, com o menu aberto) -->
    @if (layout.menuAberto() && !layout.desktop()) {
      <button
        type="button"
        tabindex="-1"
        aria-hidden="true"
        data-testid="menu-fundo"
        class="fixed inset-0 z-40 h-full w-full cursor-default bg-inverse-surface/50 lg:hidden"
        (click)="layout.fecharMenu()"
      ></button>
    }

    <aside
      id="menu-lateral"
      class="fixed left-0 top-0 z-50 flex h-dvh w-64 flex-col border-r border-outline-variant bg-surface
             transition-transform duration-200 lg:z-40 lg:translate-x-0"
      [class.-translate-x-full]="!layout.menuAberto() && !layout.desktop()"
      [attr.inert]="!layout.desktop() && !layout.menuAberto() ? '' : null"
      aria-label="Menu principal"
    >
      <div class="flex items-center justify-between border-b border-outline-variant/70 p-6 pb-5">
        <app-logo />
        <button
          type="button"
          class="rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low lg:hidden"
          aria-label="Fechar menu"
          (click)="layout.fecharMenu()"
        >
          <app-icon nome="close" />
        </button>
      </div>

      <nav class="mt-4 flex-1 space-y-1 overflow-y-auto px-4" aria-label="Seções">
        @for (item of itens; track item.path) {
          <a
            #link
            [routerLink]="item.path"
            routerLinkActive="text-primary! font-medium border-primary! bg-primary-container/10"
            [routerLinkActiveOptions]="{ exact: false }"
            ariaCurrentWhenActive="page"
            class="flex min-h-11 items-center gap-3 border-l-2 border-transparent px-4 py-3
                   text-on-surface-variant transition-colors duration-200 hover:bg-surface-container-low"
          >
            <app-icon [nome]="item.icon" />
            <span class="font-label-md text-label-md">{{ item.label }}</span>
          </a>
        }
      </nav>

      <div class="mt-auto border-t border-outline-variant p-4">
        <a
          routerLink="/vendas"
          class="mb-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3
                 font-label-md text-label-md text-on-primary transition-all hover:opacity-90 active:scale-95"
        >
          <app-icon nome="add" [tamanho]="18" />
          Novo Pedido
        </a>
        <div class="space-y-1">
          <a
            routerLink="/privacidade"
            class="flex min-h-11 items-center gap-3 px-4 py-2 text-on-surface-variant transition-colors hover:text-primary"
          >
            <app-icon nome="help" [tamanho]="20" />
            <span class="font-label-md text-label-md">Ajuda e privacidade</span>
          </a>
          <button
            type="button"
            disabled
            class="flex min-h-11 w-full items-center gap-3 px-4 py-2 text-left text-on-surface-variant
                   transition-colors hover:text-error disabled:cursor-not-allowed disabled:opacity-60"
            title="Disponível com a autenticação (Fase 1)"
          >
            <app-icon nome="logout" [tamanho]="20" />
            <span class="font-label-md text-label-md">Sair</span>
          </button>
        </div>
      </div>
    </aside>
  `,
  host: { '(document:keydown.escape)': 'layout.fecharMenu()' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  protected readonly layout = inject(LayoutService);
  protected readonly itens = NAV_ITEMS;
  private readonly primeiroLink = viewChild<ElementRef<HTMLAnchorElement>>('link');

  constructor() {
    // Navegou: fecha o drawer no mobile.
    inject(Router).events.subscribe(() => this.layout.fecharMenu());
    // Abriu o drawer: leva o foco para dentro do menu.
    effect(() => {
      if (this.layout.menuAberto() && !this.layout.desktop()) {
        queueMicrotask(() => this.primeiroLink()?.nativeElement.focus());
      }
    });
  }
}
