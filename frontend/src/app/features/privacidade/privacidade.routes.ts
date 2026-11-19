import { Routes } from '@angular/router';

export default [
  {
    path: '',
    title: 'Política de Privacidade · Bella Biel',
    data: { titulo: 'Política de Privacidade' },
    loadComponent: () =>
      import('../../shared/ui/em-construcao-page').then((m) => m.EmConstrucaoPage),
  },
] satisfies Routes;
