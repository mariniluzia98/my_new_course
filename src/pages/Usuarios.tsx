import React, { useState, useEffect } from "react";
import { api } from "../types";
import type { Usuario, Plano, Matricula, Curso } from "../types";
import { useActiveUser } from "../context/useActiveUser";

export const Usuarios: React.FC = () => {
  const { reloadUsuarios } = useActiveUser();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for Create/Edit User
  const [userId, setUserId] = useState<number | null>(null);
  const [backendUserId, setBackendUserId] = useState<number | string | null>(
    null,
  );
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [cargo, setCargo] = useState<"Aluno" | "Instrutor" | "Admin">("Aluno");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal Enroll states
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [enrollType, setEnrollType] = useState<"curso" | "plano">("curso");
  const [selectedCursoId, setSelectedCursoId] = useState<number | "">("");
  const [selectedPlanoId, setSelectedPlanoId] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState("Cartão de Crédito");

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [allUsers, allCourses, allPlans, allEnrollments] =
        await Promise.all([
          api.getUsuarios(),
          api.getCursos(),
          api.getPlanos(),
          api.getMatriculas(),
        ]);
      setUsuarios(allUsers);
      setCursos(allCourses);
      setPlanos(allPlans);
      setMatriculas(allEnrollments);
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await loadData();
    };

    void load();
  }, [loadData]);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!nomeCompleto || !email || (!userId && !senha)) {
      setErrorMsg("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    // Check unique email (ignore self if editing)
    const emailExists = usuarios.some(
      (u) =>
        u.Email.toLowerCase() === email.toLowerCase() &&
        u.ID_Usuario !== userId,
    );
    if (emailExists) {
      setErrorMsg("Este e-mail já está cadastrado por outro usuário.");
      return;
    }

    try {
      if (backendUserId) {
        // Edit Mode
        const updateData: Partial<Usuario> = {
          NomeCompleto: nomeCompleto,
          Email: email,
          Cargo: cargo,
        };
        if (senha) updateData.SenhaHash = senha; // Update password only if provided

        await api.updateUsuario(backendUserId, updateData);
        setSuccessMsg("Usuário atualizado com sucesso!");
      } else {
        // Create Mode
        await api.createUsuario({
          NomeCompleto: nomeCompleto,
          Email: email,
          SenhaHash: senha,
          Cargo: cargo,
        });
        setSuccessMsg("Usuário cadastrado com sucesso!");
      }

      // Reset form
      setUserId(null);
      setBackendUserId(null);
      setNomeCompleto("");
      setEmail("");
      setSenha("");
      setCargo("Aluno");

      // Refresh
      await loadData();
      await reloadUsuarios();
    } catch (err) {
      console.error("Erro ao salvar usuário:", err);
      setErrorMsg("Houve um erro ao salvar o usuário. Tente novamente.");
    }
  };

  const handleEditUser = (user: Usuario) => {
    setUserId(user.ID_Usuario);
    setBackendUserId(user.id);
    setNomeCompleto(user.NomeCompleto);
    setEmail(user.Email);
    setSenha(""); // Keep blank unless resetting
    setCargo(user.Cargo);
    setSuccessMsg("");
    setErrorMsg("");
  };

  const handleDeleteUser = async (id: number | string) => {
    if (
      window.confirm(
        "Tem certeza que deseja excluir este usuário? Todas as matrículas e progressos relacionados poderão ficar órfãos.",
      )
    ) {
      try {
        await api.deleteUsuario(id);
        setSuccessMsg("Usuário excluído com sucesso!");
        if (backendUserId === id) {
          // If editing the deleted user, reset form
          setUserId(null);
          setBackendUserId(null);
          setNomeCompleto("");
          setEmail("");
          setSenha("");
          setCargo("Aluno");
        }
        await loadData();
        await reloadUsuarios();
      } catch (err) {
        console.error("Erro ao deletar usuário:", err);
        setErrorMsg("Erro ao excluir usuário.");
      }
    }
  };

  const handleSimulateEnroll = async () => {
    if (!selectedUser) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (enrollType === "curso") {
        if (!selectedCursoId) {
          alert("Selecione um curso.");
          return;
        }

        // Check if already enrolled
        const alreadyEnrolled = matriculas.some(
          (m) =>
            m.ID_Usuario === selectedUser.ID_Usuario &&
            m.ID_Curso === Number(selectedCursoId),
        );

        if (alreadyEnrolled) {
          alert("O usuário já está matriculado neste curso!");
          return;
        }

        await api.createMatricula(
          selectedUser.ID_Usuario,
          Number(selectedCursoId),
        );
        alert("Matrícula efetuada com sucesso!");
      } else {
        // Plan Subscription
        if (!selectedPlanoId) {
          alert("Selecione um plano.");
          return;
        }

        const plano = planos.find(
          (p) => p.ID_Plano === Number(selectedPlanoId),
        );
        if (!plano) return;

        // 1. Create subscription
        const assinatura = await api.createAssinatura(
          selectedUser.ID_Usuario,
          plano.ID_Plano,
          plano.DuracaoMeses,
        );

        // 2. Create simulated payment
        await api.createPagamento(
          assinatura.ID_Assinatura,
          plano.Preco,
          paymentMethod,
        );

        alert(
          `Assinatura do plano "${plano.Nome}" efetuada com sucesso!\nTransação financeira gerada.`,
        );
      }

      // Close modal by trigger click or state reset
      setSelectedUser(null);
      setSelectedCursoId("");
      setSelectedPlanoId("");

      // Refresh
      await loadData();
    } catch (err) {
      console.error("Erro na matrícula/assinatura:", err);
      alert("Erro ao realizar a operação de matrícula.");
    }
  };

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
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="text-white fw-bold">
            Módulo de Usuários e Matrículas
          </h2>
          <p className="text-secondary">
            Cadastre usuários, edite perfis e gerencie matrículas em cursos ou
            planos de assinatura.
          </p>
        </div>
      </div>

      <div className="row g-4">
        {/* Save/Edit Form Panel */}
        <div className="col-lg-4">
          <div className="glass-panel p-4">
            <h5 className="text-white fw-bold mb-4">
              {userId ? (
                <>
                  <i className="bi bi-pencil-square text-warning"></i> Editar
                  Usuário
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus-fill text-primary"></i>{" "}
                  Cadastrar Usuário
                </>
              )}
            </h5>

            {errorMsg && (
              <div className="alert alert-danger fs-7 py-2">{errorMsg}</div>
            )}
            {successMsg && (
              <div className="alert alert-success fs-7 py-2">{successMsg}</div>
            )}

            <form onSubmit={handleSaveUser}>
              <div className="mb-3">
                <label className="text-secondary fs-8 fw-semibold mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  className="form-control form-control-custom"
                  placeholder="Ex: Ana Silva"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="text-secondary fs-8 fw-semibold mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  className="form-control form-control-custom"
                  placeholder="Ex: ana@dev.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="text-secondary fs-8 fw-semibold mb-1">
                  Senha {userId ? "(Deixe em branco para manter)" : "*"}
                </label>
                <input
                  type="password"
                  className="form-control form-control-custom"
                  placeholder={userId ? "••••••••" : "Senha de acesso"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required={!userId}
                />
              </div>

              <div className="mb-4">
                <label className="text-secondary fs-8 fw-semibold mb-1">
                  Cargo / Nível de Acesso *
                </label>
                <select
                  className="form-select form-select-custom"
                  value={cargo}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setCargo(e.target.value as "Aluno" | "Instrutor" | "Admin")
                  }
                >
                  <option value="Aluno">Aluno</option>
                  <option value="Instrutor">Instrutor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-gradient-primary flex-grow-1"
                >
                  {userId ? "Salvar Alterações" : "Cadastrar"}
                </button>
                {userId && (
                  <button
                    type="button"
                    className="btn btn-outline-custom"
                    onClick={() => {
                      setUserId(null);
                      setNomeCompleto("");
                      setEmail("");
                      setSenha("");
                      setCargo("Aluno");
                      setSuccessMsg("");
                      setErrorMsg("");
                    }}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* User Directory List */}
        <div className="col-lg-8">
          <div className="glass-panel p-4 h-100">
            <h5 className="text-white fw-bold mb-4">
              <i className="bi bi-people"></i> Diretório de Usuários
            </h5>

            <div className="table-responsive">
              <table className="table table-dark table-hover table-custom m-0">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Cargo</th>
                    <th>Cadastro</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((user) => (
                    <tr key={user.ID_Usuario}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            className="avatar-circle rounded-circle bg-secondary d-flex align-items-center justify-content-center text-white fw-bold fs-8"
                            style={{ width: "28px", height: "28px" }}
                          >
                            {user.NomeCompleto[0].toUpperCase()}
                          </div>
                          <span className="fw-semibold text-white">
                            {user.NomeCompleto}
                          </span>
                        </div>
                      </td>
                      <td className="text-secondary">{user.Email}</td>
                      <td>
                        <span
                          className={`badge badge-custom ${
                            user.Cargo === "Admin"
                              ? "bg-danger text-white"
                              : user.Cargo === "Instrutor"
                                ? "bg-info text-dark"
                                : "bg-primary text-white"
                          }`}
                          style={{ fontSize: "0.65rem" }}
                        >
                          {user.Cargo}
                        </span>
                      </td>
                      <td className="text-secondary fs-8">
                        {new Date(user.DataCadastro).toLocaleDateString(
                          "pt-BR",
                        )}
                      </td>
                      <td>
                        <div className="d-flex justify-content-end gap-2">
                          {user.Cargo === "Aluno" && (
                            <button
                              className="btn btn-sm btn-gradient-secondary py-1 px-2"
                              style={{ fontSize: "0.75rem" }}
                              onClick={() => setSelectedUser(user)}
                            >
                              <i className="bi bi-mortarboard-fill"></i>{" "}
                              Matricular
                            </button>
                          )}
                          <button
                            className="btn btn-sm btn-outline-custom py-1 px-2"
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => handleEditUser(user)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger py-1 px-2"
                            style={{ fontSize: "0.75rem" }}
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Enrollment Simulation Modal (Rendered when selectedUser is not null) */}
      {selectedUser && (
        <div
          className="modal show d-block"
          style={{
            backgroundColor: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(5px)",
          }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-panel border-secondary">
              <div className="modal-header border-secondary">
                <h5 className="modal-title text-white fw-bold">
                  Matricular / Inscrever Aluno:{" "}
                  <span className="text-gradient-primary">
                    {selectedUser.NomeCompleto}
                  </span>
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedUser(null)}
                  aria-label="Close"
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="text-secondary fs-8 fw-semibold mb-1">
                    Tipo de Ingresso
                  </label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn flex-grow-1 ${enrollType === "curso" ? "btn-gradient-primary" : "btn-outline-custom"}`}
                      onClick={() => setEnrollType("curso")}
                    >
                      <i className="bi bi-journal-bookmark"></i> Curso
                      Individual
                    </button>
                    <button
                      type="button"
                      className={`btn flex-grow-1 ${enrollType === "plano" ? "btn-gradient-primary" : "btn-outline-custom"}`}
                      onClick={() => setEnrollType("plano")}
                    >
                      <i className="bi bi-credit-card-2-front"></i> Plano de
                      Assinatura
                    </button>
                  </div>
                </div>

                {enrollType === "curso" ? (
                  <div className="mb-3">
                    <label className="text-secondary fs-8 fw-semibold mb-1">
                      Selecione o Curso *
                    </label>
                    <select
                      className="form-select form-select-custom"
                      value={selectedCursoId}
                      onChange={(e) =>
                        setSelectedCursoId(Number(e.target.value))
                      }
                    >
                      <option value="">Selecione um curso...</option>
                      {cursos.map((c) => (
                        <option key={c.ID_Curso} value={c.ID_Curso}>
                          {c.Titulo} ({c.Nivel})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <>
                    <div className="mb-3">
                      <label className="text-secondary fs-8 fw-semibold mb-1">
                        Selecione o Plano *
                      </label>
                      <select
                        className="form-select form-select-custom"
                        value={selectedPlanoId}
                        onChange={(e) =>
                          setSelectedPlanoId(Number(e.target.value))
                        }
                      >
                        <option value="">Selecione um plano...</option>
                        {planos.map((p) => (
                          <option key={p.ID_Plano} value={p.ID_Plano}>
                            {p.Nome} - R$ {p.Preco.toFixed(2)} ({p.DuracaoMeses}{" "}
                            meses)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="text-secondary fs-8 fw-semibold mb-1">
                        Método de Pagamento
                      </label>
                      <select
                        className="form-select form-select-custom"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      >
                        <option value="Cartão de Crédito">
                          Cartão de Crédito
                        </option>
                        <option value="Pix">Pix (Instantâneo)</option>
                        <option value="Boleto Bancário">Boleto Bancário</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer border-secondary">
                <button
                  type="button"
                  className="btn btn-outline-custom"
                  onClick={() => setSelectedUser(null)}
                >
                  Fechar
                </button>
                <button
                  type="button"
                  className="btn btn-gradient-primary"
                  onClick={handleSimulateEnroll}
                >
                  Confirmar e Processar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
