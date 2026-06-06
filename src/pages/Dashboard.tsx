import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useActiveUser } from "../context/useActiveUser";
import { api } from "../types";
import type {
  Matricula,
  Certificado,
  Categoria,
  ProgressoAula,
  Modulo,
  Aula,
  Curso,
  Pagamento,
} from "../types";
import { CardCurso } from "../components/CardCurso";

export const Dashboard: React.FC = () => {
  const { currentUser } = useActiveUser();
  const navigate = useNavigate();

  const [cursos, setCursos] = useState<Curso[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [progressos, setProgressos] = useState<ProgressoAula[]>([]);
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [recentPayments, setRecentPayments] = useState<Pagamento[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);

  // Global counts for admin/instructor dashboard
  const [stats, setStats] = useState({
    totalAlunos: 0,
    totalCursos: 0,
    totalReceita: 0,
    totalCertificados: 0,
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const [
          allCursos,
          allCategorias,
          allMatriculas,
          allProgressos,
          allCertificados,
          allPagamentos,
          allUsuarios,
          allModulos,
          allAulas,
        ] = await Promise.all([
          api.getCursos(),
          api.getCategorias(),
          api.getMatriculas(),
          api.getProgressoAulas(),
          api.getCertificados(),
          api.getPagamentos(),
          api.getUsuarios(),
          api.getModulos(),
          api.getAulas(),
        ]);

        setCursos(allCursos);
        setCategorias(allCategorias);
        setMatriculas(allMatriculas);
        setProgressos(allProgressos);
        setCertificados(allCertificados);
        setRecentPayments(allPagamentos);
        setModulos(allModulos);
        setAulas(allAulas);

        // Calculate stats for admin/instructor
        const totalReceita = allPagamentos.reduce(
          (acc, curr) => acc + curr.ValorPago,
          0,
        );
        const alunosCount = allUsuarios.filter(
          (u) => u.Cargo === "Aluno",
        ).length;

        setStats({
          totalAlunos: alunosCount,
          totalCursos: allCursos.length,
          totalReceita,
          totalCertificados: allCertificados.length,
        });
      } catch (err) {
        console.error("Erro ao buscar dados do dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  // Filter logic based on role
  const isStudent = currentUser?.Cargo === "Aluno";

  // Student metrics
  const minhasMatriculas = matriculas.filter(
    (m) => m.ID_Usuario === currentUser?.ID_Usuario,
  );
  const meusCertificados = certificados.filter(
    (c) => c.ID_Usuario === currentUser?.ID_Usuario,
  );

  // Helper to calculate course progress
  const getCourseProgress = (cursoId: number) => {
    const courseMods = modulos
      .filter((m) => m.ID_Curso === cursoId)
      .map((m) => m.ID_Modulo);
    const courseAulas = aulas.filter((a) => courseMods.includes(a.ID_Modulo));

    if (courseAulas.length === 0) return 0;

    const completedCount = progressos.filter(
      (p) =>
        p.ID_Usuario === currentUser?.ID_Usuario &&
        courseAulas.some((a) => a.ID_Aula === p.ID_Aula),
    ).length;

    return (completedCount / courseAulas.length) * 100;
  };

  return (
    <div className="container">
      {/* Header Widget */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="glass-panel p-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <span className="text-secondary uppercase tracking-widest fs-8 mb-1 d-block">
                Bem-vindo de volta
              </span>
              <h2 className="text-white fw-bold mb-0">
                Olá, {currentUser?.NomeCompleto}!
              </h2>
              <p className="text-secondary fs-7 mb-0">
                Painel do{" "}
                {currentUser?.Cargo === "Aluno"
                  ? "Estudante"
                  : currentUser?.Cargo}
              </p>
            </div>
            <div>
              <Link
                to={isStudent ? "/cursos" : "/usuarios"}
                className="btn btn-gradient-primary d-flex align-items-center gap-2"
              >
                <i
                  className={
                    isStudent ? "bi bi-journal-code" : "bi bi-person-plus-fill"
                  }
                ></i>
                {isStudent ? "Explorar Cursos" : "Gerenciar Alunos"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {isStudent ? (
        // STUDENT DASHBOARD
        <>
          {/* Metrics Row */}
          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="glass-panel p-4 text-center">
                <i className="bi bi-book-half text-primary fs-2 mb-2 d-block"></i>
                <h4 className="text-white fw-bold">
                  {minhasMatriculas.length}
                </h4>
                <span className="text-secondary fs-7">Cursos Matriculados</span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-panel p-4 text-center">
                <i className="bi bi-check-circle-fill text-success fs-2 mb-2 d-block"></i>
                <h4 className="text-white fw-bold">
                  {
                    minhasMatriculas.filter((m) => m.DataConclusao !== null)
                      .length
                  }
                </h4>
                <span className="text-secondary fs-7">Cursos Concluídos</span>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-panel p-4 text-center">
                <i className="bi bi-award text-warning fs-2 mb-2 d-block"></i>
                <h4 className="text-white fw-bold">
                  {meusCertificados.length}
                </h4>
                <span className="text-secondary fs-7">
                  Certificados Conquistados
                </span>
              </div>
            </div>
          </div>

          {/* Enrolled Courses Section */}
          <div className="row mb-4">
            <div className="col-12">
              <h3 className="text-white fw-bold mb-4">
                Meus Cursos em Andamento
              </h3>

              {minhasMatriculas.length === 0 ? (
                <div className="glass-panel p-5 text-center">
                  <i className="bi bi-journal-x fs-1 text-secondary mb-3 d-block"></i>
                  <h5>Nenhuma matrícula ativa</h5>
                  <p className="text-secondary">
                    Você ainda não se matriculou em nenhum curso. Vá para a
                    página de cursos para começar!
                  </p>
                  <Link to="/cursos" className="btn btn-gradient-primary mt-3">
                    Ver Catálogo de Cursos
                  </Link>
                </div>
              ) : (
                <div className="row g-4">
                  {minhasMatriculas.map((mat) => {
                    const curso = cursos.find(
                      (c) => c.ID_Curso === mat.ID_Curso,
                    );
                    if (!curso) return null;
                    const cat = categorias.find(
                      (c) => c.ID_Categoria === curso.ID_Categoria,
                    );

                    const progressPercent = getCourseProgress(curso.ID_Curso);

                    return (
                      <div className="col-md-6 col-lg-4" key={mat.ID_Matricula}>
                        <CardCurso
                          curso={curso}
                          categoriaNome={cat?.Nome || "Geral"}
                          matriculado={true}
                          progresso={progressPercent}
                          onAction={() =>
                            navigate(`/sala-de-aula/${curso.ID_Curso}`)
                          }
                          actionText="Ir para a Aula"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        // ADMIN / INSTRUCTOR DASHBOARD
        <>
          {/* Admin Stats Row */}
          <div className="row g-4 mb-5">
            <div className="col-md-3">
              <div className="glass-panel p-4 text-center">
                <i className="bi bi-people-fill text-gradient-primary fs-2 mb-2 d-block"></i>
                <h4 className="text-white fw-bold">{stats.totalAlunos}</h4>
                <span className="text-secondary fs-7">Alunos Ativos</span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="glass-panel p-4 text-center">
                <i className="bi bi-journal-code text-gradient-secondary fs-2 mb-2 d-block"></i>
                <h4 className="text-white fw-bold">{stats.totalCursos}</h4>
                <span className="text-secondary fs-7">Cursos Cadastrados</span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="glass-panel p-4 text-center">
                <i className="bi bi-currency-dollar text-success fs-2 mb-2 d-block"></i>
                <h4 className="text-white fw-bold">
                  R$ {stats.totalReceita.toFixed(2)}
                </h4>
                <span className="text-secondary fs-7">
                  Receita de Assinaturas
                </span>
              </div>
            </div>
            <div className="col-md-3">
              <div className="glass-panel p-4 text-center">
                <i className="bi bi-award-fill text-warning fs-2 mb-2 d-block"></i>
                <h4 className="text-white fw-bold">
                  {stats.totalCertificados}
                </h4>
                <span className="text-secondary fs-7">
                  Certificados Emitidos
                </span>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* Quick Actions Panel */}
            <div className="col-lg-6">
              <div className="glass-panel p-4 h-100">
                <h5 className="text-white fw-bold mb-4">
                  Ações Rápidas de Administração
                </h5>
                <div className="d-grid gap-3">
                  <Link
                    to="/cursos"
                    className="btn btn-outline-custom text-start d-flex justify-content-between align-items-center py-3"
                  >
                    <span>
                      <i className="bi bi-folder-plus text-primary me-2"></i>{" "}
                      Criar Categoria ou Curso
                    </span>
                    <i className="bi bi-arrow-right"></i>
                  </Link>
                  <Link
                    to="/usuarios"
                    className="btn btn-outline-custom text-start d-flex justify-content-between align-items-center py-3"
                  >
                    <span>
                      <i className="bi bi-person-plus text-success me-2"></i>{" "}
                      Cadastrar Novo Usuário
                    </span>
                    <i className="bi bi-arrow-right"></i>
                  </Link>
                  <Link
                    to="/trilhas"
                    className="btn btn-outline-custom text-start d-flex justify-content-between align-items-center py-3"
                  >
                    <span>
                      <i className="bi bi-map-fill text-warning me-2"></i>{" "}
                      Montar Trilha de Conteúdo
                    </span>
                    <i className="bi bi-arrow-right"></i>
                  </Link>
                  <Link
                    to="/financeiro"
                    className="btn btn-outline-custom text-start d-flex justify-content-between align-items-center py-3"
                  >
                    <span>
                      <i className="bi bi-cash-stack text-info me-2"></i>{" "}
                      Consultar Assinaturas e Planos
                    </span>
                    <i className="bi bi-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </div>

            {/* Recent Payments Panel */}
            <div className="col-lg-6">
              <div className="glass-panel p-4 h-100">
                <h5 className="text-white fw-bold mb-4">
                  Vendas e Transações Recentes
                </h5>
                {recentPayments.length === 0 ? (
                  <p className="text-secondary">Nenhum pagamento registrado.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-dark table-hover table-custom m-0">
                      <thead>
                        <tr>
                          <th>Transação</th>
                          <th>Valor</th>
                          <th>Data</th>
                          <th>Método</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentPayments.slice(0, 5).map((pay) => (
                          <tr key={pay.ID_Pagamento}>
                            <td>
                              <span className="font-monospace text-warning fs-8">
                                {pay.Id_Transacao_Gateway.substring(0, 14)}...
                              </span>
                            </td>
                            <td className="text-success fw-bold">
                              R$ {pay.ValorPago.toFixed(2)}
                            </td>
                            <td>
                              {new Date(pay.DataPagamento).toLocaleDateString(
                                "pt-BR",
                              )}
                            </td>
                            <td>{pay.MetodoPagamento}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
