import { DestroyRef, Injectable, inject, signal } from '@angular/core';

/** Estado do shell: menu lateral (drawer no mobile) e busca expansível. */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private static readonly QUERY = '(min-width: 1024px)';

  readonly menuAberto = signal(false);
  readonly buscaAberta = signal(false);
  readonly desktop = signal(this.mq()?.matches ?? true);

  constructor() {
    const mq = this.mq();
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => {
      this.desktop.set(e.matches);
      if (e.matches) this.menuAberto.set(false);
    };
    mq.addEventListener('change', onChange);
    inject(DestroyRef).onDestroy(() => mq.removeEventListener('change', onChange));
  }

  alternarMenu(): void {
    this.menuAberto.update((v) => !v);
  }

  fecharMenu(): void {
    this.menuAberto.set(false);
  }

  alternarBusca(): void {
    this.buscaAberta.update((v) => !v);
  }

  private mq(): MediaQueryList | null {
    return typeof matchMedia === 'function' ? matchMedia(LayoutService.QUERY) : null;
  }
}
