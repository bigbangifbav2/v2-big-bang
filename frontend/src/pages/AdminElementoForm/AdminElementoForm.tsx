import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
    baseURL: `${BASE_URL}/api`
});

const AdminElementoForm: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // Estado do formulário
    const [nome, setNome] = useState('');
    const [simbolo, setSimbolo] = useState('');
    const [nivel, setNivel] = useState('1');
    const [dicas, setDicas] = useState<string[]>(['', '', '']);

    // --- IMAGEM PRINCIPAL ---
    const [imagemAtualUrl, setImagemAtualUrl] = useState('');
    const [imagemArquivo, setImagemArquivo] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState('');

    // --- NOVO: IMAGEM DE DISTRIBUIÇÃO (CERNE) ---
    const [distAtualUrl, setDistAtualUrl] = useState('');
    const [distArquivo, setDistArquivo] = useState<File | null>(null);
    const [distPreview, setDistPreview] = useState('');

    // Estado de Feedback
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState('');

    // Carregar dados na Edição
    useEffect(() => {
        if (id) {
            setLoading(true);
            const token = sessionStorage.getItem('token');
            api.get(`/elementos/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => {
                    const dados = res.data;
                    setNome(dados.nome);
                    setSimbolo(dados.simbolo);
                    setNivel(String(dados.nivel));

                    const dicasBackend = dados.dicas || [];
                    const dicasFixas = [
                        dicasBackend[0] || '',
                        dicasBackend[1] || '',
                        dicasBackend[2] || ''
                    ];
                    setDicas(dicasFixas);

                    // Carrega imagem principal
                    if (dados.imagemUrl) {
                        setImagemAtualUrl(`${BASE_URL}${dados.imagemUrl}`);
                    }

                    // Carrega imagem de distribuição (se houver)
                    if (dados.imgDistribuicao) {
                        setDistAtualUrl(`${BASE_URL}${dados.imgDistribuicao}`);
                    }
                })
                .catch(err => {
                    setErro('Erro ao carregar elemento.');
                    console.error(err);
                })
                .finally(() => setLoading(false));
        }
    }, [id]);

    const handleDicaChange = (index: number, value: string) => {
        const novasDicas = [...dicas];
        novasDicas[index] = value;
        setDicas(novasDicas);
    };

    // Handler Imagem Principal
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImagemArquivo(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // Handler Imagem Distribuição
    const handleDistChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setDistArquivo(file);
            setDistPreview(URL.createObjectURL(file));
        }
    };

    const handleSalvar = async () => {
        setErro('');

        if (!nome || !simbolo) return toast.error('Preencha Nome e Símbolo.');
        if (dicas.some(d => d.trim() === '')) return toast.error('Preencha as 3 dicas.');

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('nome', nome);
            formData.append('simbolo', simbolo);
            formData.append('nivel', nivel);
            formData.append('dicas', JSON.stringify(dicas));

            // Anexa imagem principal se mudou
            if (imagemArquivo) {
                formData.append('imagem', imagemArquivo);
            }

            // Anexa imagem distribuição se mudou E se for nível 1
            if (nivel === '1' && distArquivo) {
                formData.append('imagemDistribuicao', distArquivo);
            }

            const token = sessionStorage.getItem('token');
            const config = {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };

            if (id) {
                await api.put(`/elementos/${id}`, formData, config);
                toast.success('Elemento editado com sucesso!');
            } else {
                await api.post('/elementos', formData, config);
                toast.success('Elemento criado com sucesso!');
            }

            setTimeout(() => {
                navigate('/admin/elementos');
            }, 500);

        } catch (error) {
            const err = error as AxiosError;
            console.error(err);
            if (err.response?.status === 401) {
                toast.error("Sessão expirada.");
                navigate('/login');
            } else if ((err.response?.data as { error: string })?.error) {
                toast.error((err.response?.data as { error: string }).error);
            } else {
                toast.error('Ocorreu um erro ao salvar.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4 text-white" style={{ maxWidth: '900px' }}>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>{id ? `Editar: ${nome}` : 'Novo Elemento'}</h2>
            </div>

            {erro && <div className="alert alert-danger">{erro}</div>}

            <div className="row">
                {/* --- COLUNA ESQUERDA: IMAGENS --- */}
                <div className="col-md-4 mb-4">

                    {/* 1. Imagem Principal */}
                    <div className="text-center mb-4">
                        <label className="form-label fw-bold">Imagem do Elemento</label>
                        <div style={{
                            width: '100%', height: '200px',
                            backgroundColor: '#222', border: '2px dashed #15d2a3',
                            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden', position: 'relative'
                        }}>
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : imagemAtualUrl ? (
                                <img src={imagemAtualUrl} alt="Atual" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div className="text-muted">
                                    <i className="bi bi-image fs-1"></i>
                                    <p>Principal</p>
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            className="form-control mt-2"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>

                    {/* 2. Imagem de Distribuição (CONDICIONAL NÍVEL 1) */}
                    {nivel === '1' && (
                        <div className="text-center p-3 border border-warning rounded bg-dark">
                            <label className="form-label fw-bold text-warning">
                                <i className="bi bi-lightning-charge-fill me-1"></i>
                                Cerne do Gás Nobre
                            </label>
                            <div style={{
                                width: '100%', height: '150px',
                                backgroundColor: '#333', border: '2px dashed #ffc107',
                                borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', position: 'relative'
                            }}>
                                {distPreview ? (
                                    <img src={distPreview} alt="Dist Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : distAtualUrl ? (
                                    <img src={distAtualUrl} alt="Dist Atual" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <div className="text-muted small">
                                        <p className="m-0">Distribuição Eletrônica</p>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                className="form-control mt-2 form-control-sm"
                                accept="image/*"
                                onChange={handleDistChange}
                            />
                            <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                                Obrigatório para nível Iniciante
                            </small>
                        </div>
                    )}
                </div>

                {/* --- COLUNA DIREITA: DADOS --- */}
                <div className="col-md-8">
                    <div className="row mb-3">
                        <div className="col-9">
                            <label className="form-label">Nome do Elemento</label>
                            <input
                                type="text"
                                className="form-control form-control-lg"
                                placeholder="Ex: Hidrogênio"
                                value={nome}
                                onChange={e => setNome(e.target.value)}
                            />
                        </div>
                        <div className="col-3">
                            <label className="form-label">Símbolo</label>
                            <input
                                type="text"
                                className="form-control form-control-lg text-center fw-bold text-uppercase"
                                placeholder="H"
                                maxLength={2}
                                value={simbolo}
                                onChange={e => setSimbolo(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="form-label">Nível de Dificuldade</label>
                        <select
                            className="form-select form-select-lg"
                            value={nivel}
                            onChange={e => setNivel(e.target.value)}
                        >
                            <option value="1">1 - Iniciante (Requer Cerne)</option>
                            <option value="2">2 - Curioso (Médio)</option>
                            <option value="3">3 - Cientista (Difícil)</option>
                        </select>
                    </div>

                    {/* DICAS */}
                    <div className="card bg-dark border-secondary p-4">
                        <h5 className="text-info mb-3">Dicas (Exatamente 3)</h5>
                        {[0, 1, 2].map(idx => (
                            <div className="mb-3" key={idx}>
                                <label className="text-muted small">Dica {idx + 1}</label>
                                <input
                                    type="text"
                                    className="form-control form-control-lg"
                                    placeholder={`Insira a dica ${idx + 1}...`}
                                    value={dicas[idx]}
                                    onChange={(e) => handleDicaChange(idx, e.target.value)}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="d-flex justify-content-end gap-3 mt-4 mb-5">
                        <button
                            className="btn btn-secondary btn-lg"
                            onClick={() => navigate('/admin/elementos')}
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            className="btn btn-success btn-lg px-5"
                            onClick={handleSalvar}
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminElementoForm;