import axios from "axios";
import type {
  Usuario,
  Categoria,
  Curso,
  Modulo,
  Aula,
  Matricula,
  ProgressoAula,
  Avaliacao,
  Trilha,
  TrilhaCurso,
  Certificado,
  Plano,
  Assinatura,
  Pagamento,
} from "../types";

const API_URL = "http://localhost:3001";

const client = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper helper to generate IDs (for JSON Server compatibility)
const generateId = () => Math.floor(Math.random() * 1000000) + 1;

export const api = {
  // --- USUARIOS ---

  createUsuario: (
    data: Omit<Usuario, "id" | "ID_Usuario" | "DataCadastro">,
  ) => {
    const id = generateId();
    const newUser: Usuario = {
      ...data,
      id,
      ID_Usuario: id,
      DataCadastro: new Date().toISOString(),
    };
    return client.post<Usuario>("/usuarios", newUser).then((r) => r.data);
  },
  updateUsuario: (id: number | string, data: Partial<Usuario>) =>
    client.patch<Usuario>(`/usuarios/${id}`, data).then((r) => r.data),
  deleteUsuario: (id: number | string) =>
    client.delete(`/usuarios/${id}`).then(() => id),
  getUsuarios: () => client.get<Usuario[]>("/usuarios").then((r) => r.data),
  getUsuarioById: (id: number | string) =>
    client.get<Usuario>(`/usuarios/${id}`).then((r) => r.data),

  // --- CATEGORIAS ---
  getCategorias: () =>
    client.get<Categoria[]>("/categorias").then((r) => r.data),
  createCategoria: async function (
    data: Omit<Categoria, "id" | "ID_Categoria">,
  ) {
    const id = generateId();
    const newCat: Categoria = {
      ...data,
      id,
      ID_Categoria: id,
    };
    console.log(newCat);
    const r = await client.post<Categoria>("/categorias", newCat);
    return r.data;
  },
  updateCategoria: (id: number | string, data: Partial<Categoria>) =>
    client.patch<Categoria>(`/categorias/${id}`, data).then((r) => r.data),
  deleteCategoria: (id: number | string) =>
    client.delete(`/categorias/${id}`).then(() => id),

  // --- CURSOS ---
  getCursos: () => client.get<Curso[]>("/cursos").then((r) => r.data),
  getCursoById: (id: number | string) =>
    client.get<Curso>(`/cursos/${id}`).then((r) => r.data),
  createCurso: (
    data: Omit<
      Curso,
      "id" | "ID_Curso" | "DataPublicacao" | "TotalAulas" | "TotalHoras"
    >,
  ) => {
    const id = generateId();
    const newCurso: Curso = {
      ...data,
      id,
      ID_Curso: id,
      DataPublicacao: new Date().toISOString().split("T")[0],
      TotalAulas: 0,
      TotalHoras: 0,
    };
    return client.post<Curso>("/cursos", newCurso).then((r) => r.data);
  },
  updateCurso: (id: number | string, data: Partial<Curso>) =>
    client.patch<Curso>(`/cursos/${id}`, data).then((r) => r.data),
  deleteCurso: (id: number | string) =>
    client.delete(`/cursos/${id}`).then(() => id),

  // --- MODULOS ---
  getModulos: () => client.get<Modulo[]>("/modulos").then((r) => r.data),
  getModulosByCurso: (cursoId: number) =>
    client.get<Modulo[]>(`/modulos?ID_Curso=${cursoId}`).then((r) => r.data),
  createModulo: (data: Omit<Modulo, "id" | "ID_Modulo">) => {
    const id = generateId();
    const newMod: Modulo = {
      ...data,
      id,
      ID_Modulo: id,
    };
    return client.post<Modulo>("/modulos", newMod).then((r) => r.data);
  },
  updateModulo: (id: number | string, data: Partial<Modulo>) =>
    client.patch<Modulo>(`/modulos/${id}`, data).then((r) => r.data),
  deleteModulo: (id: number | string) =>
    client.delete(`/modulos/${id}`).then(() => id),

  // --- AULAS ---
  getAulas: () => client.get<Aula[]>("/aulas").then((r) => r.data),
  getAulasByModulo: (moduloId: number) =>
    client.get<Aula[]>(`/aulas?ID_Modulo=${moduloId}`).then((r) => r.data),
  createAula: (data: Omit<Aula, "id" | "ID_Aula">) => {
    const id = generateId();
    const newAula: Aula = {
      ...data,
      id,
      ID_Aula: id,
    };
    return client.post<Aula>("/aulas", newAula).then((r) => r.data);
  },
  updateAula: (id: number | string, data: Partial<Aula>) =>
    client.patch<Aula>(`/aulas/${id}`, data).then((r) => r.data),
  deleteAula: (id: number | string) =>
    client.delete(`/aulas/${id}`).then(() => id),

  // --- MATRICULAS ---
  getMatriculas: () =>
    client.get<Matricula[]>("/matriculas").then((r) => r.data),
  getMatriculasByUser: (usuarioId: number) =>
    client
      .get<Matricula[]>(`/matriculas?ID_Usuario=${usuarioId}`)
      .then((r) => r.data),
  createMatricula: (usuarioId: number, cursoId: number) => {
    const id = generateId();
    const newMatricula: Matricula = {
      id,
      ID_Matricula: id,
      ID_Usuario: usuarioId,
      ID_Curso: cursoId,
      DataMatricula: new Date().toISOString(),
      DataConclusao: null,
    };
    return client
      .post<Matricula>("/matriculas", newMatricula)
      .then((r) => r.data);
  },
  concluirMatricula: (id: number) =>
    client
      .patch<Matricula>(`/matriculas/${id}`, {
        DataConclusao: new Date().toISOString(),
      })
      .then((r) => r.data),

  // --- PROGRESSO AULAS ---
  getProgressoAulas: () =>
    client.get<ProgressoAula[]>("/progresso_aulas").then((r) => r.data),
  getProgressoByUser: (usuarioId: number) =>
    client
      .get<ProgressoAula[]>(`/progresso_aulas?ID_Usuario=${usuarioId}`)
      .then((r) => r.data),
  toggleProgressoAula: (
    usuarioId: number,
    aulaId: number,
    concluido: boolean,
  ) => {
    const idStr = `${usuarioId}_${aulaId}`;
    if (concluido) {
      const newProgresso: ProgressoAula = {
        id: idStr,
        ID_Usuario: usuarioId,
        ID_Aula: aulaId,
        DataConclusao: new Date().toISOString(),
        Status: "Concluído",
      };
      return client
        .post<ProgressoAula>("/progresso_aulas", newProgresso)
        .then((r) => r.data)
        .catch((err) => {
          if (err.response && err.response.status === 500) {
            return client
              .get<ProgressoAula>(`/progresso_aulas/${idStr}`)
              .then((r) => r.data);
          }
          throw err;
        });
    } else {
      return client.delete(`/progresso_aulas/${idStr}`).then(() => null);
    }
  },

  // --- AVALIACOES ---
  getAvaliacoes: () =>
    client.get<Avaliacao[]>("/avaliacoes").then((r) => r.data),
  getAvaliacoesByCurso: (cursoId: number) =>
    client
      .get<Avaliacao[]>(`/avaliacoes?ID_Curso=${cursoId}`)
      .then((r) => r.data),
  createAvaliacao: (
    data: Omit<Avaliacao, "id" | "ID_Avaliacao" | "DataAvaliacao">,
  ) => {
    const id = generateId();
    const newVal: Avaliacao = {
      ...data,
      id,
      ID_Avaliacao: id,
      DataAvaliacao: new Date().toISOString(),
    };
    return client.post<Avaliacao>("/avaliacoes", newVal).then((r) => r.data);
  },

  // --- TRILHAS ---
  getTrilhas: () => client.get<Trilha[]>("/trilhas").then((r) => r.data),
  createTrilha: (data: Omit<Trilha, "id" | "ID_Trilha">) => {
    const id = generateId();
    const newTrilha: Trilha = {
      ...data,
      id,
      ID_Trilha: id,
    };
    return client.post<Trilha>("/trilhas", newTrilha).then((r) => r.data);
  },
  updateTrilha: (id: number | string, data: Partial<Trilha>) =>
    client.patch<Trilha>(`/trilhas/${id}`, data).then((r) => r.data),

  deleteTrilha: (id: number | string) =>
    client.delete(`/trilhas/${id}`).then(() => id),

  // --- TRILHAS CURSOS ---
  getTrilhasCursos: () =>
    client.get<TrilhaCurso[]>("/trilhas_cursos").then((r) => r.data),
  vincularCursoTrilha: (trilhaId: number, cursoId: number, ordem: number) => {
    const idStr = `${trilhaId}_${cursoId}`;
    const newTC: TrilhaCurso = {
      id: idStr,
      ID_Trilha: trilhaId,
      ID_Curso: cursoId,
      Ordem: ordem,
    };
    return client
      .post<TrilhaCurso>("/trilhas_cursos", newTC)
      .then((r) => r.data);
  },
  desvincularCursoTrilha: (trilhaId: number, cursoId: number) => {
    const idStr = `${trilhaId}_${cursoId}`;
    return client.delete(`/trilhas_cursos/${idStr}`).then(() => idStr);
  },

  // --- CERTIFICADOS ---
  getCertificados: () =>
    client.get<Certificado[]>("/certificados").then((r) => r.data),
  getCertificadosByUser: (usuarioId: number) =>
    client
      .get<Certificado[]>(`/certificados?ID_Usuario=${usuarioId}`)
      .then((r) => r.data),
  validarCertificado: (codigo: string) =>
    client
      .get<Certificado[]>(`/certificados?CodigoVerificacao=${codigo}`)
      .then((r) => r.data),
  emitirCertificado: (
    data: Omit<
      Certificado,
      "id" | "ID_Certificado" | "CodigoVerificacao" | "DataEmissao"
    >,
  ) => {
    const id = generateId();
    const randomHex = Math.random().toString(16).substring(2, 10).toUpperCase();
    const codigo = `CERT-${data.ID_Curso ? "CRS" : "TRL"}-${randomHex}`;
    const newCert: Certificado = {
      ...data,
      id,
      ID_Certificado: id,
      CodigoVerificacao: codigo,
      DataEmissao: new Date().toISOString(),
    };
    return client
      .post<Certificado>("/certificados", newCert)
      .then((r) => r.data);
  },

  // --- PLANOS ---
  getPlanos: () => client.get<Plano[]>("/planos").then((r) => r.data),

  // --- ASSINATURAS ---
  getAssinaturas: () =>
    client.get<Assinatura[]>("/assinaturas").then((r) => r.data),
  createAssinatura: (
    usuarioId: number,
    planoId: number,
    duracaoMeses: number,
  ) => {
    const id = generateId();
    const dataInicio = new Date();
    const dataFim = new Date();
    dataFim.setMonth(dataFim.getMonth() + duracaoMeses);
    const newAssinatura: Assinatura = {
      id,
      ID_Assinatura: id,
      ID_Usuario: usuarioId,
      ID_Plano: planoId,
      DataInicio: dataInicio.toISOString().split("T")[0],
      DataFim: dataFim.toISOString().split("T")[0],
    };
    return client
      .post<Assinatura>("/assinaturas", newAssinatura)
      .then((r) => r.data);
  },

  // --- PAGAMENTOS ---
  getPagamentos: () =>
    client.get<Pagamento[]>("/pagamentos").then((r) => r.data),
  createPagamento: (assinaturaId: number, valor: number, metodo: string) => {
    const id = generateId();
    const gatewayId = "pay_tx_" + Math.random().toString(36).substring(2, 14);
    const newPagamento: Pagamento = {
      id,
      ID_Pagamento: id,
      ID_Assinatura: assinaturaId,
      ValorPago: valor,
      DataPagamento: new Date().toISOString(),
      MetodoPagamento: metodo,
      Id_Transacao_Gateway: gatewayId,
    };
    return client
      .post<Pagamento>("/pagamentos", newPagamento)
      .then((r) => r.data);
  },
};
