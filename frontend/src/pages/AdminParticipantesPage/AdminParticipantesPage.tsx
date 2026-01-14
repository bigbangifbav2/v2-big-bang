import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ModalEditarNome from '../../components/ModalEditarNome/ModalEditarNome.tsx';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Participante {
    codRanking: number;
    usuario: string;
    pontuacao: number;
    nivel: string;
}

// Interface para ler as permissões do administrador logado
interface AdminLogado {
    id: number;
    isSuperAdmin: boolean;
    podeExcluirParticipantes: boolean; // <--- A permissão específica desta tela
}

interface RespostaAPI {
    data: Participante[];
    total: number;
    pagina: number;
    totalPaginas: number;
}

const AdminParticipantesPage: React.FC = () => {
    // Estados de Dados
    const [participantes, setParticipantes] = useState<Participante[]>([]);
    const [loading, setLoading] = useState(true);

    // Estados de Paginação
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    // Estado de Controle do Modal
    const [editingUser, setEditingUser] = useState<Participante | null>(null);

    // --- NOVO: Estado de Permissão ---
    const [podeExcluir, setPodeExcluir] = useState(false);

    // Carregar dados e permissões ao montar
    useEffect(() => {
        carregarPermissoes(); // <--- Lê o sessionStorage
        carregarParticipantes(paginaAtual);
    }, [paginaAtual]);

    // --- FUNÇÃO DE PERMISSÕES ---
    const carregarPermissoes = () => {
        const dadosString = sessionStorage.getItem('adminUser'); // Mesmo nome usado no Login
        if (dadosString) {
            try {
                const admin: AdminLogado = JSON.parse(dadosString);

                // Regra: Super Admin OU Permissão Específica
                const temPermissao = Boolean(admin.isSuperAdmin || admin.podeExcluirParticipantes);

                setPodeExcluir(temPermissao);
            } catch (e) {
                console.error("Erro ao ler permissões", e);
            }
        }
    };

    const carregarParticipantes = async (page: number) => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${BASE_URL}/api/participantes?page=${page}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const dados: RespostaAPI = await res.json();
                setParticipantes(dados.data);
                setTotalPaginas(dados.totalPaginas);
            }
        } catch (error) {
            console.error("Erro ao carregar", error);
            toast.error("Erro ao carregar lista.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (codRanking: number) => {
        if (!window.confirm('Tem certeza que deseja excluir este participante?')) return;

        try {
            const token = sessionStorage.getItem('token');
            await fetch(`${BASE_URL}/api/participantes/${codRanking}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Participante excluído!");
            carregarParticipantes(paginaAtual);
        } catch (error) {
            toast.error('Erro ao excluir.');
        }
    };

    const handleSalvarNome = async (novoNome: string) => {
        if (!editingUser) return;

        if (!novoNome.trim()) {
            toast.error("O nome não pode estar vazio");
            return;
        }

        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${BASE_URL}/api/participantes/${editingUser.codRanking}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ nome: novoNome })
            });

            if (res.ok) {
                toast.success(`Nome alterado para "${novoNome}"!`);
                carregarParticipantes(paginaAtual);
                setEditingUser(null);
            } else {
                toast.error("Erro ao atualizar nome.");
            }
        } catch (error) {
            toast.error('Erro de conexão.');
        }
    };

    const renderPaginacao = () => {
        if (totalPaginas <= 1) return null;

        return (
            <div className="d-flex justify-content-center mt-4 gap-2">
                <button
                    className="btn btn-outline-light btn-sm"
                    onClick={() => setPaginaAtual(paginaAtual - 1)}
                    disabled={paginaAtual === 1}
                >
                    Anterior
                </button>

                <span className="d-flex align-items-center px-3 text-white">
                    Página {paginaAtual} de {totalPaginas}
                </span>

                <button
                    className="btn btn-outline-light btn-sm"
                    onClick={() => setPaginaAtual(paginaAtual + 1)}
                    disabled={paginaAtual === totalPaginas}
                >
                    Próxima
                </button>
            </div>
        );
    };

    return (
        <div className="container mt-4">
            <h2 className="text-white mb-4">👥 Gerenciar Participantes</h2>

            {loading ? (
                <div className="text-center text-white">Carregando...</div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="table table-dark table-hover rounded overflow-hidden align-middle">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nome do Jogador</th>
                                <th>Pontuação</th>
                                <th>Nível Jogado</th>
                                <th className="text-end">Ações</th>
                            </tr>
                            </thead>
                            <tbody>
                            {participantes.map(user => (
                                <tr key={user.codRanking}>
                                    <td className="text-secondary">#{user.codRanking}</td>
                                    <td style={{ color: '#15d2a3', fontWeight: 'bold' }}>
                                        {user.usuario}
                                    </td>
                                    <td><span className="badge bg-secondary">{user.pontuacao} pts</span></td>
                                    <td>
                                        {user.nivel === 'INICIANTE' && <span className="badge bg-info text-dark">INICIANTE</span>}
                                        {user.nivel === 'CURIOSO' && <span className="badge bg-warning text-dark">CURIOSO</span>}
                                        {user.nivel === 'CIENTISTA' && <span className="badge bg-danger">CIENTISTA</span>}
                                        {!['INICIANTE', 'CURIOSO', 'CIENTISTA'].includes(user.nivel) && user.nivel}
                                    </td>
                                    <td className="text-end">
                                        <button
                                            className="btn btn-sm btn-outline-warning me-2"
                                            onClick={() => setEditingUser(user)}
                                        >
                                            ✏️ Nome
                                        </button>

                                        {/* LÓGICA DE BLOQUEIO DO BOTÃO EXCLUIR */}
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => podeExcluir && handleDelete(user.codRanking)}
                                            disabled={!podeExcluir} // Desabilita se for false
                                            style={!podeExcluir ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                            title={!podeExcluir ? "Sem permissão para excluir" : "Excluir participante"}
                                        >
                                            🗑️ Excluir
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {participantes.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-4 text-muted">
                                        Nenhum participante encontrado.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>

                    {renderPaginacao()}
                </>
            )}

            <ModalEditarNome
                isOpen={!!editingUser}
                titulo={`Editar: ${editingUser?.usuario}`}
                valorInicial={editingUser?.usuario || ''}
                onClose={() => setEditingUser(null)}
                onSave={handleSalvarNome}
            />
        </div>
    );
};

export default AdminParticipantesPage;