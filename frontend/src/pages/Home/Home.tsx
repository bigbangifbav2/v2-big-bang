import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
    const navigate = useNavigate();
    // Começa false (com som), mas o navegador pode bloquear.
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        sessionStorage.removeItem('jogo_ativo');
    }, []);

    // --- LÓGICA DE ÁUDIO ROBUSTA ---
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        // Ajusta volume para não estourar os ouvidos (opcional)
        audio.volume = 0.5;
        audio.muted = isMuted;

        if (!isMuted) {
            // Tenta tocar imediatamente
            const playPromise = audio.play();

            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.log("Autoplay bloqueado pelo navegador. Aguardando interação do usuário...", error);

                    // PLANO B: Tocar no primeiro clique em qualquer lugar da tela
                    const forcePlay = () => {
                        audio.play();
                        // Remove o ouvinte após conseguir tocar
                        document.removeEventListener('click', forcePlay);
                    };
                    document.addEventListener('click', forcePlay);
                });
            }
        } else {
            audio.pause();
        }
    }, [isMuted]);

    // --- SOM DE SELEÇÃO (BOTÕES) ---
    const playSelectionSound = () => {
        // Verifica se não está mutado antes de tocar o efeito
        if (!isMuted) {
            const audio = new Audio('/musica/selecao-nivel.wav'); // Certifique-se que o arquivo existe
            audio.volume = 0.5;
            audio.play().catch(e => console.warn("Erro ao tocar som selection:", e));
        }
    };

    const toggleMusic = () => {
        setIsMuted(prev => !prev);
    };

    const handleAdminClick = () => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/admin/elementos');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="home-container">
            <button
                className="btn-admin-gear"
                onClick={handleAdminClick}
                title="Área Administrativa"
            >
                ⚙️
            </button>

            {/* O audio fica aqui, invisível */}
            <audio ref={audioRef} loop id="bgsound">
                <source src="/musica/bensound-enigmatic.mp3" type="audio/mp3" />
            </audio>

            <div className="row justify-content-center">
                <div className="col-9">
                    <div className="home-interactive-area">
                        <img className="estrutura" src="/img/fundo.png" alt="Fundo" />

                        {/* Botões com som de clique */}
                        <Link to="/niveis" onClick={playSelectionSound}>
                            <img id="bt_play" src="/img/play.png" alt="play" title="Jogar" />
                        </Link>

                        <Link to="/tutorial" onClick={playSelectionSound}>
                            <img id="bt_tutorial" src="/img/tutorial.png" alt="Tutorial" title="Tutorial" />
                        </Link>

                        <Link to="/ranking" onClick={playSelectionSound}>
                            <img id="bt_ranking" src="/img/ranking.png" alt="Ranking" title="Ranking" />
                        </Link>

                        <Link to="/creditos" onClick={playSelectionSound}>
                            <img id="bt_creditos" src="/img/creditos.png" alt="Créditos" title="Créditos" />
                        </Link>

                        {/* Botão de Controle de Som */}
                        <div id="bt_som" onClick={toggleMusic} style={{ cursor: 'pointer' }}>
                            <img
                                src={isMuted ? "/img/som_off.png" : "/img/som_on.png"}
                                id="imgSom"
                                title={isMuted ? "Ligar Som" : "Desligar Som"}
                                alt="Controle de Som"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;