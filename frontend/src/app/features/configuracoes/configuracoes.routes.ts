import { Routes } from '@angular/router';

export default [
  {
    path: '',
    title: 'Configurações · Bella Biel',
    data: { titulo: 'Configurações' },
    loadComponent: () =>
      import('../../shared/ui/em-construcao-page').then((m) => m.EmConstrucaoPage),
  },
] satisfies Routes;
