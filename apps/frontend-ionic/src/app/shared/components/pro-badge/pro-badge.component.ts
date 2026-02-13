import { Component, input } from '@angular/core';

@Component({
  selector: 'app-pro-badge',
  standalone: true,
  template: `
    <span class="pro-badge" [class.small]="size() === 'small'" [class.medium]="size() === 'medium'">
      PRO
    </span>
  `,
  styles: `
    .pro-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #fff;
      background: linear-gradient(135deg, #f5a623, #f7c948);
      border-radius: 4px;
      line-height: 1;
      vertical-align: middle;
    }

    .small {
      font-size: 9px;
      padding: 2px 5px;
      border-radius: 3px;
    }

    .medium {
      font-size: 12px;
      padding: 3px 8px;
      border-radius: 4px;
    }
  `,
})
export class ProBadgeComponent {
  size = input<'small' | 'medium'>('small');
}
