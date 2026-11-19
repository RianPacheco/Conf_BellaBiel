import { Routes } from '@angular/router';

export default [
  {
    path: '',
    title: 'Estoque · Bella Biel',
    data: { titulo: 'Estoque' },
    loadComponent: () =>
      import('../../shared/ui/em-construcao-page').then((m) => m.EmConstrucaoPage),
  },
] satisfies Routes;
