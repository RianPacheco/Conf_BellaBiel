import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Header } from './header';
import { Sidebar } from './sidebar';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, Sidebar, Header],
  template: `
    <a
      href="#conteudo"
      class="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60] focus:rounded-lg
             focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
      >Ir para o conteúdo</a
    >
    <app-sidebar />
    <div class="lg:ml-64">
      <app-header />
      <main
        id="conteudo"
        tabindex="-1"
        class="min-h-[calc(100dvh-4rem)] p-4 sm:p-6 lg:p-8 outline-none"
      >
        <router-outlet />
      </main>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Shell {}
