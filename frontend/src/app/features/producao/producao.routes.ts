import { Routes } from '@angular/router';

export default [
  {
    path: '',
    title: 'Produção · Bella Biel',
    data: { titulo: 'Produção' },
    loadComponent: () =>
      import('../../shared/ui/em-construcao-page').then((m) => m.EmConstrucaoPage),
  },
] satisfies Routes;
