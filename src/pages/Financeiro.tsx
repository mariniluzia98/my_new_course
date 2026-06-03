import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Plano, Assinatura, Pagamento } from '../types';
import { useActiveUser } from '../context/ActiveUserContext';

export const Financeiro: React.FC = () => {
  const { currentUser } = useActiveUser();

  const [planos, setPlanos] = useState<Plano[]>([]);
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Checkout states
  const [selectedPlano, setSelectedPlano] = useState<Plano | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cartão de Crédito');
  const [processing, setProcessing] = useState(false);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const [allPlans, allSubs, allPayments] = await Promise.all([
        api.getPlanos(),
        api.getAssinaturas(),
        api.getPagamentos()
      ]);
      setPlanos(allPlans);
      setAssinaturas(allSubs);
      setPagamentos(allPayments);
    } catch (err) {
      console.error('Erro ao buscar dados financeiros:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, []);

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedPlano) return;

    setProcessing(true);
    try {
      // 1. Create Simulated Subscription
      const newSub = await api.createAssinatura(
        currentUser.ID_Usuario,
        selectedPlano.ID_Plano,
        selectedPlano.DuracaoMeses
      );

      // 2. Create Simulated Payment linked to subscription
      await api.createPagamento(
        newSub.ID_Assinatura,
        selectedPlano.Preco,
        paymentMethod
      );

      alert(`Pagamento simulado com sucesso!\nPlano "${selectedPlano.Nome}" ativado para o seu perfil.`);
      setSelectedPlano(null);
      setCardName('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      
      // Reload lists
      await loadFinancialData();
    } catch (err) {
      console.error('Erro no checkout financeiro:', err);
      alert('Houve um erro no processamento do checkout.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-50">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando painel financeiro...</span>
        </div>
      </div>
    );
  }

  // Find active subscription for user
  const userSubs = assinaturas.filter(s => s.ID_Usuario === currentUser?.ID_Usuario);
  
  // Get active subscription (most recent end date or just last one)
  const activeSub = userSubs.length > 0 ? userSubs[userSubs.length - 1] : null;
  const activePlano = activeSub ? planos.find(p => p.ID_Plano === activeSub.ID_Plano) : null;

  // Filter payments related to user's subscriptions
  const userSubIds = userSubs.map(s => s.ID_Assinatura);
  const userPayments = pagamentos.filter(p => userSubIds.includes(p.ID_Assinatura));

  return (
    <div className="container">
      {/* Title */}
      <div className="row mb-4">
        <div className="col-12">
          <h2 className="text-white fw-bold">Módulo Financeiro & Assinaturas</h2>
          <p className="text-secondary">Simule o fluxo de cobrança recorrente, selecione planos de assinatura e confira o histórico de transações.</p>
        </div>
      </div>

      {/* User Subscription Status Alert Card */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="glass-panel p-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
              <div className="rounded-circle bg-secondary bg-opacity-20 p-3 text-warning">
                <i className="bi bi-wallet2 fs-2"></i>
              </div>
              <div>
                <span className="text-secondary fs-8 uppercase tracking-widest d-block">Status de Assinatura</span>
                {activeSub && activePlano ? (
                  <h4 className="text-white fw-bold mb-0">
                    Plano Ativo: <span className="text-gradient-secondary">{activePlano.Nome}</span>
                  </h4>
                ) : (
                  <h4 className="text-white fw-bold mb-0">Nenhum Plano Ativo</h4>
                )}
                {activeSub && (
                  <span className="text-secondary fs-7">
                    Válido de: {activeSub.DataInicio} até: {activeSub.DataFim}
                  </span>
                )}
              </div>
            </div>
            <div>
              <span className={`badge badge-custom py-2 px-3 ${activeSub ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
                {activeSub ? 'Assinatura Ativa' : 'Sem Acesso Premium'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Plans Section */}
      <div className="row mb-5">
        <div className="col-12">
          <h4 className="text-white fw-bold mb-4"><i className="bi bi-tags"></i> Planos Disponíveis</h4>
          <div className="row g-4 justify-content-center">
            {planos.map(plano => {
              const isCurrent = activeSub?.ID_Plano === plano.ID_Plano;
              return (
                <div className="col-md-4" key={plano.ID_Plano}>
                  <div className={`card glass-panel h-100 border-0 ${isCurrent ? 'border-primary' : ''}`} style={{ borderTop: isCurrent ? '4px solid #7c3aed' : 'none' }}>
                    <div className="card-body p-4 text-center d-flex flex-column justify-content-between">
                      <div>
                        <h5 className="text-white fw-bold mb-2">{plano.Nome}</h5>
                        <p className="text-secondary fs-7 mb-4" style={{ minHeight: '60px' }}>{plano.Descricao}</p>
                        
                        <div className="mb-4">
                          <span className="fs-2 fw-extrabold text-white">R$ {plano.Preco.toFixed(2)}</span>
                          <span className="text-secondary fs-8 d-block">Cobrança única de {plano.DuracaoMeses} {plano.DuracaoMeses === 1 ? 'mês' : 'meses'}</span>
                        </div>
                      </div>

                      <div>
                        {isCurrent ? (
                          <button className="btn btn-success w-100 disabled" disabled>
                            Seu Plano Atual
                          </button>
                        ) : (
                          <button 
                            onClick={() => setSelectedPlano(plano)} 
                            className="btn btn-gradient-primary w-100"
                          >
                            Assinar Agora
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Checkout and History Row */}
      <div className="row g-4">
        {/* Checkout Modal Frame */}
        {selectedPlano && (
          <div className="col-lg-6">
            <div className="glass-panel p-4">
              <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-4">
                <h5 className="text-white fw-bold m-0"><i className="bi bi-cart-check"></i> Checkout Simulado</h5>
                <button className="btn btn-sm btn-outline-danger py-0 px-2" onClick={() => setSelectedPlano(null)}>Fechar</button>
              </div>

              <div className="alert alert-secondary fs-7 mb-4 border-secondary bg-transparent">
                Você está adquirindo a assinatura do plano <strong>"{selectedPlano.Nome}"</strong> por <strong>R$ {selectedPlano.Preco.toFixed(2)}</strong>.
              </div>

              <form onSubmit={handleSimulatePayment}>
                <div className="mb-3">
                  <label className="text-secondary fs-8 mb-1">Nome no Cartão</label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="Ana Silva"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="text-secondary fs-8 mb-1">Número do Cartão (Simulado)</label>
                  <input
                    type="text"
                    className="form-control form-control-custom"
                    placeholder="4444 5555 6666 7777"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="row g-2 mb-4">
                  <div className="col-6">
                    <label className="text-secondary fs-8 mb-1">Validade (MM/AA)</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      placeholder="12/30"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-6">
                    <label className="text-secondary fs-8 mb-1">CVV</label>
                    <input
                      type="password"
                      className="form-control form-control-custom"
                      placeholder="123"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-secondary fs-8 mb-1">Método</label>
                  <select
                    className="form-select form-select-custom"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Pix">Pix (Instantâneo)</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={processing}
                  className="btn btn-gradient-secondary w-100 py-3"
                >
                  {processing ? 'Processando transação...' : `Pagar R$ ${selectedPlano.Preco.toFixed(2)}`}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Transaction History ledger */}
        <div className={selectedPlano ? 'col-lg-6' : 'col-12'}>
          <div className="glass-panel p-4 h-100">
            <h5 className="text-white fw-bold mb-4"><i className="bi bi-receipt"></i> Seus Pagamentos e Transações</h5>
            {userPayments.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-wallet2 fs-1 text-secondary mb-3 d-block"></i>
                <p className="text-secondary">Nenhuma transação financeira encontrada para este usuário.</p>
              </div>
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
                    {userPayments.map(pay => (
                      <tr key={pay.ID_Pagamento}>
                        <td>
                          <span className="font-monospace text-warning fs-8">{pay.Id_Transacao_Gateway}</span>
                        </td>
                        <td className="text-success fw-bold">R$ {pay.ValorPago.toFixed(2)}</td>
                        <td>{new Date(pay.DataPagamento).toLocaleDateString('pt-BR')}</td>
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
    </div>
  );
};
