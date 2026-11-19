import { TestBed } from '@angular/core/testing';

import { LayoutService } from './layout.service';

describe('LayoutService', () => {
  it('alterna e fecha o menu', () => {
    const s = TestBed.inject(LayoutService);
    expect(s.menuAberto()).toBe(false);
    s.alternarMenu();
    expect(s.menuAberto()).toBe(true);
    s.fecharMenu();
    expect(s.menuAberto()).toBe(false);
  });

  it('alterna a busca expansível', () => {
    const s = TestBed.inject(LayoutService);
    s.alternarBusca();
    expect(s.buscaAberta()).toBe(true);
  });
});
