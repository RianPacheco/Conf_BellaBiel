import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Coluna, ResponsiveTable } from './responsive-table';

interface Linha {
  nome: string;
  qtd: number | null;
}

@Component({
  imports: [ResponsiveTable],
  template: `
    <app-responsive-table [colunas]="colunas" [linhas]="linhas" vazio="Sem registros">
      <ng-template #acoes let-l
        ><button type="button">editar {{ l.nome }}</button></ng-template
      >
    </app-responsive-table>
  `,
})
class Host {
  colunas: Coluna<Linha>[] = [
    { cabecalho: 'Nome', valor: (l) => l.nome, destaque: true },
    { cabecalho: 'Qtd', valor: (l) => l.qtd },
  ];
  linhas: Linha[] = [
    { nome: 'Brigadeiro', qtd: 3 },
    { nome: 'Macaron', qtd: null },
  ];
}

describe('ResponsiveTable', () => {
  it('renderiza os mesmos dados em tabela e em cards, com ações e travessão para nulos', async () => {
    const f = TestBed.createComponent(Host);
    await f.whenStable();
    const el = f.nativeElement as HTMLElement;
    expect(el.querySelectorAll('table tbody tr')).toHaveLength(2);
    expect(el.querySelectorAll('ul > li')).toHaveLength(2);
    expect(el.textContent).toContain('editar Brigadeiro');
    expect(el.querySelector('ul')?.textContent).toContain('—');
  });

  it('mostra a mensagem de vazio', async () => {
    const f = TestBed.createComponent(Host);
    f.componentInstance.linhas = [];
    await f.whenStable();
    expect((f.nativeElement as HTMLElement).textContent).toContain('Sem registros');
  });
});
