import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { EmConstrucao } from './em-construcao';

@Component({
  selector: 'app-em-construcao-page',
  imports: [EmConstrucao],
  template: `<app-em-construcao [titulo]="titulo" />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmConstrucaoPage {
  protected readonly titulo = inject(ActivatedRoute).snapshot.data['titulo'] as string;
}
