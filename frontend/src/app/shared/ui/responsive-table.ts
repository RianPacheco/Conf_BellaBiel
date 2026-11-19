import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  contentChild,
  input,
} from '@angular/core';

export interface Coluna<T> {
  readonly cabecalho: string;
  readonly valor: (linha: T) => string | number | null | undefined;
  /** A coluna de destaque vira o título do card no mobile. */
  readonly destaque?: boolean;
}

/**
 * Tabela em telas médias+ e lista de cards no mobile (abaixo de `md`), com os mesmos dados.
 * Ações por linha: `<ng-template #acoes let-linha>…</ng-template>`.
 */
@Component({
  selector: 'app-responsive-table',
  imports: [NgTemplateOutlet],
  template: `
    @if (linhas().length === 0) {
      <p class="py-10 text-center text-body-md text-on-surface-variant">{{ vazio() }}</p>
    } @else {
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-left text-body-md">
          <thead>
            <tr
              class="border-b border-outline-variant text-on-surface-variant font-label-md text-label-md"
            >
              @for (c of colunas(); track c.cabecalho) {
                <th scope="col" class="px-4 py-3 font-medium">{{ c.cabecalho }}</th>
              }
              @if (acoes()) {
                <th scope="col" class="px-4 py-3"><span class="sr-only">Ações</span></th>
              }
            </tr>
          </thead>
          <tbody>
            @for (l of linhas(); track $index) {
              <tr class="border-b border-outline-variant/60 hover:bg-surface-container-low">
                @for (c of colunas(); track c.cabecalho) {
                  <td class="px-4 py-3">{{ c.valor(l) ?? '—' }}</td>
                }
                @if (acoes(); as tpl) {
                  <td class="px-4 py-3 text-right">
                    <ng-container
                      [ngTemplateOutlet]="tpl"
                      [ngTemplateOutletContext]="{ $implicit: l }"
                    />
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>

      <ul class="md:hidden space-y-3">
        @for (l of linhas(); track $index) {
          <li class="rounded-xl border border-outline-variant bg-surface p-4 shadow-sm">
            @if (destaque(); as d) {
              <p class="font-label-md text-label-md font-bold text-on-surface text-[14px]">
                {{ d.valor(l) ?? '—' }}
              </p>
            }
            <dl class="mt-2 space-y-1">
              @for (c of colunas(); track c.cabecalho) {
                @if (!c.destaque) {
                  <div class="flex justify-between gap-4 text-body-md">
                    <dt class="text-on-surface-variant">{{ c.cabecalho }}</dt>
                    <dd class="text-right text-on-surface">{{ c.valor(l) ?? '—' }}</dd>
                  </div>
                }
              }
            </dl>
            @if (acoes(); as tpl) {
              <div class="mt-3 flex justify-end">
                <ng-container
                  [ngTemplateOutlet]="tpl"
                  [ngTemplateOutletContext]="{ $implicit: l }"
                />
              </div>
            }
          </li>
        }
      </ul>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResponsiveTable<T> {
  readonly colunas = input.required<readonly Coluna<T>[]>();
  readonly linhas = input.required<readonly T[]>();
  readonly vazio = input('Nada por aqui ainda.');
  readonly acoes = contentChild<TemplateRef<{ $implicit: T }>>('acoes');

  protected destaque(): Coluna<T> | undefined {
    return this.colunas().find((c) => c.destaque);
  }
}
