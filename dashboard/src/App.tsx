import { useState, useEffect } from 'react'
import { Fragment } from 'react';
import './App.css'

// 1. Definição da interface do Payload (os dados do sensor)
interface SensorPayload {
  batteryId: string;
  timestamp: string; // ISOString
  soh: number;       // State of Health
  u: number;         // Tensão (exemplo)
  s2: number;        // Outra métrica (exemplo)
}

// 2. Definição da interface completa que vem do PostgreSQL
interface Auditoria {
  id: number;
  tx_hash: string;
  block_number: number;
  sender: string;
  payload: SensorPayload; // Mapeamos o payload específico aqui
  created_at: string;
}

function App() {
  const [registros, setRegistros] = useState<Auditoria[]>([]);
  const [loading, setLoading] = useState(true);
  // Estado para controlar se o agrupamento está ativo
  const [isGrouped, setIsGrouped] = useState(false);

  const fetchRegistros = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/historico');
      const data = await response.json();
      setRegistros(data);
    } catch (error) {
      console.error("Erro ao buscar logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistros();
  }, []);

  // Lógica de agrupamento: Cria um objeto onde cada chave é um BatteryID
  const registrosAgrupados = registros.reduce((acc: { [key: string]: Auditoria[] }, reg) => {
    const id = reg.payload.batteryId;
    if (!acc[id]) acc[id] = [];
    acc[id].push(reg);
    return acc;
  }, {});

  const copiarHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
      .then(() => alert("Hash copiado!"))
      .catch(err => console.error('Erro ao copiar: ', err));
  };

  // Componente de linha para evitar repetição de código
  const RenderRow = ({ reg }: { reg: Auditoria }) => (
    <tr key={reg.id}>
      <td>{reg.payload.batteryId}</td>
      <td>{new Date(reg.payload.timestamp).toLocaleString()}</td>
      <td className="tx-hash-cell">
        <span className="tx-hash-short" title={reg.tx_hash}>
          {reg.tx_hash.substring(0, 8)}...{reg.tx_hash.substring(reg.tx_hash.length - 4)}
        </span>
        <button className="copy-btn" onClick={() => copiarHash(reg.tx_hash)}>📋</button>
      </td>
      <td>{reg.block_number}</td>
      <td className="payload-num soh-value">{reg.payload.soh}</td>
      <td className="payload-num">{reg.payload.u}</td>
      <td className="payload-num">{reg.payload.s2}</td>
    </tr>
  );

  return (
    <>
      <section id="center">
        <h1>Blockchain Audit Dashboard</h1>
        <p>Monitoramento imutável de sensores via Hyperledger Besu</p>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button className="counter" onClick={fetchRegistros} disabled={loading}>
            {loading ? '🔄 Carregando...' : '🔄 Atualizar Dados'}
          </button>
          <button className="counter" onClick={() => setIsGrouped(!isGrouped)}>
            {isGrouped ? '🔓 Desagrupar' : '📁 Agrupar por Bateria'}
          </button>
        </div>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div style={{ width: '100%', overflowX: 'auto' }}>
          <table className="audit-table">
            <thead>
              <tr>
                <th 
                  onClick={() => setIsGrouped(!isGrouped)} 
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  title="Clique para agrupar/desagrupar"
                >
                  Battery ID {isGrouped ? '▲' : '▼'}
                </th>
                <th>Timestamp</th>
                <th>Hash Transação</th>
                <th>Bloco</th>
                <th>Capacidade (Ah)</th>
                <th>u</th>
                <th>Variância</th>
              </tr>
            </thead>
            <tbody>
              {isGrouped ? (
                // Renderização Agrupada
                Object.keys(registrosAgrupados).map(batteryId => (
                  <Fragment key={batteryId}>
                    <tr style={{ backgroundColor: '#2a2a2a', fontWeight: 'bold' }}>
                      <td colSpan={7} style={{ color: '#00ff88', textAlign: 'left', paddingLeft: '1rem' }}>
                        📦 Bateria: {batteryId} ({registrosAgrupados[batteryId].length} registros)
                      </td>
                    </tr>
                    {registrosAgrupados[batteryId].map(reg => <RenderRow key={reg.id} reg={reg} />)}
                  </Fragment>
                ))
              ) : (
                // Renderização Normal (Lista Simples)
                registros.map((reg) => <RenderRow key={reg.id} reg={reg} />)
              )}
            </tbody>
          </table>
          
          {!loading && registros.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
              Nenhum registro encontrado.
            </div>
          )}
        </div>
      </section>
      <section id="spacer"></section>
    </>
  )
}

export default App
