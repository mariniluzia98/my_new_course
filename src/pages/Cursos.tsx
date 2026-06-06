import React, { useCallback, useEffect, useState } from "react";
import { api } from "../types";
import type { Categoria, Modulo, Aula, Curso } from "../types";
import { useActiveUser } from "../context/useActiveUser";

export const Cursos: React.FC = () => {
  const { currentUser } = useActiveUser();
  const isAdminOrInstructor =
    currentUser?.Cargo === "Admin" || currentUser?.Cargo === "Instrutor";
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    number | "todas"
  >("todas");

  // Formulário de Categorias
  const [catId, setCatId] = useState<number | null>(null);
  const [backendCatId, setBackendCatId] = useState<number | string | null>(
    null,
  );
  const [catNome, setCatNome] = useState("");
  const [catDesc, setCatDesc] = useState("");

  // Formulário de Cursos
  const [cursoId, setCursoId] = useState<number | null>(null);
  const [backendCursoId, setBackendCursoId] = useState<number | string | null>(
    null,
  );
  const [cursoTitulo, setCursoTitulo] = useState("");
  const [cursoDesc, setCursoDesc] = useState("");
  const [cursoNivel, setCursoNivel] = useState<
    "Iniciante" | "Intermediário" | "Avançado"
  >("Iniciante");
  const [cursoCatId, setCursoCatId] = useState<number | "">("");
  const [cursoInstrutorId] = useState<number>(currentUser?.ID_Usuario || 2);

  // Construção de Conteúdo
  const [activeTab, setActiveTab] = useState<"catalogo" | "conteudo">(
    "catalogo",
  );
  const [selectedContentCursoId, setSelectedContentCursoId] = useState<
    number | ""
  >("");
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);

  //  Adicionar Módulos
  const [modTitulo, setModTitulo] = useState("");
  const [modOrdem, setModOrdem] = useState<number>(1);

  //  Adicionar Aulas
  const [aulaModId, setAulaModId] = useState<number | "">("");
  const [aulaTitulo, setAulaTitulo] = useState("");
  const [aulaTipo, setAulaTipo] = useState<"Vídeo" | "Texto" | "Quiz">("Vídeo");
  const [aulaUrl, setAulaUrl] = useState("");
  const [aulaDuracao, setAulaDuracao] = useState<number>(10);
  const [aulaOrdem, setAulaOrdem] = useState<number>(1);

  const [loading, setLoading] = useState(true);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [allCursos, allCats] = await Promise.all([
        api.getCursos(),
        api.getCategorias(),
      ]);
      setCursos(allCursos);
      setCategorias(allCats);

      if (allCursos.length > 0 && !selectedContentCursoId) {
        setSelectedContentCursoId(allCursos[0].ID_Curso);
      }
    } catch (err) {
      console.error("Erro ao buscar catálogo:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedContentCursoId]);

  const loadContentData = useCallback(async (cId: number) => {
    try {
      const [allMods, allAulas] = await Promise.all([
        api.getModulosByCurso(cId),
        api.getAulas(), //Recupera todas as aulas para filtrar em memória
      ]);

      // Organiza os módulos em ordem crescente
      const sortedMods = allMods.sort((a, b) => a.Ordem - b.Ordem);
      setModulos(sortedMods);

      // Organiza as aulas em ordem crescente
      const modIds = allMods.map((m) => m.ID_Modulo);
      const filteredAulas = allAulas
        .filter((a) => modIds.includes(a.ID_Modulo))
        .sort((a, b) => a.Ordem - b.Ordem);
      setAulas(filteredAulas);
    } catch (err) {
      console.error("Erro ao buscar módulos/aulas:", err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await loadAllData();
    };

    void load();
  }, [loadAllData]);

  useEffect(() => {
    const load = async () => {
      if (selectedContentCursoId) {
        await loadContentData(Number(selectedContentCursoId));
      } else {
        setModulos([]);
        setAulas([]);
      }
    };

    void load();
  }, [loadContentData, selectedContentCursoId]);

  // --- AÇÕES: CATEGORIAS ---
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNome) return;

    try {
      if (backendCatId) {
        await api.updateCategoria(backendCatId, {
          Nome: catNome,
          Descricao: catDesc,
        });
      } else {
        await api.createCategoria({
          Nome: catNome,
          Descricao: catDesc,
          img: "",
        });
      }
      setCatId(null);
      setBackendCatId(null);
      setCatNome("");
      setCatDesc("");
      loadAllData();
      alert("Categoria salva com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar categoria.");
    }
  };

  const handleDeleteCategory = async (id: number | string) => {
    if (window.confirm("Tem certeza que deseja excluir esta categoria?")) {
      try {
        await api.deleteCategoria(id);
        setSelectedCategoryFilter("todas");
        loadAllData();
      } catch (err) {
        console.error(err);
        alert("Erro ao excluir categoria.");
      }
    }
  };

  // --- AÇÕES: CURSOS ---
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cursoTitulo || !cursoCatId) return;

    try {
      if (backendCursoId) {
        await api.updateCurso(backendCursoId, {
          Titulo: cursoTitulo,
          Descricao: cursoDesc,
          Nivel: cursoNivel,
          ID_Categoria: Number(cursoCatId),
        });
      } else {
        await api.createCurso({
          img: "",
          Titulo: cursoTitulo,
          Descricao: cursoDesc,
          Nivel: cursoNivel,
          ID_Categoria: Number(cursoCatId),
          ID_Instrutor: cursoInstrutorId,
        });
      }
      setCursoId(null);
      setBackendCursoId(null);
      setCursoTitulo("");
      setCursoDesc("");
      setCursoNivel("Iniciante");
      setCursoCatId("");
      loadAllData();
      alert("Curso salvo com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar curso.");
    }
  };

  const handleDeleteCourse = async (id: number | string) => {
    if (
      window.confirm(
        "Deseja excluir este curso? Modulos e aulas não serão excluídos automaticamente no mock JSON Server, mas ficarão ocultos.",
      )
    ) {
      try {
        await api.deleteCurso(id);
        loadAllData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // --- AÇÕES: MÓDULOS ---
  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modTitulo || !selectedContentCursoId) return;

    try {
      await api.createModulo({
        Titulo: modTitulo,
        ID_Curso: Number(selectedContentCursoId),
        Ordem: Number(modOrdem),
      });
      setModTitulo("");
      setModOrdem(modOrdem + 1);
      loadContentData(Number(selectedContentCursoId));
      alert("Módulo adicionado!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteModule = async (id: number) => {
    if (window.confirm("Excluir este módulo?")) {
      try {
        await api.deleteModulo(id);
        loadContentData(Number(selectedContentCursoId));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // --- AÇÕES: AULAS ---
  const handleAddAula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aulaTitulo || !aulaModId) return;

    try {
      await api.createAula({
        ID_Modulo: Number(aulaModId),
        Titulo: aulaTitulo,
        TipoConteudo: aulaTipo,
        URL_Conteudo: aulaUrl,
        DuracaoMinutos: Number(aulaDuracao),
        Ordem: Number(aulaOrdem),
      });

      // Atualiza as estatísticas totais do curso
      if (selectedContentCursoId) {
        const targetCurso = cursos.find(
          (c) => c.ID_Curso === Number(selectedContentCursoId),
        );
        if (targetCurso) {
          await api.updateCurso(targetCurso.ID_Curso, {
            TotalAulas: targetCurso.TotalAulas + 1,
            TotalHoras: Math.round(
              (targetCurso.TotalHoras * 60 + Number(aulaDuracao)) / 60,
            ),
          });
        }
      }

      setAulaTitulo("");
      setAulaUrl("");
      setAulaOrdem(aulaOrdem + 1);
      loadAllData(); // Recarrega os cursos para obter as estatísticas atualizadas
      loadContentData(Number(selectedContentCursoId));
      alert("Aula adicionada!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAula = async (id: number) => {
    if (window.confirm("Excluir esta aula?")) {
      try {
        await api.deleteAula(id);
        loadContentData(Number(selectedContentCursoId));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredCursos =
    selectedCategoryFilter === "todas"
      ? cursos
      : cursos.filter((c) => c.ID_Categoria === Number(selectedCategoryFilter));

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Title */}
      <div className="row mb-4">
        <div className="col-12 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <div>
            <h2 className="text-white fw-bold">Módulo Acadêmico & Conteúdo</h2>
            <p className="text-secondary">
              Gerencie categorias de cursos, listagem acadêmica e monte a
              estrutura de módulos e aulas.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="d-flex gap-2">
            <button
              onClick={() => setActiveTab("catalogo")}
              className={`btn ${activeTab === "catalogo" ? "btn-gradient-primary" : "btn-outline-custom"}`}
            >
              <i className="bi bi-grid-fill"></i> Catálogo e Categorias
            </button>
            <button
              onClick={() => setActiveTab("conteudo")}
              className={`btn ${activeTab === "conteudo" ? "btn-gradient-primary" : "btn-outline-custom"}`}
            >
              <i className="bi bi-list-nested"></i> Estrutura de Aulas
            </button>
          </div>
        </div>
      </div>
      {activeTab === "catalogo" ? (
        // PAINEL DE CATÁLOGO E CATEGORIAS
        <div className="row g-4">
          {/* Coluna esquerda: Categorias e formulários */}
          <div className="col-lg-4">
            {/* Formulário de Categoria */}
            {isAdminOrInstructor && (
              <div className="glass-panel p-4 mb-4">
                <h5 className="text-white fw-bold mb-3">
                  {catId ? "Editar Categoria" : "Criar Categoria"}
                </h5>
                <form onSubmit={handleSaveCategory}>
                  <div className="mb-2">
                    <input
                      type="text"
                      className="form-control form-control-custom py-2"
                      placeholder="Nome da Categoria (ex: DevOps)"
                      value={catNome}
                      onChange={(e) => setCatNome(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <textarea
                      className="form-control form-control-custom py-2"
                      placeholder="Breve descrição"
                      rows={2}
                      value={catDesc}
                      onChange={(e) => setCatDesc(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-sm btn-gradient-primary flex-grow-1"
                    >
                      Salvar
                    </button>
                    {catId && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-custom"
                        onClick={() => {
                          setCatId(null);
                          setCatNome("");
                          setCatDesc("");
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Lista de Categorias */}
            <div className="glass-panel p-4 mb-4">
              <h5 className="text-white fw-bold mb-3">Filtro por Categorias</h5>
              <div className="list-group list-group-flush">
                <button
                  onClick={() => setSelectedCategoryFilter("todas")}
                  className={`list-group-item list-group-item-action bg-transparent text-white border-secondary d-flex justify-content-between align-items-center ${selectedCategoryFilter === "todas" ? "fw-bold text-gradient-primary border-bottom" : ""}`}
                >
                  <span>
                    <i className="bi bi-tag-fill me-2"></i> Todas as Categorias
                  </span>
                  <span className="badge bg-secondary rounded-pill">
                    {cursos.length}
                  </span>
                </button>
                {categorias.map((cat) => {
                  const count = cursos.filter(
                    (c) => c.ID_Categoria === cat.ID_Categoria,
                  ).length;
                  return (
                    <div
                      key={cat.ID_Categoria}
                      className="list-group-item bg-transparent text-white border-secondary p-0 d-flex align-items-center"
                    >
                      <button
                        onClick={() =>
                          setSelectedCategoryFilter(cat.ID_Categoria)
                        }
                        className={`btn text-start text-white bg-transparent border-0 flex-grow-1 py-3 d-flex justify-content-between align-items-center ${selectedCategoryFilter === cat.ID_Categoria ? "fw-bold text-gradient-primary" : ""}`}
                      >
                        <span>
                          <i className="bi bi-tag me-2"></i> {cat.Nome}
                        </span>
                        <span className="badge bg-secondary rounded-pill">
                          {count}
                        </span>
                      </button>
                      {isAdminOrInstructor && (
                        <div className="pe-2 d-flex gap-1">
                          <button
                            onClick={() => {
                              setCatId(cat.ID_Categoria);
                              setBackendCatId(cat.id);
                              setCatNome(cat.Nome);
                              setCatDesc(cat.Descricao);
                            }}
                            className="btn btn-sm btn-outline-custom py-0 px-1"
                          >
                            <i className="bi bi-pencil fs-8"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="btn btn-sm btn-outline-danger py-0 px-1"
                          >
                            <i className="bi bi-trash fs-8"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Formulário do Curso */}
            {isAdminOrInstructor && (
              <div className="glass-panel p-4">
                <h5 className="text-white fw-bold mb-3">
                  {cursoId ? "Editar Curso" : "Cadastrar Novo Curso"}
                </h5>
                <form onSubmit={handleSaveCourse}>
                  <div className="mb-3">
                    <label className="text-secondary fs-8 mb-1">
                      Título do Curso
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      placeholder="Ex: React com TypeScript"
                      value={cursoTitulo}
                      onChange={(e) => setCursoTitulo(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="text-secondary fs-8 mb-1">
                      Descrição
                    </label>
                    <textarea
                      className="form-control form-control-custom"
                      placeholder="Resumo do conteúdo do curso..."
                      rows={3}
                      value={cursoDesc}
                      onChange={(e) => setCursoDesc(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="text-secondary fs-8 mb-1">
                      Categoria *
                    </label>
                    <select
                      className="form-select form-select-custom"
                      value={cursoCatId}
                      onChange={(e) =>
                        setCursoCatId(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      required
                    >
                      <option value="">Selecione...</option>
                      {categorias.map((c) => (
                        <option key={c.ID_Categoria} value={c.ID_Categoria}>
                          {c.Nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="text-secondary fs-8 mb-1">
                      Nível de Dificuldade
                    </label>
                    <select
                      className="form-select form-select-custom"
                      value={cursoNivel}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        setCursoNivel(
                          e.target.value as
                            | "Iniciante"
                            | "Intermediário"
                            | "Avançado",
                        )
                      }
                    >
                      <option value="Iniciante">Iniciante</option>
                      <option value="Intermediário">Intermediário</option>
                      <option value="Avançado">Avançado</option>
                    </select>
                  </div>
                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-gradient-primary flex-grow-1"
                    >
                      {cursoId ? "Atualizar Curso" : "Criar Curso"}
                    </button>
                    {cursoId && (
                      <button
                        type="button"
                        className="btn btn-outline-custom"
                        onClick={() => {
                          setCursoId(null);
                          setCursoTitulo("");
                          setCursoDesc("");
                          setCursoNivel("Iniciante");
                          setCursoCatId("");
                        }}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Coluna direita: Lista de Cursos */}
          <div className="col-lg-8">
            <div className="glass-panel p-4 h-100">
              <h5 className="text-white fw-bold mb-4">
                <i className="bi bi-collection"></i> Catálogo de Cursos (
                {filteredCursos.length})
              </h5>

              {filteredCursos.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-folder2-open fs-1 text-secondary"></i>
                  <p className="text-secondary mt-2">
                    Nenhum curso cadastrado nesta categoria.
                  </p>
                </div>
              ) : (
                <div className="row g-3">
                  {filteredCursos.map((c) => {
                    const cat = categorias.find(
                      (cat) => cat.ID_Categoria === c.ID_Categoria,
                    );
                    return (
                      <div className="col-md-6" key={c.ID_Curso}>
                        <div className="card bg-black bg-opacity-20 border border-secondary p-3 h-100 d-flex flex-column justify-content-between">
                          <img
                            src={c.img}
                            alt={c.Titulo}
                            className="mb-3 rounded"
                            style={{
                              width: "100%",
                              height: "180px",
                              objectFit: "cover",
                            }}
                          />
                          <div>
                            <div className="d-flex justify-content-between mb-2">
                              ...
                              <span
                                className="badge bg-secondary-subtle text-secondary"
                                style={{ fontSize: "0.65rem" }}
                              >
                                {cat?.Nome || "Geral"}
                              </span>
                              <span
                                className={`badge ${c.Nivel === "Avançado" ? "bg-danger" : c.Nivel === "Intermediário" ? "bg-warning text-dark" : "bg-success"} text-white`}
                                style={{ fontSize: "0.65rem" }}
                              >
                                {c.Nivel}
                              </span>
                            </div>
                            <h6 className="text-white fw-bold mb-1">
                              {c.Titulo}
                            </h6>
                            <p
                              className="text-secondary fs-8 line-clamp-2"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {c.Descricao}
                            </p>
                          </div>

                          <div className="border-top border-secondary pt-2 mt-2 d-flex justify-content-between align-items-center">
                            <span className="text-secondary fs-8">
                              <i className="bi bi-clock"></i> {c.TotalHoras}h |{" "}
                              {c.TotalAulas} Aulas
                            </span>
                            {isAdminOrInstructor && (
                              <div className="d-flex gap-1">
                                <button
                                  onClick={() => {
                                    setCursoId(c.ID_Curso);
                                    setBackendCursoId(c.id);
                                    setCursoTitulo(c.Titulo);
                                    setCursoDesc(c.Descricao);
                                    setCursoNivel(c.Nivel);
                                    setCursoCatId(c.ID_Categoria);
                                  }}
                                  className="btn btn-sm btn-outline-custom p-1 px-2"
                                  title="Editar"
                                >
                                  <i className="bi bi-pencil fs-8"></i>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedContentCursoId(c.ID_Curso);
                                    setActiveTab("conteudo");
                                  }}
                                  className="btn btn-sm btn-gradient-secondary p-1 px-2"
                                  title="Gerenciar Conteúdo"
                                >
                                  <i className="bi bi-list-nested fs-8"></i>{" "}
                                  Aulas
                                </button>
                                <button
                                  onClick={() => handleDeleteCourse(c.id)}
                                  className="btn btn-sm btn-outline-danger p-1 px-2"
                                  title="Deletar"
                                >
                                  <i className="bi bi-trash fs-8"></i>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // PANEL DE BUILDER DE ESTRUTURA
        <div className="row g-4">
          <div className="col-lg-4">
            {/* Widget de Seleção de Curso */}
            <div className="glass-panel p-4 mb-4">
              <label className="text-secondary fs-8 fw-semibold mb-2">
                Selecione o Curso para Editar Conteúdo
              </label>
              <select
                className="form-select form-select-custom"
                value={selectedContentCursoId}
                onChange={(e) =>
                  setSelectedContentCursoId(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
              >
                <option value="">Selecione...</option>
                {cursos.map((c) => (
                  <option key={c.ID_Curso} value={c.ID_Curso}>
                    {c.Titulo}
                  </option>
                ))}
              </select>
            </div>

            {isAdminOrInstructor && selectedContentCursoId && (
              <>
                {/* Formulário para Adicionar Módulo */}
                <div className="glass-panel p-4 mb-4">
                  <h6 className="text-white fw-bold mb-3">
                    <i className="bi bi-folder-plus text-primary"></i> Adicionar
                    Módulo
                  </h6>
                  <form onSubmit={handleAddModule}>
                    <div className="mb-2">
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        placeholder="Título do Módulo"
                        value={modTitulo}
                        onChange={(e) => setModTitulo(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <input
                        type="number"
                        className="form-control form-control-custom"
                        placeholder="Ordem (sequência)"
                        value={modOrdem}
                        onChange={(e) => setModOrdem(Number(e.target.value))}
                        min="1"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-sm btn-gradient-primary w-100"
                    >
                      Criar Módulo
                    </button>
                  </form>
                </div>

                {/* Formulário para Adicionar Aula */}
                <div className="glass-panel p-4">
                  <h6 className="text-white fw-bold mb-3">
                    <i className="bi bi-file-earmark-plus text-secondary"></i>{" "}
                    Adicionar Aula
                  </h6>
                  <form onSubmit={handleAddAula}>
                    <div className="mb-2">
                      <select
                        className="form-select form-select-custom"
                        value={aulaModId}
                        onChange={(e) =>
                          setAulaModId(
                            e.target.value ? Number(e.target.value) : "",
                          )
                        }
                        required
                      >
                        <option value="">Selecione o Módulo *</option>
                        {modulos.map((m) => (
                          <option key={m.ID_Modulo} value={m.ID_Modulo}>
                            Mód. {m.Ordem}: {m.Titulo}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-2">
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        placeholder="Título da Aula"
                        value={aulaTitulo}
                        onChange={(e) => setAulaTitulo(e.target.value)}
                        required
                      />
                    </div>
                    <div className="mb-2">
                      <select
                        className="form-select form-select-custom"
                        value={aulaTipo}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          setAulaTipo(
                            e.target.value as "Vídeo" | "Texto" | "Quiz",
                          )
                        }
                      >
                        <option value="Vídeo">Vídeo (URL incorporada)</option>
                        <option value="Texto">Texto / Artigo</option>
                        <option value="Quiz">Quiz de Múltipla Escolha</option>
                      </select>
                    </div>
                    <div className="mb-2">
                      <input
                        type="text"
                        className="form-control form-control-custom"
                        placeholder={
                          aulaTipo === "Vídeo"
                            ? "URL do Youtube Embed"
                            : "Conteúdo de texto do módulo"
                        }
                        value={aulaUrl}
                        onChange={(e) => setAulaUrl(e.target.value)}
                        required
                      />
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <input
                          type="number"
                          className="form-control form-control-custom"
                          placeholder="Minutos"
                          value={aulaDuracao}
                          onChange={(e) =>
                            setAulaDuracao(Number(e.target.value))
                          }
                          min="1"
                          required
                        />
                      </div>
                      <div className="col-6">
                        <input
                          type="number"
                          className="form-control form-control-custom"
                          placeholder="Ordem"
                          value={aulaOrdem}
                          onChange={(e) => setAulaOrdem(Number(e.target.value))}
                          min="1"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-sm btn-gradient-secondary w-100"
                    >
                      Criar Aula
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>

          {/* Hierarquia */}
          <div className="col-lg-8">
            <div className="glass-panel p-4 h-100">
              <h5 className="text-white fw-bold mb-4">
                <i className="bi bi-list-ol"></i> Grade Curricular do Curso
              </h5>

              {!selectedContentCursoId ? (
                <p className="text-secondary">
                  Selecione um curso para ver seus módulos e aulas.
                </p>
              ) : modulos.length === 0 ? (
                <div className="text-center py-5">
                  <i className="bi bi-layout-text-sidebar-reverse fs-1 text-secondary"></i>
                  <p className="text-secondary mt-2">
                    Nenhum módulo criado para este curso.
                  </p>
                </div>
              ) : (
                <div className="accordion" id="accordionModules">
                  {modulos.map((mod) => {
                    const modAulas = aulas.filter(
                      (a) => a.ID_Modulo === mod.ID_Modulo,
                    );
                    return (
                      <div
                        className="accordion-item bg-transparent border-secondary mb-3 rounded overflow-hidden"
                        key={mod.ID_Modulo}
                      >
                        <h2
                          className="accordion-header"
                          id={`heading-${mod.ID_Modulo}`}
                        >
                          <button
                            className="accordion-button bg-black bg-opacity-20 text-white border-0 py-3 d-flex justify-content-between align-items-center"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target={`#collapse-${mod.ID_Modulo}`}
                            aria-expanded="true"
                            aria-controls={`collapse-${mod.ID_Modulo}`}
                          >
                            <div className="d-flex justify-content-between align-items-center w-100 pe-3">
                              <span>
                                <span className="text-warning fw-bold me-2">
                                  Módulo {mod.Ordem}:
                                </span>
                                <strong>{mod.Titulo}</strong>
                              </span>
                              <span className="badge bg-secondary fs-9">
                                {modAulas.length} aulas
                              </span>
                            </div>
                          </button>
                        </h2>

                        <div
                          id={`collapse-${mod.ID_Modulo}`}
                          className="accordion-collapse collapse show"
                          aria-labelledby={`heading-${mod.ID_Modulo}`}
                        >
                          <div className="accordion-body bg-black bg-opacity-10 p-3">
                            {/* Ação para excluir módulo */}
                            {isAdminOrInstructor && (
                              <div className="d-flex justify-content-end mb-2">
                                <button
                                  className="btn btn-sm btn-outline-danger py-0 px-2 fs-9"
                                  onClick={() =>
                                    handleDeleteModule(mod.ID_Modulo)
                                  }
                                >
                                  <i className="bi bi-trash"></i> Excluir Módulo
                                </button>
                              </div>
                            )}

                            {modAulas.length === 0 ? (
                              <p className="text-secondary fs-8 mb-0">
                                Nenhuma aula neste módulo.
                              </p>
                            ) : (
                              <div className="list-group list-group-flush">
                                {modAulas.map((aula) => (
                                  <div
                                    key={aula.ID_Aula}
                                    className="list-group-item bg-transparent text-white border-secondary-subtle py-2 px-1 d-flex justify-content-between align-items-center flex-wrap gap-2"
                                  >
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="text-secondary fs-8 fw-bold">
                                        #{aula.Ordem}
                                      </span>
                                      <i
                                        className={`bi ${
                                          aula.TipoConteudo === "Vídeo"
                                            ? "bi-play-btn-fill text-primary"
                                            : aula.TipoConteudo === "Quiz"
                                              ? "bi-question-circle-fill text-warning"
                                              : "bi-file-text-fill text-info"
                                        }`}
                                      ></i>
                                      <span className="fs-7">
                                        {aula.Titulo}
                                      </span>
                                      <span className="text-secondary fs-9">
                                        ({aula.DuracaoMinutos} min)
                                      </span>
                                    </div>
                                    {isAdminOrInstructor && (
                                      <button
                                        onClick={() =>
                                          handleDeleteAula(aula.ID_Aula)
                                        }
                                        className="btn btn-sm btn-outline-danger py-0 px-1"
                                      >
                                        <i className="bi bi-x fs-8"></i>
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
