import { Routes } from '@angular/router';

export default [
  {
    path: '',
    title: 'Financeiro · Bella Biel',
    data: { titulo: 'Financeiro' },
    loadComponent: () =>
      import('../../shared/ui/em-construcao-page').then((m) => m.EmConstrucaoPage),
  },
] satisfies Routes;
