import React, { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../types";
import type { Curso, Modulo, Aula, Matricula, ProgressoAula } from "../types";
import { useActiveUser } from "../context/useActiveUser";

export const SalaDeAula: React.FC = () => {
  const { cursoId } = useParams<{ cursoId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useActiveUser();

  const [curso, setCurso] = useState<Curso | null>(null);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [matricula, setMatricula] = useState<Matricula | null>(null);
  const [progressos, setProgressos] = useState<ProgressoAula[]>([]);
  const [selectedAula, setSelectedAula] = useState<Aula | null>(null);

  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  // Quiz states
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const loadClassroomData = useCallback(async () => {
    if (!cursoId || !currentUser) return;
    setLoading(true);
    try {
      const cId = Number(cursoId);

      // 1. Get Course details
      const cursoData = await api.getCursoById(cId);
      setCurso(cursoData);

      // 2. Check if student is enrolled
      const allMatriculas = await api.getMatriculasByUser(
        currentUser.ID_Usuario,
      );
      const foundMatricula = allMatriculas.find((m) => m.ID_Curso === cId);
      setMatricula(foundMatricula || null);

      if (foundMatricula) {
        // 3. Load Modules & Lessons
        const modulesData = await api.getModulosByCurso(cId);
        const sortedMods = modulesData.sort((a, b) => a.Ordem - b.Ordem);
        setModulos(sortedMods);

        const allAulas = await api.getAulas();
        const modIds = sortedMods.map((m) => m.ID_Modulo);
        const sortedAulas = allAulas
          .filter((a) => modIds.includes(a.ID_Modulo))
          .sort((a, b) => a.Ordem - b.Ordem);
        setAulas(sortedAulas);

        if (sortedAulas.length > 0) {
          setSelectedAula(sortedAulas[0]);
        }

        // 4. Load student progress
        const progData = await api.getProgressoByUser(currentUser.ID_Usuario);
        setProgressos(progData);
      }
    } catch (err) {
      console.error("Erro ao carregar dados da sala de aula:", err);
    } finally {
      setLoading(false);
    }
  }, [cursoId, currentUser]);

  useEffect(() => {
    const load = async () => {
      await loadClassroomData();
      setQuizAnswer(null);
      setQuizSubmitted(false);
    };

    void load();
  }, [loadClassroomData]);

  useEffect(() => {
    const resetQuizState = () => {
      setQuizAnswer(null);
      setQuizSubmitted(false);
    };

    resetQuizState();
  }, [selectedAula]);

  const handleEnrollNow = async () => {
    if (!currentUser || !cursoId) return;
    setEnrolling(true);
    try {
      await api.createMatricula(currentUser.ID_Usuario, Number(cursoId));
      await loadClassroomData();
    } catch (err) {
      console.error("Erro ao matricular-se:", err);
      alert("Não foi possível realizar a matrícula automática.");
    } finally {
      setEnrolling(false);
    }
  };

  const handleToggleLessonComplete = async (aulaId: number) => {
    if (!currentUser || !matricula) return;

    const isCompleted = progressos.some((p) => p.ID_Aula === aulaId);
    try {
      await api.toggleProgressoAula(
        currentUser.ID_Usuario,
        aulaId,
        !isCompleted,
      );

      // Reload progress
      const progData = await api.getProgressoByUser(currentUser.ID_Usuario);
      setProgressos(progData);

      // Check if ALL lessons are now completed
      const totalLessons = aulas.length;
      const completedLessons = progData.filter((p) =>
        aulas.some((a) => a.ID_Aula === p.ID_Aula),
      ).length;

      if (
        completedLessons === totalLessons &&
        totalLessons > 0 &&
        !matricula.DataConclusao
      ) {
        // Auto mark enrollment as complete
        await api.concluirMatricula(matricula.ID_Matricula);
        alert("🎉 Incrível! Você completou 100% das aulas deste curso.");
        // Refresh matricula status
        const updatedMat = await api.getMatriculasByUser(
          currentUser.ID_Usuario,
        );
        setMatricula(
          updatedMat.find((m) => m.ID_Curso === Number(cursoId)) || null,
        );
      }
    } catch (err) {
      console.error("Erro ao alternar progresso:", err);
    }
  };

  const handleEmitCertificate = async () => {
    if (!currentUser || !curso) return;
    try {
      const existingCerts = await api.getCertificadosByUser(
        currentUser.ID_Usuario,
      );
      const alreadyHasCert = existingCerts.some(
        (c) => c.ID_Curso === curso.ID_Curso,
      );

      if (alreadyHasCert) {
        alert("Você já emitiu o certificado deste curso. Redirecionando...");
        navigate("/certificados");
        return;
      }

      await api.emitirCertificado({
        ID_Usuario: currentUser.ID_Usuario,
        ID_Curso: curso.ID_Curso,
        ID_Trilha: null,
      });

      alert(
        "🏆 Certificado gerado com sucesso! Redirecionando para visualização...",
      );
      navigate("/certificados");
    } catch (err) {
      console.error("Erro ao emitir certificado:", err);
      alert("Erro ao emitir certificado.");
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Entrando na sala...</span>
        </div>
      </div>
    );
  }

  // If user is not enrolled in this course
  if (!matricula) {
    return (
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="glass-panel p-5 text-center my-5">
              <i
                className="bi bi-lock-fill text-warning"
                style={{ fontSize: "4rem" }}
              ></i>
              <h3 className="text-white fw-bold mt-4">
                Sala de Aula Bloqueada
              </h3>
              <p className="text-secondary mb-4">
                Você ainda não está matriculado no curso{" "}
                <strong>"{curso?.Titulo}"</strong>. Matricule-se agora
                gratuitamente para começar a estudar imediatamente!
              </p>
              <button
                onClick={handleEnrollNow}
                disabled={enrolling}
                className="btn btn-gradient-primary btn-lg px-5 py-3"
              >
                {enrolling ? "Processando matrícula..." : "Matricular-se Agora"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAulaCompleted = (aulaId: number) =>
    progressos.some((p) => p.ID_Aula === aulaId);

  // Calculate completion percentage
  const totalAulasCount = aulas.length;
  const completedAulasCount = progressos.filter((p) =>
    aulas.some((a) => a.ID_Aula === p.ID_Aula),
  ).length;
  const progressPercent =
    totalAulasCount > 0 ? (completedAulasCount / totalAulasCount) * 100 : 0;

  return (
    <div className="container-fluid px-md-5">
      {/* Course Title and Progress Banner */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="glass-panel p-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3 className="text-white fw-bold mb-1">{curso?.Titulo}</h3>
              <span className="text-secondary fs-7">
                Nível {curso?.Nivel} | Instrutor ID: {curso?.ID_Instrutor}
              </span>
            </div>

            {/* Progress Display */}
            <div className="d-flex align-items-center gap-4">
              <div style={{ width: "150px" }}>
                <div className="d-flex justify-content-between mb-1">
                  <span className="text-secondary fs-8">Concluído</span>
                  <span className="text-white fw-bold fs-8">
                    {Math.round(progressPercent)}%
                  </span>
                </div>
                <div
                  className="progress bg-secondary-subtle"
                  style={{ height: "6px" }}
                >
                  <div
                    className="progress-bar"
                    style={{
                      width: `${progressPercent}%`,
                      background: "var(--primary-glow)",
                    }}
                  ></div>
                </div>
              </div>

              {progressPercent === 100 && (
                <button
                  onClick={handleEmitCertificate}
                  className="btn btn-gradient-secondary animate-pulse d-flex align-items-center gap-2"
                >
                  <i className="bi bi-award-fill"></i> Gerar Certificado
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Side: Classroom Lesson Navigator Sidebar */}
        <div className="col-lg-4 col-xl-3">
          <div
            className="glass-panel p-4 h-100"
            style={{ maxHeight: "70vh", overflowY: "auto" }}
          >
            <h5 className="text-white fw-bold mb-3">
              <i className="bi bi-collection-play"></i> Grade de Aulas
            </h5>

            {modulos.map((mod) => {
              const modAulas = aulas.filter(
                (a) => a.ID_Modulo === mod.ID_Modulo,
              );
              return (
                <div key={mod.ID_Modulo} className="mb-4">
                  <div className="text-warning fw-bold fs-8 uppercase mb-2 border-bottom border-secondary pb-1">
                    Mód. {mod.Ordem}: {mod.Titulo}
                  </div>

                  <div className="list-group list-group-flush gap-1">
                    {modAulas.map((aula) => {
                      const completed = isAulaCompleted(aula.ID_Aula);
                      const isSelected = selectedAula?.ID_Aula === aula.ID_Aula;
                      return (
                        <button
                          key={aula.ID_Aula}
                          onClick={() => setSelectedAula(aula)}
                          className={`list-group-item list-group-item-action bg-transparent border-0 text-white rounded p-2 d-flex align-items-start gap-2 text-start ${
                            isSelected
                              ? "bg-white bg-opacity-10 fw-semibold text-gradient-primary"
                              : "text-secondary"
                          }`}
                        >
                          {/* Checkbox status indicator */}
                          <span
                            onClick={(e) => {
                              e.stopPropagation(); // Avoid selecting lesson
                              handleToggleLessonComplete(aula.ID_Aula);
                            }}
                            className="cursor-pointer fs-6"
                          >
                            <i
                              className={`bi ${completed ? "bi-check-circle-fill text-success" : "bi-circle text-secondary"}`}
                            ></i>
                          </span>

                          <div className="flex-grow-1">
                            <span className="fs-7 d-block text-white">
                              {aula.Titulo}
                            </span>
                            <span className="fs-9 text-secondary d-flex align-items-center gap-1 mt-1">
                              <i
                                className={`bi ${
                                  aula.TipoConteudo === "Vídeo"
                                    ? "bi-play-circle"
                                    : aula.TipoConteudo === "Quiz"
                                      ? "bi-question-circle"
                                      : "bi-file-text"
                                }`}
                              ></i>
                              {aula.TipoConteudo} • {aula.DuracaoMinutos} min
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Primary Media Viewer Console */}
        <div className="col-lg-8 col-xl-9">
          <div
            className="glass-panel p-4 h-100 d-flex flex-column justify-content-between"
            style={{ minHeight: "55vh" }}
          >
            {selectedAula ? (
              <>
                <div>
                  {/* Lesson Heading Info */}
                  <div className="d-flex justify-content-between align-items-start border-bottom border-secondary pb-3 mb-4 flex-wrap gap-2">
                    <div>
                      <span className="badge bg-primary badge-custom mb-2">
                        {selectedAula.TipoConteudo}
                      </span>
                      <h4 className="text-white fw-bold mb-0">
                        {selectedAula.Titulo}
                      </h4>
                    </div>

                    {/* Mark complete button */}
                    <button
                      onClick={() =>
                        handleToggleLessonComplete(selectedAula.ID_Aula)
                      }
                      className={`btn btn-sm ${isAulaCompleted(selectedAula.ID_Aula) ? "btn-success" : "btn-outline-custom"}`}
                    >
                      <i
                        className={`bi ${isAulaCompleted(selectedAula.ID_Aula) ? "bi-check-all" : "bi-check"}`}
                      ></i>
                      {isAulaCompleted(selectedAula.ID_Aula)
                        ? " Concluída"
                        : " Marcar como Concluída"}
                    </button>
                  </div>

                  {/* Render content based on type */}
                  <div className="classroom-viewport my-3">
                    {selectedAula.TipoConteudo === "Vídeo" && (
                      <div
                        className="ratio ratio-16x9 rounded overflow-hidden shadow-lg"
                        style={{ border: "1px solid var(--panel-border)" }}
                      >
                        <iframe
                          src={selectedAula.URL_Conteudo}
                          title={selectedAula.Titulo}
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}

                    {selectedAula.TipoConteudo === "Texto" && (
                      <div
                        className="p-4 bg-black bg-opacity-20 rounded border border-secondary"
                        style={{ lineHeight: "1.8" }}
                      >
                        <p className="text-white fs-6 whitespace-pre-wrap">
                          {selectedAula.URL_Conteudo}
                        </p>
                        <div className="alert alert-info mt-4 fs-8 border-secondary bg-transparent text-secondary">
                          <i className="bi bi-info-circle-fill text-info me-2"></i>
                          Dica acadêmica: Faça resumos em seu caderno ou
                          repositório pessoal de estudos para fixar o
                          aprendizado deste módulo.
                        </div>
                      </div>
                    )}

                    {selectedAula.TipoConteudo === "Quiz" && (
                      <div className="p-4 bg-black bg-opacity-20 rounded border border-secondary">
                        <h6 className="text-white fw-bold mb-3">
                          <i className="bi bi-patch-question-fill text-warning"></i>{" "}
                          Questionário de Fixação
                        </h6>
                        <p className="text-secondary fs-7 mb-4">
                          {selectedAula.URL_Conteudo}
                        </p>

                        <div
                          className="d-grid gap-2 mb-4"
                          style={{ maxWidth: "450px" }}
                        >
                          {[
                            "A) Utilizar Hooks customizados",
                            "B) Redux Toolkit apenas",
                            "C) Props drilling em múltiplos níveis",
                            "D) Nenhuma das anteriores",
                          ].map((option, idx) => (
                            <button
                              key={idx}
                              onClick={() =>
                                !quizSubmitted && setQuizAnswer(option)
                              }
                              className={`btn text-start p-3 rounded-3 border ${
                                quizAnswer === option
                                  ? "bg-primary border-primary text-white"
                                  : "bg-transparent border-secondary text-secondary hover-bg-secondary"
                              }`}
                              disabled={quizSubmitted}
                            >
                              {option}
                            </button>
                          ))}
                        </div>

                        {!quizSubmitted ? (
                          <button
                            onClick={() => setQuizSubmitted(true)}
                            className="btn btn-gradient-secondary"
                            disabled={!quizAnswer}
                          >
                            Enviar Resposta
                          </button>
                        ) : (
                          <div className="alert alert-success d-flex align-items-center gap-3">
                            <i className="bi bi-check-circle-fill fs-4 text-success"></i>
                            <div>
                              <strong className="d-block text-white">
                                Resposta Enviada!
                              </strong>
                              <span className="fs-8 text-secondary">
                                Parabéns pela conclusão. Clique no botão de
                                marcar aula como concluída acima para arquivar
                                seu progresso.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Navigation */}
                <div className="d-flex justify-content-between align-items-center border-top border-secondary pt-3 mt-4">
                  <span className="text-secondary fs-8">
                    Duração Estimada: {selectedAula.DuracaoMinutos} minutos
                  </span>
                  <span className="text-secondary fs-8">
                    Ordem da Aula no Módulo: #{selectedAula.Ordem}
                  </span>
                </div>
              </>
            ) : (
              <div className="d-flex flex-column justify-content-center align-items-center py-5">
                <i className="bi bi-arrow-left-circle fs-1 text-secondary mb-3"></i>
                <h5>Selecione uma aula no painel lateral</h5>
                <p className="text-secondary">
                  Escolha um módulo para começar sua trilha de estudos
                  acadêmicos.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
