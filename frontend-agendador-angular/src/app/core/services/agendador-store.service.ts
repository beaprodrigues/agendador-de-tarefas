import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import {
  LoginRequest,
  NovaTarefaRequest,
  StatusTarefa,
  TarefaKanban,
  UsuarioCadastroRequest,
  ViaCepResponse
} from '../models/agendador.model';

const TAREFAS_INICIAIS: TarefaKanban[] = [
  {
    id: '1',
    nomeTarefa: 'Revisão de contrato de API no BFF',
    descricao: 'Validar mapeamento de exceções Feign e autenticação Bearer nos endpoints de tarefas.',
    dataEvento: '26-11-2026 10:00:00',
    statusNotificacaoEnum: 'PENDENTE'
  },
  {
    id: '2',
    nomeTarefa: 'Configurar índice composto no MongoDB',
    descricao: 'Otimizar consulta por intervalo de dataEvento e statusNotificacaoEnum para o job agendado.',
    dataEvento: '26-11-2026 15:30:00',
    statusNotificacaoEnum: 'PENDENTE'
  },
  {
    id: '3',
    nomeTarefa: 'Integração SMTP com template Thymeleaf',
    descricao: 'Disparo automático de lembretes transacionais uma hora antes do evento.',
    dataEvento: '25-11-2026 18:00:00',
    statusNotificacaoEnum: 'NOTIFICADO'
  }
];

@Injectable({ providedIn: 'root' })
export class AgendadorStoreService {
  private readonly http = inject(HttpClient);
  private readonly bffUrl = 'http://localhost:8083';

  private readonly _tarefas = signal<TarefaKanban[]>(TAREFAS_INICIAIS);
  private readonly _jwtToken = signal<string>(localStorage.getItem('agendador_jwt') ?? '');
  private readonly _usuarioEmail = signal<string>(localStorage.getItem('agendador_email') ?? '');
  private readonly _feedback = signal<{ mensagem: string; erro: boolean } | null>(null);

  readonly tarefas = this._tarefas.asReadonly();
  readonly jwtToken = this._jwtToken.asReadonly();
  readonly usuarioEmail = this._usuarioEmail.asReadonly();
  readonly feedback = this._feedback.asReadonly();

  readonly autenticado = computed(() => this._jwtToken().length > 0);
  readonly totalTarefas = computed(() => this._tarefas().length);
  readonly pendentes = computed(() =>
    this._tarefas().filter(t => t.statusNotificacaoEnum === 'PENDENTE')
  );
  readonly notificadas = computed(() =>
    this._tarefas().filter(t => t.statusNotificacaoEnum === 'NOTIFICADO')
  );
  readonly canceladas = computed(() =>
    this._tarefas().filter(t => t.statusNotificacaoEnum === 'CANCELADO')
  );

  constructor() {
    if (this.autenticado()) {
      this.carregarTarefas();
    }
  }

  notificar(mensagem: string, erro = false): void {
    this._feedback.set({ mensagem, erro });
  }

  limparFeedback(): void {
    this._feedback.set(null);
  }

  carregarTarefas(): void {
    if (!this.autenticado()) return;

    this.http
      .get<TarefaKanban[]>(`${this.bffUrl}/tarefas`)
      .pipe(catchError(() => of(null)))
      .subscribe(lista => {
        if (lista) {
          this._tarefas.set(lista);
        }
      });
  }

  buscarCep(cep: string): Observable<ViaCepResponse | null> {
    return this.http.get<ViaCepResponse>(`${this.bffUrl}/usuario/endereco/${cep}`).pipe(
      tap(() => this.notificar('Endereço preenchido via ViaCEP.')),
      catchError(err => {
        const msg = typeof err?.error === 'string' ? err.error : 'BFF indisponível na porta 8083.';
        this.notificar(msg, true);
        return of(null);
      })
    );
  }

  cadastrarUsuario(payload: UsuarioCadastroRequest): Observable<boolean> {
    return this.http.post(`${this.bffUrl}/usuario`, payload).pipe(
      tap(() => this.notificar('Conta criada com sucesso. Faça login para continuar.')),
      map(() => true),
      catchError(err => {
        const msg = typeof err?.error === 'string' ? err.error : 'BFF offline em http://localhost:8083.';
        this.notificar(msg, true);
        return of(false);
      })
    );
  }

  login(credenciais: LoginRequest): Observable<boolean> {
    return this.http
      .post(`${this.bffUrl}/usuario/login`, credenciais, { responseType: 'text' })
      .pipe(
        tap(rawToken => {
          const token = rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`;
          this._jwtToken.set(token);
          this._usuarioEmail.set(credenciais.email);
          localStorage.setItem('agendador_jwt', token);
          localStorage.setItem('agendador_email', credenciais.email);
          this.notificar('Sessão autenticada.');
          this.carregarTarefas();
        }),
        map(() => true),
        catchError(err => {
          const msg = typeof err?.error === 'string' ? err.error : 'Não foi possível autenticar no BFF.';
          this.notificar(msg, true);
          return of(false);
        })
      );
  }

  logout(): void {
    this._jwtToken.set('');
    this._usuarioEmail.set('');
    localStorage.removeItem('agendador_jwt');
    localStorage.removeItem('agendador_email');
    this.notificar('Sessão encerrada.');
  }

  adicionarTarefa(payload: NovaTarefaRequest): void {
    const tarefaLocal: TarefaKanban = {
      id: Date.now().toString(),
      nomeTarefa: payload.nomeTarefa,
      descricao: payload.descricao,
      dataEvento: payload.dataEvento,
      statusNotificacaoEnum: 'PENDENTE'
    };

    if (!this.autenticado()) {
      this._tarefas.update(lista => [...lista, tarefaLocal]);
      this.notificar('Tarefa adicionada ao quadro.');
      return;
    }

    this.http
      .post<TarefaKanban>(`${this.bffUrl}/tarefas`, payload)
      .pipe(catchError(() => of(null)))
      .subscribe(criada => {
        if (criada) {
          this._tarefas.update(lista => [...lista, criada]);
          this.notificar('Tarefa sincronizada com o BFF.');
        } else {
          this._tarefas.update(lista => [...lista, tarefaLocal]);
          this.notificar('Tarefa adicionada localmente.');
        }
      });
  }

  alterarStatus(id: string, novoStatus: StatusTarefa): void {
    this._tarefas.update(lista =>
      lista.map(t => (t.id === id ? { ...t, statusNotificacaoEnum: novoStatus } : t))
    );

    if (!this.autenticado()) return;

    this.http
      .patch<TarefaKanban>(`${this.bffUrl}/tarefas`, null, {
        params: { status: novoStatus, id }
      })
      .pipe(catchError(() => of(null)))
      .subscribe();
  }

  removerTarefa(id: string): void {
    this._tarefas.update(lista => lista.filter(t => t.id !== id));

    if (!this.autenticado()) return;

    this.http
      .delete(`${this.bffUrl}/tarefas`, { params: { id } })
      .pipe(catchError(() => of(null)))
      .subscribe();
  }
}
