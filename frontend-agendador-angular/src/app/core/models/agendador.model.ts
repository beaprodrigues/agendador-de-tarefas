export type StatusTarefa = 'PENDENTE' | 'NOTIFICADO' | 'CANCELADO';

export interface TarefaKanban {
  readonly id: string;
  nomeTarefa: string;
  descricao: string;
  dataEvento: string;
  statusNotificacaoEnum: StatusTarefa;
}

export interface NovaTarefaRequest {
  nomeTarefa: string;
  descricao: string;
  dataEvento: string;
}

export interface EnderecoRequest {
  rua: string;
  numero: number;
  complemento: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface TelefoneRequest {
  ddd: string;
  numero: string;
}

export interface UsuarioCadastroRequest {
  nome: string;
  email: string;
  senha: string;
  enderecos: EnderecoRequest[];
  telefones: TelefoneRequest[];
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface ViaCepResponse {
  readonly cep: string;
  readonly logradouro: string;
  readonly complemento: string;
  readonly bairro: string;
  readonly localidade: string;
  readonly uf: string;
}
