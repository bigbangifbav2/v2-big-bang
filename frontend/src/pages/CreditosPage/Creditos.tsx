// src/pages/Creditos.tsx

import React, {useEffect} from 'react';
import { Link } from 'react-router-dom';
import '../../styles/styleCreditosTutorialPage.css'; // Vamos criar esse CSS abaixo

interface Membro {
    nome: string;
    funcao: string;
    descricao?: string;
    lattes?: string; // Opcional, pois Daiana não tinha no antigo
}

const Creditos: React.FC = () => {

    useEffect(() => {
        // Adiciona a classe ao body ao montar o componente
        document.body.classList.add('creditos-page-body');

        // Remove a classe ao desmontar (sair da página)
        return () => {
            document.body.classList.remove('creditos-page-body');
        };
    }, []);

    // Dados da Equipe Nova (2025)
    const equipe2025: Membro[] = [
        {
            nome: "Paulo Quiroz R. Junior",
            funcao: "Orientando",
            descricao: "Desenvolvedor / Designer (2025)",
            lattes: "http://lattes.cnpq.br/1139186294852704"
        },
        {
            nome: "Pablo Matos",
            funcao: "Orientador",
            lattes: "http://buscatextual.cnpq.br/buscatextual/visualizacv.do?id=K4711296U2"
        },
        {
            nome: "Wdson Costa",
            funcao: "Coorientador",
            lattes: "http://buscatextual.cnpq.br/buscatextual/visualizacv.do?id=K4239289Z4"
        }
    ];

    const equipe2015: Membro[] = [
        {
            nome: "Breno Lessa",
            funcao: "Bolsista",
            descricao: "Desenvolvedor / Designer (Original)",
            lattes: "http://buscatextual.cnpq.br/buscatextual/visualizacv.do?id=K8741891A6"
        },
        {
            nome: "Daiana Flores",
            funcao: "Bolsista",
            descricao: "Elaboração das Dicas",
        },
        {
            nome: "Priscila Carvalho",
            funcao: "Bolsista",
            descricao: "Elaboração do Jogo (Versão Tabuleiro)",
            lattes: "http://lattes.cnpq.br/0077892910598966"
        },
        {
            nome: "Pablo Matos",
            funcao: "Orientador",
            lattes: "http://buscatextual.cnpq.br/buscatextual/visualizacv.do?id=K4711296U2"
        },
        {
            nome: "Wdson Costa",
            funcao: "Coorientador",
            lattes: "http://buscatextual.cnpq.br/buscatextual/visualizacv.do?id=K4239289Z4"
        }
    ];

    const renderMembro = (membro: Membro, index: number) => (
        <div key={index} className="credito-card">
            <div className="credito-nome">{membro.nome}</div>
            <div className="credito-funcao">{membro.funcao}</div>

            {membro.descricao && (
                <div className="credito-desc">{membro.descricao}</div>
            )}

            {membro.lattes ? (
                <a href={membro.lattes} target="_blank" rel="noopener noreferrer" className="btn-lattes">
                    Currículo Lattes
                </a>
            ) : (
                <span className="sem-lattes">-</span>
            )}
        </div>
    );

    return (
        <div className="creditos-container">
            {/* Título Principal */}
            <div className="creditos-header">
                <img src="/img/nome_credito.png" alt="Créditos" className="img-titulo-creditos" />
            </div>

            <div className="creditos-scroll-area">

                {/* --- SEÇÃO 2025 --- */}
                <h2 className="titulo-secao">Equipe 2025 (Refatoração & Tecnologias Web)</h2>
                <div className="grid-membros">
                    {equipe2025.map(renderMembro)}
                </div>

                <hr className="divisor-secoes" />

                {/* --- SEÇÃO 2015 --- */}
                <h2 className="titulo-secao">Equipe Original 2015 (Criação & Conteúdo)</h2>
                <div className="grid-membros">
                    {equipe2015.map(renderMembro)}
                </div>

                {/* --- APOIO --- */}
                <div className="apoio-container">
                    <h3>Apoio:</h3>
                    <div className="logos-apoio">
                        <a href="http://portal.ifba.edu.br/conquista" target="_blank" rel="noreferrer">
                            <img src="/img/membros/ifba.png" alt="IFBA" title="IFBA" />
                        </a>
                        <a href="http://www.capes.gov.br/" target="_blank" rel="noreferrer">
                            <img src="/img/membros/capes.png" alt="CAPES" title="CAPES" />
                        </a>
                        <a href="http://www.gse.conquista.ifba.edu.br/" target="_blank" rel="noreferrer">
                            <img src="/img/membros/gse.png" alt="GSE" title="Grupo de Software Educacional" />
                        </a>
                    </div>
                </div>
            </div>

            {/* Botão Voltar */}
            <div className="footer-voltar">
                <Link to="/">
                    <img src="/img/voltar.png" className="efeito-btn" alt="Voltar" title="Voltar ao Início" />
                </Link>
            </div>
        </div>
    );
};

export default Creditos;