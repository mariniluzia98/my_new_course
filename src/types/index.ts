export interface Usuario {
  id: number;
  ID_Usuario: number;
  NomeCompleto: string;
  Email: string;
  SenhaHash: string;
  DataCadastro: string;
  Cargo: 'Aluno' | 'Instrutor' | 'Admin';
}

export interface Categoria {
  id: number;
  ID_Categoria: number;
  Nome: string;
  Descricao: string;
}

export interface Curso {
  id: number;
  ID_Curso: number;
  Titulo: string;
  Descricao: string;
  ID_Instrutor: number;
  ID_Categoria: number;
  Nivel: 'Iniciante' | 'Intermediário' | 'Avançado';
  DataPublicacao: string;
  TotalAulas: number;
  TotalHoras: number;
}

export interface Modulo {
  id: number;
  ID_Modulo: number;
  ID_Curso: number;
  Titulo: string;
  Ordem: number;
}

export interface Aula {
  id: number;
  ID_Aula: number;
  ID_Modulo: number;
  Titulo: string;
  TipoConteudo: 'Vídeo' | 'Texto' | 'Quiz';
  URL_Conteudo: string;
  DuracaoMinutos: number;
  Ordem: number;
}

export interface Matricula {
  id: number;
  ID_Matricula: number;
  ID_Usuario: number;
  ID_Curso: number;
  DataMatricula: string;
  DataConclusao: string | null;
}

export interface ProgressoAula {
  id: string; // "usuarioId_aulaId"
  ID_Usuario: number;
  ID_Aula: number;
  DataConclusao: string;
  Status: 'Concluído';
}

export interface Avaliacao {
  id: number;
  ID_Avaliacao: number;
  ID_Usuario: number;
  ID_Curso: number;
  Nota: number; // 1 a 5
  Comentario: string | null;
  DataAvaliacao: string;
}

export interface Trilha {
  id: number;
  ID_Trilha: number;
  Titulo: string;
  Descricao: string;
  ID_Categoria: number;
}

export interface TrilhaCurso {
  id: string; // "trilhaId_cursoId"
  ID_Trilha: number;
  ID_Curso: number;
  Ordem: number;
}

export interface Certificado {
  id: number;
  ID_Certificado: number;
  ID_Usuario: number;
  ID_Curso: number | null;
  ID_Trilha: number | null;
  CodigoVerificacao: string;
  DataEmissao: string;
}

export interface Plano {
  id: number;
  ID_Plano: number;
  Nome: string;
  Descricao: string;
  Preco: number;
  DuracaoMeses: number;
}

export interface Assinatura {
  id: number;
  ID_Assinatura: number;
  ID_Usuario: number;
  ID_Plano: number;
  DataInicio: string;
  DataFim: string;
}

export interface Pagamento {
  id: number;
  ID_Pagamento: number;
  ID_Assinatura: number;
  ValorPago: number;
  DataPagamento: string;
  MetodoPagamento: string;
  Id_Transacao_Gateway: string;
}
