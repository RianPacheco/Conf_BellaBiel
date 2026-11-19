import { Routes } from '@angular/router';

export default [
  {
    path: '',
    title: 'Vendas · Bella Biel',
    data: { titulo: 'Vendas' },
    loadComponent: () =>
      import('../../shared/ui/em-construcao-page').then((m) => m.EmConstrucaoPage),
  },
] satisfies Routes;
