import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({ baseURL: `${BASE_URL}/api` });

const AdminUsuarioForm: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Dados básicos
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');

    // --- NOVOS ESTADOS PARA PERMISSÕES ---
    const [isSuperAdmin, setIsSuperAdmin] = useState(false); // Para saber se é o admin principal
    const [permissoes, setPermissoes] = useState({
        podeExcluirElementos: false,
        podeExcluirParticipantes: false,
        podeGerenciarUsuarios: false
    });

    useEffect(() => {
        if (id) {
            carregarDados(id);
        }
    }, [id]);

    const carregarDados = async (userId: string) => {
        try {
            const token = sessionStorage.getItem('token');
            const res = await api.get(`/usuarios/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setNome(res.data.nome);
            setEmail(res.data.email);

            // --- CARREGAR PERMISSÕES DO BACKEND ---
            setIsSuperAdmin(res.data.isSuperAdmin);
            setPermissoes({
                podeExcluirElementos: res.data.podeExcluirElementos,
                podeExcluirParticipantes: res.data.podeExcluirParticipantes,
                podeGerenciarUsuarios: res.data.podeGerenciarUsuarios
            });

        } catch (error) {
            toast.error("Erro ao carregar dados do usuário.");
            navigate('/admin/usuarios');
        }
    };

    const gerarSenhaAleatoria = () => {
        const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
        let novaSenha = "";
        for (let i = 0; i < 12; i++) {
            novaSenha += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
        }
        setSenha(novaSenha);
        toast.success("Senha segura gerada!");
    };

    const copiarSenha = () => {
        if (!senha) {
            toast.error("Nada para copiar.");
            return;
        }
        navigator.clipboard.writeText(senha);
        toast.success("Senha copiada!");
    };

    // Função auxiliar para atualizar o estado do checkbox
    const handleCheckChange = (campo: keyof typeof permissoes) => {
        setPermissoes(prev => ({
            ...prev,
            [campo]: !prev[campo]
        }));
    };

    const handleSalvar = async () => {
        if (!nome || !email) return toast.error("Preencha nome e e-mail.");
        if (!id && !senha) return toast.error("Senha é obrigatória para novos usuários.");

        setLoading(true);
        try {
            const token = sessionStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // --- INCLUÍMOS AS PERMISSÕES NO PAYLOAD ---
            const payload = {
                nome,
                email,
                senha,
                // Espalha as permissões (podeExcluirElementos, etc) dentro do objeto
                ...permissoes
            };

            if (id) {
                await api.put(`/usuarios/${id}`, payload, config);
                toast.success("Usuário atualizado com sucesso!");
            } else {
                await api.post('/usuarios', payload, config);
                toast.success("Novo usuário criado!");
            }

            setTimeout(() => navigate('/admin/usuarios'), 1000);
        } catch (error: any) {
            if (error.response?.data?.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error("Erro ao salvar.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4 text-white" style={{ maxWidth: '700px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>{id ? `Editar Usuário` : 'Novo Usuário'}</h2>
                {isSuperAdmin && (
                    <span className="badge bg-warning text-dark fs-6">👑 Super Admin</span>
                )}
            </div>

            <div className="card bg-dark border-secondary p-4">

                {/* --- DADOS PESSOAIS --- */}
                <h5 className="text-success mb-3 border-bottom border-secondary pb-2">Dados de Acesso</h5>

                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Nome Completo</label>
                        <input
                            type="text" className="form-control"
                            value={nome} onChange={e => setNome(e.target.value)}
                            placeholder="Ex: João da Silva"
                        />
                    </div>

                    <div className="col-md-6 mb-3">
                        <label className="form-label">E-mail</label>
                        <input
                            type="email" className="form-control"
                            value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="usuario@bigbang.com"
                            disabled={isSuperAdmin} // Evita mudar e-mail do super admin por segurança
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label className="form-label">
                        {id ? "Nova Senha (deixe vazio para manter)" : "Senha Inicial"}
                    </label>
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            value={senha}
                            onChange={e => setSenha(e.target.value)}
                            placeholder="******"
                            autoComplete="new-password"
                        />
                        <button className="btn btn-outline-info" type="button" onClick={gerarSenhaAleatoria}>
                            🎲 Gerar
                        </button>
                        <button className="btn btn-outline-secondary" type="button" onClick={copiarSenha}>
                            📋 Copiar
                        </button>
                    </div>
                </div>

                {/* --- SEÇÃO DE PERMISSÕES --- */}
                <h5 className="text-warning mb-3 border-bottom border-secondary pb-2">
                    Permissões Especiais
                </h5>

                <div className="mb-3">
                    <p className="text-muted small">
                        * Todos os usuários podem Cadastrar e Editar Elementos por padrão.
                        Abaixo, selecione os poderes adicionais:
                    </p>

                    {/* Checkbox 1: Excluir Elementos */}
                    <div className="form-check form-switch mb-2">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="perm1"
                            checked={permissoes.podeExcluirElementos || isSuperAdmin}
                            onChange={() => handleCheckChange('podeExcluirElementos')}
                            disabled={isSuperAdmin} // Super Admin tem tudo habilitado fixo
                        />
                        <label className="form-check-label text-white" htmlFor="perm1">
                            Pode <strong>Excluir Elementos</strong>
                        </label>
                    </div>

                    {/* Checkbox 2: Excluir Participantes/Ranking */}
                    <div className="form-check form-switch mb-2">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="perm2"
                            checked={permissoes.podeExcluirParticipantes || isSuperAdmin}
                            onChange={() => handleCheckChange('podeExcluirParticipantes')}
                            disabled={isSuperAdmin}
                        />
                        <label className="form-check-label text-white" htmlFor="perm2">
                            Pode <strong>Excluir Participantes</strong>
                        </label>
                    </div>

                    {/* Checkbox 3: Gerenciar Usuários */}
                    <div className="form-check form-switch mb-2">
                        <input
                            className="form-check-input"
                            type="checkbox"
                            id="perm3"
                            checked={permissoes.podeGerenciarUsuarios || isSuperAdmin}
                            onChange={() => handleCheckChange('podeGerenciarUsuarios')}
                            disabled={isSuperAdmin}
                        />
                        <label className="form-check-label text-white" htmlFor="perm3">
                            Pode <strong>Gerenciar Usuários</strong>
                        </label>
                    </div>
                </div>

                {/* --- BOTÕES --- */}
                <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top border-secondary">
                    <button className="btn btn-secondary" onClick={() => navigate('/admin/usuarios')}>
                        Cancelar
                    </button>
                    <button
                        className="btn btn-success px-4"
                        onClick={handleSalvar}
                        disabled={loading}
                    >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminUsuarioForm;