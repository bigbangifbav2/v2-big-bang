// front-end/src/pages/SelecaoPerfilPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const AVATARS = [
    { id: 1, name: "Monstro Azul", img: "/img/avatar/monstrinho1.png" },
    { id: 2, name: "Monstro Rosa", img: "/img/avatar/monstrinho2.png" },
    { id: 3, name: "Monstro Ciano", img: "/img/avatar/monstrinho3.png" },
    { id: 4, name: "Monstro Verde", img: "/img/avatar/monstrinho4.png" },
];

const SelecaoPerfilPage: React.FC = () => {
    const { codNivel } = useParams<{ codNivel: string }>();
    const navigate = useNavigate();

    const [nome, setNome] = useState('');
    const [avatarId, setAvatarId] = useState<number | null>(null);

    useEffect(() => {
        document.body.classList.add('niveis-page-body');
        return () => {
            document.body.classList.remove('niveis-page-body');
        };
    }, []);

    // Som ao escolher o avatar
    const tocarSomAvatar = () => {
        const audio = new Audio('/musica/choose-player.wav');
        audio.volume = 0.5;
        audio.play().catch(e => console.warn("Erro ao tocar som:", e));
    };

    // --- NOVA FUNÇÃO: Tocar som ao Iniciar Jogo ---
    const tocarSomJogar = () => {
        const audio = new Audio('/musica/selecao-nivel.wav');
        audio.volume = 0.5;
        audio.play().catch(e => console.warn("Erro ao tocar som:", e));
    };

    const handleIniciarJogo = (e: React.FormEvent) => {
        e.preventDefault();

        if (!nome.trim()) {
            alert("Por favor, digite seu nome.");
            return;
        }
        if (!avatarId) {
            alert("Por favor, selecione um avatar.");
            return;
        }

        // 1. Toca o som de confirmação/início
        tocarSomJogar();

        // 2. Salva os dados
        localStorage.setItem('playerName', nome.trim());
        localStorage.setItem('playerAvatarId', String(avatarId));
        localStorage.setItem('gameNivel', codNivel || '1');
        sessionStorage.setItem('jogo_ativo', 'true');

        // 3. Inicia o jogo
        navigate(`/jogo/${codNivel}`);
    };

    return (
        <div className="selecao-perfil-wrapper">
            <div className="selecao-content text-center">
                <h1 style={{ color: 'white', marginBottom: '10px' }}>Preparando o Jogo</h1>
                <p className="lead text-white mb-4">Nível Selecionado: {codNivel}</p>

                <form onSubmit={handleIniciarJogo}>
                    <div className="mb-5 input-nome-container">
                        <input
                            type="text"
                            className="form-control form-control-lg text-center"
                            placeholder="Digite seu nome..."
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            style={{
                                borderRadius: '30px',
                                border: 'none',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        />
                    </div>

                    <div className="avatars-container mb-5">
                        {AVATARS.map(avatar => (
                            <div
                                key={avatar.id}
                                className={`avatar-circle ${avatarId === avatar.id ? 'selected' : ''}`}
                                onClick={() => {
                                    setAvatarId(avatar.id);
                                    tocarSomAvatar();
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <img src={avatar.img} alt={avatar.name} />
                            </div>
                        ))}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-success btn-lg jogar-btn"
                        style={{
                            padding: '10px 50px',
                            fontSize: '1.5rem',
                            borderRadius: '30px',
                            fontWeight: 'bold'
                        }}
                    >
                        JOGAR
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SelecaoPerfilPage;