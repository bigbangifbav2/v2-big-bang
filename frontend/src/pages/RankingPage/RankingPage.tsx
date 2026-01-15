import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// 1. Tipagem dos dados que vêm da API do Node.js
interface RankingEntry {
  usuario: string;
  pontuacao: number;
  nivel: 'INICIANTE' | 'CURIOSO' | 'CIENTISTA';
  data_hora: string;
}

// 2. Tipagem para o estado AGRUPADO
interface GroupedRanking {
  INICIANTE: RankingEntry[];
  CURIOSO: RankingEntry[];
  CIENTISTA: RankingEntry[];
}

const API_RANKING_URL = `${BASE_URL}/api/ranking`;

// Mapeamento dos níveis para os caminhos das imagens dos troféus
const TROPHY_MAP: Record<keyof GroupedRanking, string> = {
    INICIANTE: '/img/trofeu/bronze.png', 
    CIENTISTA: '/img/trofeu/ouro.png',   
    CURIOSO: '/img/trofeu/prata.png',    
};

const groupAndSortRanking = (entries: RankingEntry[]): GroupedRanking => {
  const grouped: GroupedRanking = {
    INICIANTE: [],
    CURIOSO: [],
    CIENTISTA: [],
  };

  entries.forEach(entry => {
    if (entry.nivel && (entry.nivel in grouped)) {
      grouped[entry.nivel].push(entry);
    }
  });

  // Ordena cada grupo individualmente por pontuação (maior primeiro)
  Object.values(grouped).forEach((list: RankingEntry[]) => {
    list.sort((a, b) => b.pontuacao - a.pontuacao);
  });

  return grouped;
};

// --- Componente para Renderizar uma Coluna Individual do Ranking ---
interface RankingColumnProps {
  level: keyof GroupedRanking;
  entries: RankingEntry[];
}

const RankingColumn: React.FC<RankingColumnProps> = ({ level, entries }) => {
    // Classe para estilização específica de cada nível (iniciante, cientista, curioso)
    const levelClass = level.toLowerCase();

    return (
        // Usa col-4 do Bootstrap, replicando a estrutura do PHP
        <div className="col-4">
            <div className="blocos">
                <br />
                {/* Imagem do Troféu - Caminho em public/ */}
                <img src={TROPHY_MAP[level]} width="48" height="66" alt={`Troféu ${level}`} />
                
                <div className={levelClass}>
                    <h5>{level}</h5>
                    <br />
                    
                    {/* Renderização da lista de jogadores */}
                    {entries.slice(0, 10).map((entry, index) => { // Limite Top 10
                        const position = index + 1;
                        // Lógica de Zebrar (cor1 e cor2) para alternar cores
                        const corClass = position % 2 === 0 ? 'cor1' : 'cor2';

                        return (
                            // Renderiza como <h6>, como no HTML legado
                            <h6 key={index} className={corClass}>
                                {position}. {entry.usuario} - {entry.pontuacao} pts
                            </h6>
                        );
                    })}
                    {entries.length === 0 && <h6 className="text-muted">Nenhum dado.</h6>}
                </div>
            </div>
        </div>
    );
};


// --- Componente Principal RankingPage ---
const RankingPage: React.FC = () => {
  const [groupedRanking, setGroupedRanking] = useState<GroupedRanking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ordem de exibição dos níveis: INICIANTE, CIENTISTA, CURIOSO
  const nivelOrder: Array<keyof GroupedRanking> = ['INICIANTE', 'CIENTISTA', 'CURIOSO'];

    useEffect(() => {
        // Se o usuário foi ver o ranking, ele perdeu o jogo atual.
        sessionStorage.removeItem('jogo_ativo');
    }, []);

  useEffect(() => {
          // 1. Adiciona a classe 'ranking-page-body' ao body ao montar o componente
          document.body.classList.add('ranking-page-body');

          // 2. Função de "limpeza": remove a classe ao desmontar (ao sair da página)
          return () => {
              document.body.classList.remove('ranking-page-body');
          };
      }, []);


  // Hook para buscar os dados da API
  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await fetch(API_RANKING_URL);
        
        if (!response.ok) {
          throw new Error(`Erro: ${response.status} - ${response.statusText}`);
        }
        
        const allEntries: RankingEntry[] = await response.json();
        
        setGroupedRanking(groupAndSortRanking(allEntries));

      } catch (err) {
        setError("Falha ao carregar o ranking. Verifique a API do Backend.");
        console.error("Erro no fetch:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  // Mensagens de Estado
  if (loading) {
    return <div className="text-center mt-5">Carregando Ranking...</div>;
  }
  if (error || !groupedRanking) {
    return <div className="text-center mt-5 text-danger">Erro: {error || "Dados de ranking indisponíveis."}</div>;
  }
  
  return (
    // Usa a classe 'barra' do CSS legado, que provavelmente define o fundo/tamanho
    <div className="barra"> 
        <div className="row justify-content-center">
            <div className="col-4">
                {/* Título Ranking em formato de Imagem */}
                <div><img id="ranking" src="/img/nome_ranking.png" alt="Ranking" /></div>
            </div>
        </div>

        {/* Linha para exibir os três rankings lado a lado */}
        <div className="row justify-content-center mt-4">
            {nivelOrder.map(nivel => (
                <RankingColumn 
                    key={nivel} 
                    level={nivel} 
                    entries={groupedRanking[nivel]} 
                />
            ))}
        </div>

        {/* Botão Voltar ao Menu */}
        <div className="row justify-content-start mt-5">
            <div className="col-2 offset-md-1"> 
                <div id="bt_voltar">
                    <Link to="/"><img className="efeito" src="/img/voltar.png" title="Voltar" alt="Voltar ao Menu" /></Link>
                </div>
            </div>
        </div>
    </div>
  );
};


export default RankingPage;