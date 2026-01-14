// src/pages/Tutorial.tsx

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/styleCreditosTutorialPage.css';

const Tutorial: React.FC = () => {

    useEffect(() => {
        // Reutilizamos a mesma classe pois o estilo de layout é idêntico
        document.body.classList.add('creditos-page-body');

        return () => {
            document.body.classList.remove('creditos-page-body');
        };
    }, []);

    return (
        <div className="creditos-container">
            <div className="creditos-header">
                <img src="/img/tutorial.png" alt="Tutorial" className="img-titulo-creditos" />
            </div>

            <div className="creditos-scroll-area" style={{ textAlign: 'left', color: 'white' }}>
                <h2 className="titulo-secao" style={{ textAlign: 'center' }}>Como Jogar</h2>

                <div style={{ padding: '0 20px', fontSize: '1.1rem', lineHeight: '1.6' }}>
                    <p><strong>Objetivo:</strong> Descobrir qual é o elemento químico e sua posição na Tabela Periódica com base nas dicas fornecidas.</p>

                    <br />

                    <h4>Passo a Passo:</h4>
                    <ol>
                        <li>Clique em <strong>DICAS</strong> para revelar a primeira pista sobre o elemento.</li>
                        <li>Leia a dica atentamente e tente deduzir qual elemento é.</li>
                        <li>Se souber a resposta:
                            <ul>
                                <li>Selecione o elemento na lista à direita (clique na figura).</li>
                                <li>Em seguida, clique no local correto na <strong>Tabela Periódica</strong> (centro da tela).</li>
                            </ul>
                        </li>
                        <li>Se errar ou precisar de mais ajuda, clique em <strong>DICAS</strong> novamente para revelar a próxima pista (máximo de 3 dicas).</li>
                    </ol>

                    <br />

                    <h4>Pontuação:</h4>
                    <ul>
                        <li>Acerto com 1 dica: <strong>5 pontos</strong></li>
                        <li>Acerto com 2 dicas: <strong>3 pontos</strong></li>
                        <li>Acerto com 3 dicas: <strong>1 pontos</strong></li>
                        <br/>
                        <li>Acerto do posicionamento na tabela: <strong>5 pontos</strong></li>
                    </ul>
                </div>
            </div>

            <div className="footer-voltar">
                <Link to="/">
                    <img src="/img/voltar.png" className="efeito-btn" alt="Voltar" />
                </Link>
            </div>
        </div>
    );
};

export default Tutorial;