import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-logo',
  template: `
    <svg
      class="w-9 h-9 text-primary shrink-0"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2.5"
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <path d="M40 18 Q40 12 46 12 L54 12 Q60 12 60 18 L60 30 L40 30 Z" />
      <path d="M30 30 L70 30 L70 48 L30 48 Z" />
      <path d="M18 48 L82 48 L82 66 L18 66 Z" />
      <path d="M10 74 Q20 66 30 74 T50 74 T70 74 Q80 66 90 74" stroke-width="2.2" />
      <circle cx="24" cy="70" r="4" />
      <path d="M74 62 L84 62 L82 74 L76 74 Z" />
      <path d="M73 62 Q79 52 85 62" stroke-width="2.2" />
    </svg>
    <div class="leading-none">
      <p class="font-script text-[28px] leading-none text-primary">Bella Biel</p>
      <p class="font-label-md text-[10px] text-on-surface-variant mt-1 tracking-[0.25em] uppercase">
        Confeitaria
      </p>
    </div>
  `,
  host: { class: 'flex items-center gap-3' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logo {}
