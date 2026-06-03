import React from 'react';
import type { Curso } from '../types';

interface CardCursoProps {
  curso: Curso;
  categoriaNome: string;
  matriculado: boolean;
  progresso?: number; // 0 to 100
  onAction: () => void;
  actionText?: string;
}

export const CardCurso: React.FC<CardCursoProps> = ({
  curso,
  categoriaNome,
  matriculado,
  progresso = 0,
  onAction,
  actionText
}) => {
  const getNivelBadgeColor = (nivel: string) => {
    switch (nivel) {
      case 'Iniciante': return 'text-bg-success';
      case 'Intermediário': return 'text-bg-warning';
      case 'Avançado': return 'text-bg-danger';
      default: return 'text-bg-secondary';
    }
  };

  return (
    <div className="card glass-panel glass-panel-hover h-100 border-0 overflow-hidden">
      {/* Brilho Cabeçalho do Card */}
      <div className="position-relative" style={{ height: '8px', background: 'var(--primary-glow)' }}></div>
      
      <img
      src={curso.img}
      alt={curso.Titulo}
      className="card-img-top"
      style={{
      height: "220px",
      objectFit: "cover"
      }}
      />  
      <div className="card-body p-4 d-flex flex-column justify-content-between">
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="badge bg-secondary-subtle text-secondary badge-custom" style={{ fontSize: '0.75rem' }}>
              {categoriaNome}
            </span>
            <span className={`badge ${getNivelBadgeColor(curso.Nivel)} badge-custom`} style={{ fontSize: '0.75rem' }}>
              {curso.Nivel}
            </span>
          </div>

          <h5 className="card-title text-primary-emphasis fw-bold mb-2">{curso.Titulo}</h5>
          <p className="card-text text-secondary fs-7 mb-4 line-clamp-3" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {curso.Descricao}
          </p>
        </div>

        <div>
          {/* Meta Dados */}
          <div className="d-flex gap-3 text-secondary fs-7 mb-4 border-top pt-3 border-secondary-subtle">
            <div className="d-flex align-items-center gap-1">
              <i className="bi bi-play-circle-fill text-violet-500"></i>
              <span>{curso.TotalAulas} Aulas</span>
            </div>
            <div className="d-flex align-items-center gap-1">
              <i className="bi bi-clock-fill"></i>
              <span>{curso.TotalHoras} Horas</span>
            </div>
          </div>

          {/* Barra de Progresso (se matriculado) */}
          {matriculado && (
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary fs-8">Seu Progresso</span>
                <span className="text-white fw-semibold fs-8">{Math.round(progresso)}%</span>
              </div>
              <div className="progress bg-dark-subtle" style={{ height: '6px', borderRadius: '3px' }}>
                <div 
                  className="progress-bar" 
                  role="progressbar" 
                  style={{ 
                    width: `${progresso}%`,
                    background: 'var(--primary-glow)',
                    borderRadius: '3px'
                  }} 
                  aria-valuenow={progresso} 
                  aria-valuemin={0} 
                  aria-valuemax={100}
                ></div>
              </div>
            </div>
          )}

          {/* Botão de Ação */}
          <button 
            onClick={onAction}
            className={`w-100 ${matriculado ? 'btn-gradient-primary' : 'btn-outline-custom'}`}
          >
            {actionText || (matriculado ? 'Entrar na Sala' : 'Ver Detalhes')}
          </button>
        </div>
      </div>
    </div>
  );
};
