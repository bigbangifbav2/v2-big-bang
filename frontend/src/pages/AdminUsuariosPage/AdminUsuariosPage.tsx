import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Usuario {
    id: number;
    nome: string;
    email: string;
    isSuperAdmin: boolean;
}

interface AdminLogado {
    id: number;
    nome: string;
    isSuperAdmin: boolean;
    podeGerenciarUsuarios: boolean;
}

interface RespostaAPI {
    data: Usuario[];
    total: number;
    pagina: number;
    totalPaginas: number;
}

const AdminUsuariosPage: React.FC = () => {
    const navigate = useNavigate();

    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState('');

    // Permissões
    const [podeGerenciar, setPodeGerenciar] = useState(false);
    const [amISuperAdmin, setAmISuperAdmin] = useState(false);
    const [idUsuarioLogado, setIdUsuarioLogado] = useState<number>(0);

    const [paginaAtual, setPaginaAtual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);

    useEffect(() => {
        carregarPermissoes();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            carregarUsuarios(paginaAtual, busca);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [paginaAtual, busca]);

    const carregarPermissoes = () => {
        const dadosString = sessionStorage.getItem('adminUser');

        if (dadosString) {
            try {
                const admin: AdminLogado = JSON.parse(dadosString);

                const adminId = Number(admin.id);
                const isSuper = Boolean(admin.isSuperAdmin);
                // Permissão de gerenciar (Managers ou Super Admins)
                const temPermissao = Boolean(admin.isSuperAdmin || admin.podeGerenciarUsuarios);

                setPodeGerenciar(temPermissao);
                setAmISuperAdmin(isSuper);
                setIdUsuarioLogado(adminId);
            } catch (e) {
                console.error("Erro ao ler dados do usuário", e);
            }
        } else {
            console.warn("ATENÇÃO: 'adminUser' não encontrado. Faça Login novamente.");
        }
    };

    const carregarUsuarios = async (page: number, termo: string) => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const url = `${BASE_URL}/api/usuarios?page=${page}&limit=5&busca=${termo}`;

            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const dados = await res.json();
                if (dados.data) {
                    const resposta = dados as RespostaAPI;
                    setUsuarios(resposta.data);
                    setTotalPaginas(resposta.totalPaginas);
                } else if (Array.isArray(dados)) {
                    setUsuarios(dados);
                }
            } else {
                toast.error("Erro ao carregar lista.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro de conexão.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Tem certeza que deseja remover este administrador?")) return;
        try {
            const token = sessionStorage.getItem('token');
            const res = await fetch(`${BASE_URL}/api/usuarios/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Usuário removido!");
                carregarUsuarios(paginaAtual, busca);
            } else {
                const err = await res.json();
                toast.error(err.error || "Erro ao remover.");
            }
        } catch (error) {
            console.error(error);
            toast.error("Erro de conexão.");
        }
    };

    const renderPaginacao = () => {
        if (totalPaginas <= 1) return null;
        return (
            <div className="d-flex justify-content-center mt-4 gap-2">
                <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setPaginaAtual(prev => Math.max(prev - 1, 1))}
                    disabled={paginaAtual === 1}
                >
                    Anterior
                </button>
                <span className="d-flex align-items-center px-3 text-white">
                    Página {paginaAtual} de {totalPaginas}
                </span>
                <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => setPaginaAtual(prev => Math.min(prev + 1, totalPaginas))}
                    disabled={paginaAtual === totalPaginas}
                >
                    Próxima
                </button>
            </div>
        );
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="text-white">👤 Gerenciar Usuários (Admins)</h2>
                {podeGerenciar && (
                    <button className="btn btn-success" onClick={() => navigate('/admin/usuarios/novo')}>
                        + Novo Usuário
                    </button>
                )}
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    className="form-control"
                    placeholder="🔍 Buscar por nome ou e-mail..."
                    value={busca}
                    onChange={(e) => {
                        setBusca(e.target.value);
                        setPaginaAtual(1);
                    }}
                    style={{ backgroundColor: '#343a40', color: 'white', border: '1px solid #495057' }}
                />
            </div>

            {loading ? (
                <div className="text-center text-white">Carregando...</div>
            ) : (
                <>
                    <div className="table-responsive">
                        <table className="table table-dark table-hover rounded overflow-hidden align-middle">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nome</th>
                                <th>E-mail</th>
                                <th className="text-end">Ações</th>
                            </tr>
                            </thead>
                            <tbody>
                            {usuarios.map(u => {
                                const uId = Number(u.id);
                                const logadoId = Number(idUsuarioLogado);

                                const souEu = uId === logadoId;
                                const alvoSuperAdmin = Boolean(u.isSuperAdmin);

                                // --- REGRA DE EXCLUSÃO (MANTIDA) ---
                                const desabilitarExclusao = souEu || alvoSuperAdmin;

                                // --- NOVA REGRA ESTRITA DE EDIÇÃO ---

                                // Se for usuário comum (podeGerenciar = false), isso já dá false de cara.
                                const tenhoPoder = podeGerenciar || amISuperAdmin;

                                // 2. Proteção: Se o alvo for SuperAdmin, só outro SuperAdmin mexe.
                                const alvoProtegido = alvoSuperAdmin && !amISuperAdmin;

                                // 3. Resultado: Tenho poder E o alvo não está protegido.
                                const podeEditarEsteUsuario = tenhoPoder && !alvoProtegido;

                                return (
                                    <tr key={u.id}>
                                        <td className="text-secondary">#{u.id}</td>
                                        <td className="fw-bold">
                                            {u.nome}
                                            {alvoSuperAdmin && (
                                                <span className="badge bg-warning text-dark ms-2" style={{fontSize: '0.7em'}}>
                                                    Super Admin
                                                </span>
                                            )}
                                            {souEu && (
                                                <span className="badge bg-info text-dark ms-2" style={{fontSize: '0.7em'}}>
                                                    Você
                                                </span>
                                            )}
                                        </td>
                                        <td>{u.email}</td>
                                        <td className="text-end">

                                            {/* BOTÃO EDITAR */}
                                            <button
                                                className="btn btn-sm btn-outline-info me-2"
                                                onClick={() => podeEditarEsteUsuario && navigate(`/admin/usuarios/editar/${u.id}`)}
                                                disabled={!podeEditarEsteUsuario}
                                                style={!podeEditarEsteUsuario ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                                title={!podeEditarEsteUsuario ? "Sem permissão para editar" : "Editar"}
                                            >
                                                ✏️ Editar
                                            </button>

                                            {/* BOTÃO EXCLUIR (Só aparece se tiver poder de gerencia) */}
                                            {podeGerenciar && (
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleDelete(u.id)}
                                                    disabled={desabilitarExclusao}
                                                    style={desabilitarExclusao ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                                    title={desabilitarExclusao ? "Ação não permitida" : "Excluir"}
                                                >
                                                    🗑️ Excluir
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {usuarios.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center text-muted py-4">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                    {renderPaginacao()}
                </>
            )}
        </div>
    );
};

export default AdminUsuariosPage;