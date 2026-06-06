import React from "react";
import type { Certificado } from "../types";

interface CertificateCardProps {
  certificado: Certificado;
  studentName: string;
  courseTitle: string;
  dateEmitted: string;
  onPrint?: () => void;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificado,
  studentName,
  courseTitle,
  dateEmitted,
  onPrint,
}) => {
  const formattedDate = new Date(dateEmitted).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="card glass-panel border-0 overflow-hidden shadow-lg mb-4">
      <div className="card-body p-1">
        {/* Certificate Container */}
        <div className="certificate-preview-bg text-center text-white position-relative">
          {/* Top Decorative Star */}
          <div className="mb-3 text-warning">
            <i className="bi bi-award-fill" style={{ fontSize: "3rem" }}></i>
          </div>

          <h2
            className="text-uppercase fw-extrabold tracking-widest text-warning mb-2"
            style={{ fontFamily: "serif" }}
          >
            Certificado de Conclusão
          </h2>
          <p className="text-secondary fs-6 mb-4">
            Certificamos para os devidos fins de comprovação que
          </p>

          <h3 className="text-white fw-bold mb-3 fs-2 text-gradient-primary">
            {studentName}
          </h3>

          <p
            className="text-secondary mx-auto mb-4"
            style={{ maxWidth: "600px", lineHeight: "1.6" }}
          >
            concluiu com êxito todas as etapas de aprendizagem exigidas para o
            curso livre de aperfeiçoamento profissional em
            <strong className="d-block text-white fs-5 mt-2 fw-semibold">
              {courseTitle}
            </strong>
          </p>

          <div className="row mt-5 mb-4 align-items-center">
            {/* Left signature placeholder */}
            <div className="col-4">
              <div
                className="border-bottom border-secondary mx-auto pb-1"
                style={{ maxWidth: "150px" }}
              >
                <span className="fst-italic text-secondary fs-8">
                  Curso_DEV
                </span>
              </div>
              <span className="text-secondary fs-8 d-block mt-1">
                Diretor Acadêmico
              </span>
            </div>

            {/* Center stamp */}
            <div className="col-4 d-flex justify-content-center">
              <div
                className="rounded-circle border border-warning d-flex align-items-center justify-content-center text-warning"
                style={{
                  width: "80px",
                  height: "80px",
                  borderStyle: "double",
                  borderWidth: "3px",
                }}
              >
                <div
                  className="text-center"
                  style={{ fontSize: "0.6rem", fontWeight: "bold" }}
                >
                  VERIFICADO
                  <br />
                  <i className="bi bi-shield-fill-check fs-6 text-gradient-secondary"></i>
                </div>
              </div>
            </div>

            {/* Right Date */}
            <div className="col-4">
              <div
                className="border-bottom border-secondary mx-auto pb-1"
                style={{ maxWidth: "150px" }}
              >
                <span className="fw-semibold text-white fs-8">
                  {formattedDate}
                </span>
              </div>
              <span className="text-secondary fs-8 d-block mt-1">
                Data de Emissão
              </span>
            </div>
          </div>

          {/* Verification Code Footer */}
          <div className="mt-4 pt-3 border-top border-secondary-subtle">
            <span className="text-secondary fs-8">
              Código de Verificação:{" "}
              <strong className="text-warning">
                {certificado.CodigoVerificacao}
              </strong>
            </span>
            <div className="fs-8 text-secondary mt-1">
              Valide a autenticidade deste certificado na aba "Certificados"
              usando o código acima.
            </div>
          </div>
        </div>
      </div>

      {onPrint && (
        <div className="card-footer bg-transparent border-top border-secondary-subtle p-3 d-flex justify-content-end">
          <button
            onClick={onPrint}
            className="btn btn-outline-custom d-flex align-items-center gap-2"
          >
            <i className="bi bi-printer"></i> Imprimir / Salvar PDF
          </button>
        </div>
      )}
    </div>
  );
};
