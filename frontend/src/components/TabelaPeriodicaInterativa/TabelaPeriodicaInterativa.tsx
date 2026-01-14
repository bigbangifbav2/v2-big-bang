import React from 'react';

const mapaDeSimbolos: { [key: string]: string } = {
    "hidrogenio": "H", "helio": "He", "litio": "Li", "berilio": "Be", "boro": "B",
    "carbono": "C", "nitrogenio": "N", "oxigenio": "O", "fluor": "F", "neonio": "Ne",
    "sodio": "Na", "magnesio": "Mg", "aluminio": "Al", "silicio": "Si", "fosforo": "P",
    "enxofre": "S", "cloro": "Cl", "argonio": "Ar", "potassio": "K", "calcio": "Ca",
    "escandio": "Sc", "titanio": "Ti", "vanadio": "V", "cromo": "Cr", "manganes": "Mn",
    "ferro": "Fe", "cobalto": "Co", "niquel": "Ni", "cobre": "Cu", "zinco": "Zn",
    "galio": "Ga", "germanio": "Ge", "arsenio": "As", "selenio": "Se", "bromo": "Br",
    "criptonio": "Kr", "rubidio": "Rb", "estroncio": "Sr", "itrio": "Y", "zirconio": "Zr",
    "niobio": "Nb", "molibdenio": "Mo", "tecnecio": "Tc", "rutenio": "Ru", "rodio": "Rh",
    "paladio": "Pd", "prata": "Ag", "cadmio": "Cd", "indio": "In", "estanho": "Sn",
    "antimonio": "Sb", "telurio": "Te", "iodo": "I", "xenonio": "Xe", "cesio": "Cs",
    "bario": "Ba", "hafnio": "Hf", "tantalo": "Ta", "tungstenio": "W", "renio": "Re",
    "osmio": "Os", "iridio": "Ir", "platina": "Pt", "ouro": "Au", "mercurio": "Hg",
    "talio": "Tl", "chumbo": "Pb", "bismuto": "Bi", "polonio": "Po", "astato": "At",
    "radonio": "Rn", "francio": "Fr", "radio": "Ra", "rutherfordio": "Rf", "dubnio": "Db",
    "seaborgio": "Sg", "bohrio": "Bh", "hassio": "Hs", "meitnerio": "Mt", "darmstadtio": "Ds",
    "roentgenio": "Rg", "copernicio": "Cn", "nihonio": "Nh", "flerovio": "Fl", "moscovio": "Mc",
    "livermorio": "Lv", "tenesso": "Ts", "oganessonio": "Og",
    "lantanio": "La", "cerio": "Ce", "praseodimio": "Pr", "neodimio": "Nd", "promecio": "Pm",
    "samario": "Sm", "europio": "Eu", "gadolinio": "Gd", "terbio": "Tb", "disprosio": "Dy",
    "holmio": "Ho", "erbio": "Er", "tulio": "Tm", "iterbio": "Yb", "lutecio": "Lu",
    "actinio": "Ac", "torio": "Th", "protactinio": "Pa", "uranio": "U", "neptunio": "Np",
    "plutonio": "Pu", "americio": "Am", "curio": "Cm", "berquelio": "Bk", "californio": "Cf",
    "einstenio": "Es", "fermio": "Fm", "mendelevio": "Md", "nobelio": "No", "laurencio": "Lr"
};

interface TabelaProps {
    onPosicaoClick: (posicaoValor: string) => void;
    posicoesCorretas: string[];
    codNivel: number;
}

// Componente simples para o número da linha lateral
const IndiceLateral = ({ num }: { num?: number | string }) => (
    <div className="indice-periodo">{num}</div>
);

const TabelaPeriodicaInterativa: React.FC<TabelaProps> = ({
                                                              onPosicaoClick,
                                                              posicoesCorretas,
                                                              codNivel
                                                          }) => {

    const mostrarIndices = codNivel === 1 || codNivel === 2;
    const estaCorreto = (nome: string) => posicoesCorretas.includes(nome);

    // Gera array de 1 a 18 para o cabeçalho
    const colunasIndices = Array.from({ length: 18 }, (_, i) => i + 1);

    const Espaco = ({ span = 1 }: { span?: number }) => (
        <div className="espaco-branco" style={{ gridColumn: `span ${span}` }}></div>
    );

    const Botao = ({ nome, subnivel }: { nome: string, subnivel: string }) => {
        const simbolo = mapaDeSimbolos[nome] || '?';
        const correto = estaCorreto(nome);

        let conteudoBotao = '?';
        if (correto) {
            conteudoBotao = simbolo;
        } else if (codNivel === 1) {
            conteudoBotao = subnivel;
        }

        return (
            <button
                className={`quadrado subnivel-${subnivel}`}
                value={nome}
                onClick={() => onPosicaoClick(nome)}
                disabled={correto}
            >
                {conteudoBotao}
            </button>
        );
    };

    return (
        <div className={`tabela-grid-container ${!mostrarIndices ? 'sem-indices' : ''}`}>

            {mostrarIndices && (
                <div className="tabela-linha indices-superiores">
                    {/* Espaço vazio acima dos números laterais (canto superior esquerdo) */}
                    <div className="espaco-canto"></div>

                    {colunasIndices.map((num) => (
                        <div key={num} className="indice-coluna-top">
                            {num}
                        </div>
                    ))}
                </div>
            )}

            {/* --- CAMADA DE BOTÕES (Resto da Tabela) --- */}

            <div className="tabela-linha">
                {mostrarIndices && <IndiceLateral num={1} />}
                <Botao nome="hidrogenio" subnivel="s" />
                <Espaco span={16} />
                <Botao nome="helio" subnivel="p" />
            </div>

            <div className="tabela-linha">
                {mostrarIndices && <IndiceLateral num={2} />}
                <Botao nome="litio" subnivel="s" />
                <Botao nome="berilio" subnivel="s" />
                <Espaco span={10} />
                <Botao nome="boro" subnivel="p" />
                <Botao nome="carbono" subnivel="p" />
                <Botao nome="nitrogenio" subnivel="p" />
                <Botao nome="oxigenio" subnivel="p" />
                <Botao nome="fluor" subnivel="p" />
                <Botao nome="neonio" subnivel="p" />
            </div>

            <div className="tabela-linha">
                {mostrarIndices && <IndiceLateral num={3} />}
                <Botao nome="sodio" subnivel="s" />
                <Botao nome="magnesio" subnivel="s" />
                <Espaco span={10} />
                <Botao nome="aluminio" subnivel="p" />
                <Botao nome="silicio" subnivel="p" />
                <Botao nome="fosforo" subnivel="p" />
                <Botao nome="enxofre" subnivel="p" />
                <Botao nome="cloro" subnivel="p" />
                <Botao nome="argonio" subnivel="p" />
            </div>

            <div className="tabela-linha">
                {mostrarIndices && <IndiceLateral num={4} />}
                <Botao nome="potassio" subnivel="s" />
                <Botao nome="calcio" subnivel="s" />
                <Botao nome="escandio" subnivel="d" />
                <Botao nome="titanio" subnivel="d" />
                <Botao nome="vanadio" subnivel="d" />
                <Botao nome="cromo" subnivel="d" />
                <Botao nome="manganes" subnivel="d" />
                <Botao nome="ferro" subnivel="d" />
                <Botao nome="cobalto" subnivel="d" />
                <Botao nome="niquel" subnivel="d" />
                <Botao nome="cobre" subnivel="d" />
                <Botao nome="zinco" subnivel="d" />
                <Botao nome="galio" subnivel="p" />
                <Botao nome="germanio" subnivel="p" />
                <Botao nome="arsenio" subnivel="p" />
                <Botao nome="selenio" subnivel="p" />
                <Botao nome="bromo" subnivel="p" />
                <Botao nome="criptonio" subnivel="p" />
            </div>

            <div className="tabela-linha">
                {mostrarIndices && <IndiceLateral num={5} />}
                <Botao nome="rubidio" subnivel="s" />
                <Botao nome="estroncio" subnivel="s" />
                <Botao nome="itrio" subnivel="d" />
                <Botao nome="zirconio" subnivel="d" />
                <Botao nome="niobio" subnivel="d" />
                <Botao nome="molibdenio" subnivel="d" />
                <Botao nome="tecnecio" subnivel="d" />
                <Botao nome="rutenio" subnivel="d" />
                <Botao nome="rodio" subnivel="d" />
                <Botao nome="paladio" subnivel="d" />
                <Botao nome="prata" subnivel="d" />
                <Botao nome="cadmio" subnivel="d" />
                <Botao nome="indio" subnivel="p" />
                <Botao nome="estanho" subnivel="p" />
                <Botao nome="antimonio" subnivel="p" />
                <Botao nome="telurio" subnivel="p" />
                <Botao nome="iodo" subnivel="p" />
                <Botao nome="xenonio" subnivel="p" />
            </div>

            <div className="tabela-linha">
                {mostrarIndices && <IndiceLateral num={6} />}
                <Botao nome="cesio" subnivel="s" />
                <Botao nome="bario" subnivel="s" />
                <Espaco />
                <Botao nome="hafnio" subnivel="d" />
                <Botao nome="tantalo" subnivel="d" />
                <Botao nome="tungstenio" subnivel="d" />
                <Botao nome="renio" subnivel="d" />
                <Botao nome="osmio" subnivel="d" />
                <Botao nome="iridio" subnivel="d" />
                <Botao nome="platina" subnivel="d" />
                <Botao nome="ouro" subnivel="d" />
                <Botao nome="mercurio" subnivel="d" />
                <Botao nome="talio" subnivel="p" />
                <Botao nome="chumbo" subnivel="p" />
                <Botao nome="bismuto" subnivel="p" />
                <Botao nome="polonio" subnivel="p" />
                <Botao nome="astato" subnivel="p" />
                <Botao nome="radonio" subnivel="p" />
            </div>

            <div className="tabela-linha">
                {mostrarIndices && <IndiceLateral num={7} />}
                <Botao nome="francio" subnivel="s" />
                <Botao nome="radio" subnivel="s" />
                <Espaco />
                <Botao nome="rutherfordio" subnivel="d" />
                <Botao nome="dubnio" subnivel="d" />
                <Botao nome="seaborgio" subnivel="d" />
                <Botao nome="bohrio" subnivel="d" />
                <Botao nome="hassio" subnivel="d" />
                <Botao nome="meitnerio" subnivel="d" />
                <Botao nome="darmstadtio" subnivel="d" />
                <Botao nome="roentgenio" subnivel="d" />
                <Botao nome="copernicio" subnivel="d" />
                <Botao nome="nihonio" subnivel="p" />
                <Botao nome="flerovio" subnivel="p" />
                <Botao nome="moscovio" subnivel="p" />
                <Botao nome="livermorio" subnivel="p" />
                <Botao nome="tenesso" subnivel="p" />
                <Botao nome="oganessonio" subnivel="p" />
            </div>

            <div className="tabela-linha" style={{ height: '10px' }}></div>

            <div className="tabela-linha">
                {mostrarIndices && <IndiceLateral />}
                <Espaco span={2} />
                <Botao nome="lantanio" subnivel="f" />
                <Botao nome="cerio" subnivel="f" />
                <Botao nome="praseodimio" subnivel="f" />
                <Botao nome="neodimio" subnivel="f" />
                <Botao nome="promecio" subnivel="f" />
                <Botao nome="samario" subnivel="f" />
                <Botao nome="europio" subnivel="f" />
                <Botao nome="gadolinio" subnivel="f" />
                <Botao nome="terbio" subnivel="f" />
                <Botao nome="disprosio" subnivel="f" />
                <Botao nome="holmio" subnivel="f" />
                <Botao nome="erbio" subnivel="f" />
                <Botao nome="tulio" subnivel="f" />
                <Botao nome="iterbio" subnivel="f" />
                <Botao nome="lutecio" subnivel="f" />
                <Espaco />
            </div>

            <div className="tabela-linha">
                {mostrarIndices && <IndiceLateral />}
                <Espaco span={2} />
                <Botao nome="actinio" subnivel="f" />
                <Botao nome="torio" subnivel="f" />
                <Botao nome="protactinio" subnivel="f" />
                <Botao nome="uranio" subnivel="f" />
                <Botao nome="neptunio" subnivel="f" />
                <Botao nome="plutonio" subnivel="f" />
                <Botao nome="americio" subnivel="f" />
                <Botao nome="curio" subnivel="f" />
                <Botao nome="berquelio" subnivel="f" />
                <Botao nome="californio" subnivel="f" />
                <Botao nome="einstenio" subnivel="f" />
                <Botao nome="fermio" subnivel="f" />
                <Botao nome="mendelevio" subnivel="f" />
                <Botao nome="nobelio" subnivel="f" />
                <Botao nome="laurencio" subnivel="f" />
                <Espaco />
            </div>
        </div>
    );
};

export default TabelaPeriodicaInterativa;