import { Routes } from '@angular/router';

export default [
  {
    path: '',
    title: 'Painel · Bella Biel',
    loadComponent: () => import('./painel-page').then((m) => m.PainelPage),
  },
] satisfies Routes;
