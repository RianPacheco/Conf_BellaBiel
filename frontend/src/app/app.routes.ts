import { Routes } from '@angular/router';

import { Shell } from './layout/shell';

/** Rotas lazy por feature. Guards por perfil entram na Fase 1.A (auth). */
export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'painel' },
      { path: 'painel', loadChildren: () => import('./features/painel/painel.routes') },
      { path: 'vendas', loadChildren: () => import('./features/vendas/vendas.routes') },
      { path: 'producao', loadChildren: () => import('./features/producao/producao.routes') },
      { path: 'estoque', loadChildren: () => import('./features/estoque/estoque.routes') },
      { path: 'financeiro', loadChildren: () => import('./features/financeiro/financeiro.routes') },
      {
        path: 'configuracoes',
        loadChildren: () => import('./features/configuracoes/configuracoes.routes'),
      },
      {
        path: 'privacidade',
        loadChildren: () => import('./features/privacidade/privacidade.routes'),
      },
    ],
  },
  { path: '**', redirectTo: 'painel' },
];
