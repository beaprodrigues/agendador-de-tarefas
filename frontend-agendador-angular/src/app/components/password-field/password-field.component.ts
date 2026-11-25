import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-password-field',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="field">
      <label class="field-label">{{ label }}</label>
      <div class="input-container">
        <input
          [type]="oculto() ? 'password' : 'text'"
          [ngModel]="password"
          (ngModelChange)="passwordChange.emit($event)"
          placeholder="••••••••"
          required
        />
        <button
          type="button"
          class="toggle-btn"
          (click)="alternarVisibilidade()"
          [attr.aria-label]="oculto() ? 'Mostrar senha' : 'Ocultar senha'"
        >
          {{ oculto() ? 'Mostrar' : 'Ocultar' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .field-label {
      font-size: 0.78rem;
      font-weight: 500;
      color: #3f3f46;
    }
    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }
    input {
      width: 100%;
      padding: 8px 68px 8px 11px;
      border-radius: 6px;
      border: 1px solid #e4e4e7;
      background: #ffffff;
      color: #18181b;
      font-size: 0.85rem;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    input:focus {
      outline: none;
      border-color: #18181b;
      box-shadow: 0 0 0 2px rgba(24, 24, 27, 0.06);
    }
    .toggle-btn {
      position: absolute;
      right: 6px;
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: #71717a;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: color 0.15s ease, background 0.15s ease;
    }
    .toggle-btn:hover {
      color: #18181b;
      background: #f4f4f5;
    }
  `]
})
export class PasswordFieldComponent {
  @Input() label = 'Senha';
  @Input() password = '';
  @Output() readonly passwordChange = new EventEmitter<string>();

  readonly oculto = signal(true);

  alternarVisibilidade(): void {
    this.oculto.update(valor => !valor);
  }
}
