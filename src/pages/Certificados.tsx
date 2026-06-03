import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Certificado, Usuario, Curso } from '../types';
import { useActiveUser } from '../context/ActiveUserContext';
import { CertificateCard } from '../components/CertificateCard';

export const Certificados: React.FC = () => {
  const { currentUser } = useActiveUser();

  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certificado | null>(null);

  // Validation Form states
  const [validationCode, setValidationCode] = useState('');
  const [validatedCert, setValidatedCert] = useState<Certificado | null>(null);
  const [validatedStudent, setValidatedStudent] = useState<Usuario | null>(null);
  const [validatedCourse, setValidatedCourse] = useState<Curso | null>(null);
  const [validationRun, setValidationRun] = useState(false);
  const [validationError, setValidationError] = useState(false);

  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allCerts, allUsers, allCourses] = await Promise.all([
        api.getCertificados(),
        api.getUsuarios(),
        api.getCursos()
      ]);
      setUsuarios(allUsers);
      setCursos(allCourses);

      if (currentUser) {
        const userCerts = allCerts.filter(c => c.ID_Usuario === currentUser.ID_Usuario);
        setCertificados(userCerts);
        if (userCerts.length > 0) {
          setSelectedCert(userCerts[0]);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar certificados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Clear validation on active user change
    setValidatedCert(null);
    setValidationRun(false);
  }, [currentUser]);

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validationCode) return;

    setValidatedCert(null);
    setValidationError(false);
    setValidationRun(true);

    try {
      const results = await api.validarCertificado(validationCode.trim());
      if (results.length > 0) {
        const cert = results[0];
        setValidatedCert(cert);

        // Find associated student and course
        const student = usuarios.find(u => u.ID_Usuario === cert.ID_Usuario);
        const course = cursos.find(c => c.ID_Curso === cert.ID_Curso);

        setValidatedStudent(student || null);
        setValidatedCourse(course || null);
      } else {
        setValidationError(true);
      }
    } catch (err) {
      console.error('Erro na validação do certificado:', err);
      setValidationError(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando certificados...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Title */}
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="text-white fw-bold">Central de Certificados</h2>
          <p className="text-secondary">Emita certificados de conclusão, visualize suas conquistas e verifique a validade de certificados emitidos.</p>
        </div>
      </div>

      <div className="row g-4">
        {/* Left column: User Certs & Validator */}
        <div className="col-lg-5">
          {/* Validator Panel */}
          <div className="glass-panel p-4 mb-4">
            <h5 className="text-white fw-bold mb-3"><i className="bi bi-shield-fill-check text-warning"></i> Validador de Certificados</h5>
            <p className="text-secondary fs-8">Insira o código de verificação para checar a validade do certificado emitido pela plataforma Curso_DEV.</p>
            
            <form onSubmit={handleValidateCode} className="d-flex gap-2">
              <input
                type="text"
                className="form-control form-control-custom py-2"
                placeholder="Ex: CERT-CRS-E453C9B8"
                value={validationCode}
                onChange={(e) => setValidationCode(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-gradient-primary">Validar</button>
            </form>

            {/* Validation Feedback */}
            {validationRun && (
              <div className="mt-4 border-top border-secondary pt-3">
                {validatedCert ? (
                  <div className="alert alert-success d-flex align-items-start gap-2 bg-success bg-opacity-10 border-success text-white">
                    <i className="bi bi-check-circle-fill text-success fs-4"></i>
                    <div>
                      <strong className="d-block text-success">✓ Certificado Autêntico!</strong>
                      <span className="fs-8 text-secondary d-block mt-1">
                        <strong>Estudante:</strong> {validatedStudent?.NomeCompleto || 'Desconhecido'}<br />
                        <strong>Curso:</strong> {validatedCourse?.Titulo || 'Desconhecido'}<br />
                        <strong>Emissão:</strong> {new Date(validatedCert.DataEmissao).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ) : validationError ? (
                  <div className="alert alert-danger d-flex align-items-start gap-2 bg-danger bg-opacity-10 border-danger text-white">
                    <i className="bi bi-exclamation-triangle-fill text-danger fs-4"></i>
                    <div>
                      <strong className="d-block text-danger">✗ Código Inválido</strong>
                      <span className="fs-8 text-secondary mt-1 d-block">
                        Este código não corresponde a nenhum certificado emitido pela plataforma. Verifique caracteres maiúsculos ou hífenes.
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* User Certificates List */}
          <div className="glass-panel p-4">
            <h5 className="text-white fw-bold mb-3"><i className="bi bi-award"></i> Suas Conquistas ({certificados.length})</h5>
            {certificados.length === 0 ? (
              <div className="text-center py-4">
                <i className="bi bi-award-fill text-secondary fs-1 mb-2 d-block"></i>
                <p className="text-secondary fs-7">Você ainda não emitiu nenhum certificado. Conclua 100% de um curso para desbloquear.</p>
              </div>
            ) : (
              <div className="list-group list-group-flush gap-1">
                {certificados.map(c => {
                  const course = cursos.find(cur => cur.ID_Curso === c.ID_Curso);
                  const isSelected = selectedCert?.ID_Certificado === c.ID_Certificado;
                  return (
                    <button
                      key={c.ID_Certificado}
                      onClick={() => setSelectedCert(c)}
                      className={`list-group-item list-group-item-action bg-transparent border-0 rounded text-start p-3 ${
                        isSelected ? 'bg-white bg-opacity-10 text-gradient-primary' : 'text-secondary'
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="text-white fw-bold fs-7">{course?.Titulo}</span>
                        <i className="bi bi-chevron-right text-secondary fs-8"></i>
                      </div>
                      <span className="text-secondary fs-8 font-monospace d-block">{c.CodigoVerificacao}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Interactive Cert Preview Frame */}
        <div className="col-lg-7">
          {selectedCert ? (
            <div>
              <h5 className="text-white fw-bold mb-3"><i className="bi bi-eye"></i> Visualização de Certificado</h5>
              <CertificateCard
                certificado={selectedCert}
                studentName={currentUser?.NomeCompleto || ''}
                courseTitle={cursos.find(c => c.ID_Curso === selectedCert.ID_Curso)?.Titulo || ''}
                dateEmitted={selectedCert.DataEmissao}
                onPrint={handlePrint}
              />
            </div>
          ) : (
            <div className="glass-panel p-5 h-100 d-flex flex-column justify-content-center align-items-center text-center">
              <i className="bi bi-award fs-1 text-secondary mb-3"></i>
              <h5>Selecione um certificado à esquerda para exibir</h5>
              <p className="text-secondary fs-7">Comprove suas competências técnicas compartilhando o código de autenticidade.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
