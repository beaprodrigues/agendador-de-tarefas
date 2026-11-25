import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PasswordFieldComponent } from '../password-field/password-field.component';
import { AgendadorStoreService } from '../../core/services/agendador-store.service';
import { StatusTarefa, TarefaKanban } from '../../core/models/agendador.model';

type PainelLateral = 'tarefa' | 'acesso' | 'cadastro';

@Component({
  selector: 'app-kanban-agendador',
  imports: [FormsModule, PasswordFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-shell">
      <header class="topbar">
        <div class="topbar-inner">
          <div class="brand">
            <div class="brand-mark">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor"/>
                <rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor" opacity="0.45"/>
                <rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor" opacity="0.45"/>
                <rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor"/>
              </svg>
            </div>
            <span class="brand-name">Agendador</span>
            <span class="brand-divider">/</span>
            <span class="brand-context">Quadro de Tarefas</span>
          </div>

          <div class="topbar-meta">
            <span class="api-indicator">BFF :8083</span>
            <div class="session-pill" [class.online]="store.autenticado()">
              <span class="status-dot"></span>
              <span>{{ store.autenticado() ? store.usuarioEmail() : 'Sessão local' }}</span>
            </div>
            @if (store.autenticado()) {
              <button type="button" class="btn-ghost-sm" (click)="store.logout()">
                Encerrar
              </button>
            }
          </div>
        </div>
      </header>

      @if (store.feedback(); as aviso) {
        <div class="toast-bar" [class.toast-error]="aviso.erro">
          <div class="toast-content">
            <span class="toast-indicator"></span>
            <span>{{ aviso.mensagem }}</span>
          </div>
          <button type="button" class="toast-close" (click)="store.limparFeedback()">Fechar</button>
        </div>
      }

      <main class="workspace">
        <aside class="sidebar">
          <div class="segmented-control">
            <button
              type="button"
              [class.active]="painelAtivo() === 'tarefa'"
              (click)="painelAtivo.set('tarefa')"
            >
              Nova tarefa
            </button>
            <button
              type="button"
              [class.active]="painelAtivo() === 'acesso'"
              (click)="painelAtivo.set('acesso')"
            >
              Acesso
            </button>
            <button
              type="button"
              [class.active]="painelAtivo() === 'cadastro'"
              (click)="painelAtivo.set('cadastro')"
            >
              Cadastro
            </button>
          </div>

          @if (painelAtivo() === 'tarefa') {
            <div class="panel-body">
              <div class="panel-header">
                <h2>Agendar tarefa</h2>
                <p>Registre um evento para acompanhamento e notificação automática.</p>
              </div>

              <form (ngSubmit)="adicionarTarefa()">
                <div class="field">
                  <label class="field-label">Título</label>
                  <input
                    type="text"
                    [(ngModel)]="novaTarefa.nomeTarefa"
                    name="nomeTarefa"
                    placeholder="Ex: Deploy do serviço de usuários"
                    required
                  />
                </div>

                <div class="field">
                  <label class="field-label">Descrição</label>
                  <textarea
                    [(ngModel)]="novaTarefa.descricao"
                    name="descricao"
                    rows="3"
                    placeholder="Contexto técnico ou observações..."
                  ></textarea>
                </div>

                <div class="field">
                  <label class="field-label">Data e horário</label>
                  <input
                    type="text"
                    class="mono-input"
                    [(ngModel)]="novaTarefa.dataEvento"
                    name="dataEvento"
                    placeholder="dd-MM-yyyy HH:mm:ss"
                    required
                  />
                  <span class="field-hint">Formato: DD-MM-AAAA HH:mm:ss</span>
                </div>

                <button type="submit" class="btn-primary">Criar tarefa</button>
              </form>
            </div>
          }

          @if (painelAtivo() === 'acesso') {
            <div class="panel-body">
              <div class="panel-header">
                <h2>Autenticação</h2>
                <p>Entre com sua conta para sincronizar tarefas com o BFF via JWT.</p>
              </div>

              <form (ngSubmit)="realizarLogin()">
                <div class="field">
                  <label class="field-label">E-mail</label>
                  <input
                    type="email"
                    [(ngModel)]="credenciais.email"
                    name="loginEmail"
                    placeholder="nome@empresa.com"
                    required
                  />
                </div>

                <app-password-field [(password)]="credenciais.senha" label="Senha" />

                <button type="submit" class="btn-primary">Autenticar</button>
              </form>
            </div>
          }

          @if (painelAtivo() === 'cadastro') {
            <div class="panel-body">
              <div class="panel-header">
                <h2>Novo usuário</h2>
                <p>Cadastro integrado ao microsserviço de usuários e consulta ViaCEP.</p>
              </div>

              <form (ngSubmit)="salvarUsuario()">
                <div class="field">
                  <label class="field-label">Nome completo</label>
                  <input type="text" [(ngModel)]="usuario.nome" name="nome" placeholder="Nome e sobrenome" required />
                </div>

                <div class="field">
                  <label class="field-label">E-mail</label>
                  <input type="email" [(ngModel)]="usuario.email" name="email" placeholder="nome@empresa.com" required />
                </div>

                <app-password-field [(password)]="usuario.senha" label="Senha" />

                <div class="divider"><span>Endereço e contato</span></div>

                <div class="field">
                  <label class="field-label">CEP</label>
                  <div class="inline-group">
                    <input
                      type="text"
                      class="mono-input"
                      [(ngModel)]="usuario.cep"
                      name="cep"
                      placeholder="01001-000"
                    />
                    <button type="button" class="btn-secondary" (click)="buscarCep()">Consultar</button>
                  </div>
                </div>

                <div class="grid-2-asym">
                  <div class="field">
                    <label class="field-label">Logradouro</label>
                    <input type="text" [(ngModel)]="usuario.rua" name="rua" placeholder="Rua / Avenida" />
                  </div>
                  <div class="field">
                    <label class="field-label">Número</label>
                    <input type="number" [(ngModel)]="usuario.numero" name="numero" placeholder="100" />
                  </div>
                </div>

                <div class="grid-2-asym">
                  <div class="field">
                    <label class="field-label">Cidade</label>
                    <input type="text" [(ngModel)]="usuario.cidade" name="cidade" placeholder="São Paulo" />
                  </div>
                  <div class="field">
                    <label class="field-label">UF</label>
                    <input type="text" [(ngModel)]="usuario.estado" name="estado" placeholder="SP" maxlength="2" />
                  </div>
                </div>

                <div class="grid-phone">
                  <div class="field">
                    <label class="field-label">DDD</label>
                    <input type="text" [(ngModel)]="usuario.ddd" name="ddd" placeholder="11" maxlength="3" />
                  </div>
                  <div class="field">
                    <label class="field-label">Telefone</label>
                    <input type="text" [(ngModel)]="usuario.telefone" name="telefone" placeholder="99999-8888" />
                  </div>
                </div>

                <button type="submit" class="btn-primary">Criar conta</button>
              </form>
            </div>
          }
        </aside>

        <section class="board-section">
          <div class="board-header">
            <div>
              <h1>Tarefas agendadas</h1>
              <p class="board-subtitle">Gerenciamento de status e fila de notificações por e-mail</p>
            </div>
            <div class="board-stats">
              <span class="stat-item">Total: <strong>{{ store.totalTarefas() }}</strong></span>
            </div>
          </div>

          <div class="kanban-grid">
            <div class="kanban-column">
              <div class="column-header">
                <div class="column-title">
                  <span class="dot dot-pending"></span>
                  <h3>Pendentes</h3>
                </div>
                <span class="column-count">{{ store.pendentes().length }}</span>
              </div>

              <div class="column-cards">
                @for (t of store.pendentes(); track t.id) {
                  <article class="task-card">
                    <div class="card-top">
                      <span class="status-tag tag-pending">Pendente</span>
                      <button
                        type="button"
                        class="icon-delete"
                        title="Excluir tarefa"
                        (click)="removerTarefa(t)"
                      >
                        ✕
                      </button>
                    </div>
                    <h4>{{ t.nomeTarefa }}</h4>
                    @if (t.descricao) {
                      <p>{{ t.descricao }}</p>
                    }
                    <div class="card-footer">
                      <time class="timestamp">{{ t.dataEvento }}</time>
                      <div class="card-actions">
                        <button type="button" class="action-link" (click)="alterarStatus(t, 'NOTIFICADO')">
                          Notificar
                        </button>
                        <button type="button" class="action-link muted" (click)="alterarStatus(t, 'CANCELADO')">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </article>
                } @empty {
                  <div class="empty-state">Nenhuma tarefa pendente</div>
                }
              </div>
            </div>

            <div class="kanban-column">
              <div class="column-header">
                <div class="column-title">
                  <span class="dot dot-notified"></span>
                  <h3>Notificadas</h3>
                </div>
                <span class="column-count">{{ store.notificadas().length }}</span>
              </div>

              <div class="column-cards">
                @for (t of store.notificadas(); track t.id) {
                  <article class="task-card">
                    <div class="card-top">
                      <span class="status-tag tag-notified">Notificado</span>
                      <button
                        type="button"
                        class="icon-delete"
                        title="Excluir tarefa"
                        (click)="removerTarefa(t)"
                      >
                        ✕
                      </button>
                    </div>
                    <h4>{{ t.nomeTarefa }}</h4>
                    @if (t.descricao) {
                      <p>{{ t.descricao }}</p>
                    }
                    <div class="card-footer">
                      <time class="timestamp">{{ t.dataEvento }}</time>
                      <div class="card-actions">
                        <button type="button" class="action-link muted" (click)="alterarStatus(t, 'PENDENTE')">
                          Reabrir
                        </button>
                      </div>
                    </div>
                  </article>
                } @empty {
                  <div class="empty-state">Nenhuma tarefa notificada</div>
                }
              </div>
            </div>

            <div class="kanban-column">
              <div class="column-header">
                <div class="column-title">
                  <span class="dot dot-canceled"></span>
                  <h3>Canceladas</h3>
                </div>
                <span class="column-count">{{ store.canceladas().length }}</span>
              </div>

              <div class="column-cards">
                @for (t of store.canceladas(); track t.id) {
                  <article class="task-card card-muted">
                    <div class="card-top">
                      <span class="status-tag tag-canceled">Cancelado</span>
                      <button
                        type="button"
                        class="icon-delete"
                        title="Excluir tarefa"
                        (click)="removerTarefa(t)"
                      >
                        ✕
                      </button>
                    </div>
                    <h4>{{ t.nomeTarefa }}</h4>
                    @if (t.descricao) {
                      <p>{{ t.descricao }}</p>
                    }
                    <div class="card-footer">
                      <time class="timestamp">{{ t.dataEvento }}</time>
                      <div class="card-actions">
                        <button type="button" class="action-link muted" (click)="alterarStatus(t, 'PENDENTE')">
                          Restaurar
                        </button>
                      </div>
                    </div>
                  </article>
                } @empty {
                  <div class="empty-state">Nenhuma tarefa cancelada</div>
                }
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #fafafa;
      color: #18181b;
    }
    .topbar {
      height: 54px;
      background: #ffffff;
      border-bottom: 1px solid #e4e4e7;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .topbar-inner {
      max-width: 1360px;
      height: 100%;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.875rem;
    }
    .brand-mark {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: #18181b;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .brand-name {
      font-weight: 600;
      letter-spacing: -0.01em;
      color: #18181b;
    }
    .brand-divider {
      color: #d4d4d8;
    }
    .brand-context {
      color: #71717a;
      font-weight: 400;
    }
    .topbar-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .api-indicator {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.72rem;
      color: #71717a;
      background: #f4f4f5;
      border: 1px solid #e4e4e7;
      padding: 3px 8px;
      border-radius: 4px;
    }
    .session-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.78rem;
      font-weight: 500;
      background: #f4f4f5;
      color: #52525b;
      border: 1px solid #e4e4e7;
    }
    .session-pill .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #a1a1aa;
    }
    .session-pill.online {
      background: #ecfdf5;
      color: #065f46;
      border-color: #a7f3d0;
    }
    .session-pill.online .status-dot {
      background: #10b981;
    }
    .btn-ghost-sm {
      background: transparent;
      border: 1px solid #e4e4e7;
      color: #52525b;
      font-size: 0.75rem;
      font-weight: 500;
      padding: 4px 10px;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn-ghost-sm:hover {
      background: #f4f4f5;
      color: #18181b;
    }
    .toast-bar {
      max-width: 1312px;
      margin: 16px auto 0;
      width: calc(100% - 48px);
      background: #ffffff;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      padding: 10px 14px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.82rem;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }
    .toast-content {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .toast-indicator {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10b981;
    }
    .toast-bar.toast-error {
      border-color: #fecaca;
      background: #fef2f2;
      color: #991b1b;
    }
    .toast-bar.toast-error .toast-indicator {
      background: #ef4444;
    }
    .toast-close {
      background: transparent;
      border: none;
      color: #71717a;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
    }
    .workspace {
      max-width: 1360px;
      width: 100%;
      margin: 0 auto;
      padding: 24px;
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 28px;
      align-items: start;
    }
    @media (max-width: 980px) {
      .workspace {
        grid-template-columns: 1fr;
      }
    }
    .sidebar {
      background: #ffffff;
      border: 1px solid #e4e4e7;
      border-radius: 10px;
      padding: 16px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
    }
    .segmented-control {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      background: #f4f4f5;
      padding: 3px;
      border-radius: 7px;
      margin-bottom: 18px;
    }
    .segmented-control button {
      border: none;
      background: transparent;
      padding: 6px 8px;
      font-size: 0.78rem;
      font-weight: 500;
      color: #71717a;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .segmented-control button.active {
      background: #ffffff;
      color: #18181b;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
    }
    .panel-header {
      margin-bottom: 16px;
    }
    .panel-header h2 {
      margin: 0 0 4px;
      font-size: 0.95rem;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .panel-header p {
      margin: 0;
      font-size: 0.78rem;
      color: #71717a;
      line-height: 1.45;
    }
    form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .field-label {
      font-size: 0.78rem;
      font-weight: 500;
      color: #3f3f46;
    }
    .field-hint {
      font-size: 0.72rem;
      color: #a1a1aa;
    }
    input, textarea {
      width: 100%;
      padding: 8px 11px;
      border-radius: 6px;
      border: 1px solid #e4e4e7;
      background: #ffffff;
      color: #18181b;
      font-size: 0.85rem;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    input::placeholder, textarea::placeholder {
      color: #a1a1aa;
    }
    input:focus, textarea:focus {
      outline: none;
      border-color: #18181b;
      box-shadow: 0 0 0 2px rgba(24, 24, 27, 0.06);
    }
    .mono-input {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
    }
    .inline-group {
      display: flex;
      gap: 6px;
    }
    .grid-2-asym {
      display: grid;
      grid-template-columns: 1fr 76px;
      gap: 8px;
    }
    .grid-phone {
      display: grid;
      grid-template-columns: 64px 1fr;
      gap: 8px;
    }
    .divider {
      display: flex;
      align-items: center;
      margin: 4px 0 2px;
      font-size: 0.72rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #a1a1aa;
    }
    .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: #f4f4f5;
      margin-left: 8px;
    }
    .btn-primary {
      margin-top: 4px;
      background: #18181b;
      color: #ffffff;
      border: 1px solid #18181b;
      padding: 9px 14px;
      border-radius: 6px;
      font-size: 0.84rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn-primary:hover {
      background: #27272a;
    }
    .btn-secondary {
      background: #f4f4f5;
      color: #18181b;
      border: 1px solid #e4e4e7;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s ease;
    }
    .btn-secondary:hover {
      background: #e4e4e7;
    }
    .board-section {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .board-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      padding-bottom: 14px;
      border-bottom: 1px solid #e4e4e7;
    }
    .board-header h1 {
      margin: 0 0 4px;
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }
    .board-subtitle {
      margin: 0;
      font-size: 0.82rem;
      color: #71717a;
    }
    .stat-item {
      font-size: 0.8rem;
      color: #71717a;
      background: #ffffff;
      border: 1px solid #e4e4e7;
      padding: 5px 11px;
      border-radius: 6px;
    }
    .stat-item strong {
      color: #18181b;
      font-weight: 600;
    }
    .kanban-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      align-items: start;
    }
    @media (max-width: 760px) {
      .kanban-grid {
        grid-template-columns: 1fr;
      }
    }
    .kanban-column {
      background: #f4f4f5;
      border: 1px solid #e4e4e7;
      border-radius: 10px;
      padding: 12px;
      min-height: 420px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .column-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 2px 4px 6px;
    }
    .column-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .column-title h3 {
      margin: 0;
      font-size: 0.82rem;
      font-weight: 600;
      color: #27272a;
      letter-spacing: -0.01em;
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }
    .dot-pending { background: #d97706; }
    .dot-notified { background: #059669; }
    .dot-canceled { background: #71717a; }
    .column-count {
      font-size: 0.74rem;
      font-weight: 500;
      color: #71717a;
      background: #e4e4e7;
      padding: 1px 7px;
      border-radius: 999px;
      font-variant-numeric: tabular-nums;
    }
    .column-cards {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .empty-state {
      border: 1px dashed #d4d4d8;
      border-radius: 8px;
      padding: 28px 12px;
      text-align: center;
      font-size: 0.78rem;
      color: #a1a1aa;
    }
    .task-card {
      background: #ffffff;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      padding: 13px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }
    .task-card:hover {
      border-color: #d4d4d8;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.04);
    }
    .task-card.card-muted {
      opacity: 0.72;
    }
    .card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .status-tag {
      font-size: 0.68rem;
      font-weight: 500;
      padding: 2px 7px;
      border-radius: 4px;
      letter-spacing: 0.01em;
    }
    .tag-pending {
      background: #fef3c7;
      color: #92400e;
    }
    .tag-notified {
      background: #d1fae5;
      color: #065f46;
    }
    .tag-canceled {
      background: #f4f4f5;
      color: #52525b;
    }
    .icon-delete {
      background: transparent;
      border: none;
      color: #a1a1aa;
      font-size: 0.72rem;
      padding: 2px 5px;
      border-radius: 4px;
      cursor: pointer;
      transition: color 0.15s ease, background 0.15s ease;
    }
    .icon-delete:hover {
      color: #dc2626;
      background: #fef2f2;
    }
    .task-card h4 {
      margin: 0 0 5px;
      font-size: 0.88rem;
      font-weight: 600;
      color: #18181b;
      line-height: 1.35;
    }
    .task-card p {
      margin: 0 0 12px;
      font-size: 0.8rem;
      color: #52525b;
      line-height: 1.45;
    }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 9px;
      border-top: 1px solid #f4f4f5;
      gap: 8px;
      flex-wrap: wrap;
    }
    .timestamp {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.71rem;
      color: #71717a;
      font-variant-numeric: tabular-nums;
    }
    .card-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .action-link {
      background: transparent;
      border: none;
      padding: 2px 4px;
      font-size: 0.75rem;
      font-weight: 500;
      color: #18181b;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.15s ease;
    }
    .action-link:hover {
      background: #f4f4f5;
    }
    .action-link.muted {
      color: #71717a;
    }
    .action-link.muted:hover {
      color: #18181b;
    }
  `]
})
export class KanbanAgendadorComponent {
  readonly store = inject(AgendadorStoreService);
  readonly painelAtivo = signal<PainelLateral>('tarefa');

  usuario = {
    nome: '',
    email: '',
    senha: '',
    cep: '',
    rua: '',
    numero: 100,
    complemento: '',
    cidade: '',
    estado: '',
    ddd: '11',
    telefone: ''
  };

  credenciais = {
    email: '',
    senha: ''
  };

  novaTarefa = {
    nomeTarefa: '',
    descricao: '',
    dataEvento: '25-11-2026 14:00:00'
  };

  buscarCep(): void {
    if (!this.usuario.cep) return;
    this.store.buscarCep(this.usuario.cep).subscribe(dados => {
      if (dados) {
        this.usuario.rua = dados.logradouro ?? '';
        this.usuario.cidade = dados.localidade ?? '';
        this.usuario.estado = dados.uf ?? '';
      }
    });
  }

  salvarUsuario(): void {
    if (!this.usuario.nome || !this.usuario.email || !this.usuario.senha) {
      this.store.notificar('Preencha nome, e-mail e senha.', true);
      return;
    }

    this.store
      .cadastrarUsuario({
        nome: this.usuario.nome,
        email: this.usuario.email,
        senha: this.usuario.senha,
        enderecos: this.usuario.rua
          ? [{
              rua: this.usuario.rua,
              numero: Number(this.usuario.numero) || 0,
              complemento: this.usuario.complemento,
              cidade: this.usuario.cidade,
              estado: this.usuario.estado,
              cep: this.usuario.cep
            }]
          : [],
        telefones: this.usuario.telefone
          ? [{
              ddd: this.usuario.ddd,
              numero: this.usuario.telefone
            }]
          : []
      })
      .subscribe(sucesso => {
        if (sucesso) {
          this.credenciais.email = this.usuario.email;
          this.credenciais.senha = this.usuario.senha;
          this.painelAtivo.set('acesso');
        }
      });
  }

  realizarLogin(): void {
    if (!this.credenciais.email || !this.credenciais.senha) {
      this.store.notificar('Informe e-mail e senha para autenticar.', true);
      return;
    }

    this.store.login(this.credenciais).subscribe(sucesso => {
      if (sucesso) {
        this.painelAtivo.set('tarefa');
      }
    });
  }

  adicionarTarefa(): void {
    if (!this.novaTarefa.nomeTarefa || !this.novaTarefa.dataEvento) return;
    this.store.adicionarTarefa({ ...this.novaTarefa });
    this.novaTarefa = { nomeTarefa: '', descricao: '', dataEvento: '25-11-2026 14:00:00' };
  }

  alterarStatus(tarefa: TarefaKanban, novoStatus: StatusTarefa): void {
    this.store.alterarStatus(tarefa.id, novoStatus);
  }

  removerTarefa(tarefa: TarefaKanban): void {
    this.store.removerTarefa(tarefa.id);
  }
}
