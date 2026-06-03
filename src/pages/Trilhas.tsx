import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Trilha, Curso, Categoria, TrilhaCurso } from '../types';
import { useActiveUser } from '../context/ActiveUserContext';

export const Trilhas: React.FC = () => {
  const { currentUser } = useActiveUser();
  const isAdminOrInstructor = currentUser?.Cargo === 'Admin' || currentUser?.Cargo === 'Instrutor';

  const [trilhas, setTrilhas] = useState<Trilha[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [trilhasCursos, setTrilhasCursos] = useState<TrilhaCurso[]>([]);
  const [selectedTrilhaId, setSelectedTrilhaId] = useState<number | null>(null);

  // Forms: Trilha
  const [trilhaId, setTrilhaId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [catId, setCatId] = useState<number | ''>('');

  // Forms: Vinculo Curso
  const [vincCursoId, setVincCursoId] = useState<number | ''>('');
  const [vincOrdem, setVincOrdem] = useState<number>(1);

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allTrails, allCourses, allCats, allTC] = await Promise.all([
        api.getTrilhas(),
        api.getCursos(),
        api.getCategorias(),
        api.getTrilhasCursos()
      ]);
      setTrilhas(allTrails);
      setCursos(allCourses);
      setCategorias(allCats);
      setTrilhasCursos(allTC);

      if (allTrails.length > 0 && !selectedTrilhaId) {
        setSelectedTrilhaId(allTrails[0].ID_Trilha);
      }
    } catch (err) {
      console.error('Erro ao carregar trilhas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveTrilha = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !catId) return;

    try {
      if (trilhaId) {
        await api.updateTrilha(trilhaId, { Titulo: titulo, Descricao: descricao, ID_Categoria: Number(catId) });
      } else {
        await api.createTrilha({ Titulo: titulo, Descricao: descricao, ID_Categoria: Number(catId) });
      }

      setTrilhaId(null);
      setTitulo('');
      setDescricao('');
      setCatId('');
      loadData();
      alert('Trilha salva com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar trilha.');
    }
  };

  const handleDeleteTrilha = async (id: number) => {
    if (window.confirm('Excluir esta trilha?')) {
      try {
        await api.deleteTrilha(id);
        if (selectedTrilhaId === id) setSelectedTrilhaId(null);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleVincularCurso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrilhaId || !vincCursoId) return;

    try {
      // Check if already in trail
      const exists = trilhasCursos.some(
        tc => tc.ID_Trilha === selectedTrilhaId && tc.ID_Curso === Number(vincCursoId)
      );

      if (exists) {
        alert('Este curso já está associado a esta trilha!');
        return;
      }

      await api.vincularCursoTrilha(selectedTrilhaId, Number(vincCursoId), Number(vincOrdem));
      setVincCursoId('');
      setVincOrdem(vincOrdem + 1);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDesvincularCurso = async (cursoId: number) => {
    if (!selectedTrilhaId) return;
    if (window.confirm('Tem certeza que deseja remover este curso da trilha?')) {
      try {
        await api.desvincularCursoTrilha(selectedTrilhaId, cursoId);
        loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const activeTrilha = trilhas.find(t => t.ID_Trilha === selectedTrilhaId);
  const activeTrilhaCursos = trilhasCursos
    .filter(tc => tc.ID_Trilha === selectedTrilhaId)
    .sort((a, b) => a.Ordem - b.Ordem);

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
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="text-white fw-bold">Módulo de Curadoria e Trilhas</h2>
          <p className="text-secondary">Crie trilhas de conhecimento integrando diversos cursos em uma jornada sequencial.</p>
        </div>
      </div>

      <div className="row g-4">
        {/* Left column - list & form */}
        <div className="col-lg-4">
          {/* Trilha Form */}
          {isAdminOrInstructor && (
            <div className="glass-panel p-4 mb-4">
              <h5 className="text-white fw-bold mb-3">{trilhaId ? 'Editar Trilha' : 'Nova Trilha de Conhecimento'}</h5>
              <form onSubmit={handleSaveTrilha}>
                <div className="mb-3">
                  <label className="text-secondary fs-8 mb-1">Título da Trilha *</label>
                  <input
                    type="text"
                    className="form-control form-control-custom py-2"
                    placeholder="Ex: Desenvolvedor React Pro"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="text-secondary fs-8 mb-1">Descrição</label>
                  <textarea
                    className="form-control form-control-custom py-2"
                    placeholder="Objetivo desta trilha..."
                    rows={2}
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                  ></textarea>
                </div>
                <div className="mb-4">
                  <label className="text-secondary fs-8 mb-1">Categoria Principal *</label>
                  <select
                    className="form-select form-select-custom"
                    value={catId}
                    onChange={(e) => setCatId(e.target.value ? Number(e.target.value) : '')}
                    required
                  >
                    <option value="">Selecione...</option>
                    {categorias.map(c => (
                      <option key={c.ID_Categoria} value={c.ID_Categoria}>{c.Nome}</option>
                    ))}
                  </select>
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-sm btn-gradient-primary flex-grow-1">Salvar</button>
                  {trilhaId && (
                    <button type="button" className="btn btn-sm btn-outline-custom" onClick={() => { setTrilhaId(null); setTitulo(''); setDescricao(''); setCatId(''); }}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* Trilhas selector */}
          <div className="glass-panel p-4">
            <h5 className="text-white fw-bold mb-3">Trilhas Cadastradas</h5>
            {trilhas.length === 0 ? (
              <p className="text-secondary fs-7">Nenhuma trilha encontrada.</p>
            ) : (
              <div className="list-group list-group-flush">
                {trilhas.map(t => {
                  const cat = categorias.find(c => c.ID_Categoria === t.ID_Categoria);
                  return (
                    <div
                      key={t.ID_Trilha}
                      className="list-group-item bg-transparent text-white border-secondary p-0 d-flex align-items-center"
                    >
                      <button
                        onClick={() => setSelectedTrilhaId(t.ID_Trilha)}
                        className={`btn text-start text-white bg-transparent border-0 flex-grow-1 py-3 d-flex justify-content-between align-items-center ${selectedTrilhaId === t.ID_Trilha ? 'fw-bold text-gradient-primary' : ''}`}
                      >
                        <span>
                          <i className="bi bi-map-fill me-2"></i> {t.Titulo}
                          {cat && <span className="badge bg-secondary-subtle text-secondary ms-2" style={{ fontSize: '0.65rem' }}>{cat.Nome}</span>}
                        </span>
                      </button>
                      {isAdminOrInstructor && (
                        <div className="pe-2 d-flex gap-1">
                          <button onClick={() => { setTrilhaId(t.ID_Trilha); setTitulo(t.Titulo); setDescricao(t.Descricao); setCatId(t.ID_Categoria); }} className="btn btn-sm btn-outline-custom py-0 px-1"><i className="bi bi-pencil fs-8"></i></button>
                          <button onClick={() => handleDeleteTrilha(t.ID_Trilha)} className="btn btn-sm btn-outline-danger py-0 px-1"><i className="bi bi-trash fs-8"></i></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column - interactive roadmap timeline */}
        <div className="col-lg-8">
          <div className="glass-panel p-4 h-100">
            {activeTrilha ? (
              <>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 border-bottom border-secondary pb-3 mb-4">
                  <div>
                    <span className="badge bg-secondary-subtle text-secondary badge-custom mb-2">
                      {categorias.find(c => c.ID_Categoria === activeTrilha.ID_Categoria)?.Nome || 'Geral'}
                    </span>
                    <h3 className="text-white fw-bold m-0">{activeTrilha.Titulo}</h3>
                    <p className="text-secondary fs-7 mt-1 mb-0">{activeTrilha.Descricao}</p>
                  </div>
                </div>

                {/* Linking form */}
                {isAdminOrInstructor && (
                  <div className="card bg-black bg-opacity-20 border border-secondary p-3 mb-4">
                    <h6 className="text-white fw-bold mb-2">Associar Curso à Trilha</h6>
                    <form onSubmit={handleVincularCurso} className="row g-2 align-items-end">
                      <div className="col-md-6">
                        <select
                          className="form-select form-select-custom py-2"
                          value={vincCursoId}
                          onChange={(e) => setVincCursoId(e.target.value ? Number(e.target.value) : '')}
                          required
                        >
                          <option value="">Selecione o Curso...</option>
                          {cursos.map(c => (
                            <option key={c.ID_Curso} value={c.ID_Curso}>{c.Titulo}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-3">
                        <input
                          type="number"
                          className="form-control form-control-custom py-2"
                          placeholder="Ordem"
                          value={vincOrdem}
                          onChange={(e) => setVincOrdem(Number(e.target.value))}
                          min="1"
                          required
                        />
                      </div>
                      <div className="col-md-3">
                        <button type="submit" className="btn btn-gradient-primary w-100 py-2">Vincular</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Timeline Roadmap */}
                <h5 className="text-white fw-bold mb-3"><i className="bi bi-signpost-split"></i> Mapa da Jornada</h5>
                
                {activeTrilhaCursos.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-compass fs-1 text-secondary"></i>
                    <p className="text-secondary mt-2">Nenhum curso associado a esta trilha ainda.</p>
                  </div>
                ) : (
                  <div className="timeline-trail mt-4">
                    {activeTrilhaCursos.map((tc) => {
                      const curso = cursos.find(c => c.ID_Curso === tc.ID_Curso);
                      if (!curso) return null;
                      return (
                        <div className="timeline-item-trail" key={tc.id}>
                          <div className="glass-panel p-3 d-flex justify-content-between align-items-center">
                            <div>
                              <span className="text-warning fw-bold fs-8 d-block mb-1">CURSO {tc.Ordem}</span>
                              <h5 className="text-white fw-bold mb-1">{curso.Titulo}</h5>
                              <div className="d-flex gap-2 text-secondary fs-8 align-items-center">
                                <span className="badge bg-secondary-subtle text-secondary">{curso.Nivel}</span>
                                <span>•</span>
                                <span><i className="bi bi-clock"></i> {curso.TotalHoras}h</span>
                                <span>•</span>
                                <span>{curso.TotalAulas} Aulas</span>
                              </div>
                            </div>
                            
                            {isAdminOrInstructor && (
                              <button
                                onClick={() => handleDesvincularCurso(curso.ID_Curso)}
                                className="btn btn-sm btn-outline-danger"
                                title="Desvincular Curso"
                              >
                                <i className="bi bi-x-lg"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <p className="text-secondary">Selecione uma trilha para gerenciar e visualizar a jornada.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
