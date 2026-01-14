import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import TabelaPeriodicaInterativa from './TabelaPeriodicaInterativa';

describe('Componente TabelaPeriodicaInterativa', () => {
    const mockOnPosicaoClick = vi.fn();

    // Helper para pegar botão pelo atributo value (nome do elemento)
    const getBotaoElemento = (container: HTMLElement, nomeElemento: string) => {
        return container.querySelector(`button[value="${nomeElemento}"]`);
    };

    // =========================================================================
    // 1. TESTES DE NÍVEL 1 (INICIANTE)
    // =========================================================================

    it('Nível 1: Deve mostrar subníveis (s, p, d, f) nos botões não descobertos', () => {
        render(
            <TabelaPeriodicaInterativa
                codNivel={1}
                posicoesCorretas={[]}
                onPosicaoClick={mockOnPosicaoClick}
            />
        );

        expect(screen.getAllByText('s').length).toBeGreaterThan(0);
        expect(screen.getAllByText('d').length).toBeGreaterThan(0);
        expect(screen.getAllByText('p').length).toBeGreaterThan(0);
        expect(screen.getAllByText('f').length).toBeGreaterThan(0);
    });

    it('Nível 1: Deve exibir os índices laterais e superiores', () => {
        render(
            <TabelaPeriodicaInterativa
                codNivel={1}
                posicoesCorretas={[]}
                onPosicaoClick={mockOnPosicaoClick}
            />
        );


        const indicesUm = screen.getAllByText('1');
        expect(indicesUm.length).toBeGreaterThanOrEqual(1);

        expect(screen.getByText('18')).toBeInTheDocument();
    });

    // =========================================================================
    // 2. TESTES DE NÍVEL 2 (CURIOSO) E 3 (CIENTISTA)
    // =========================================================================

    it('Nível 2: Deve mostrar "?" nos botões, não os subníveis', () => {
        const { container } = render(
            <TabelaPeriodicaInterativa
                codNivel={2}
                posicoesCorretas={[]}
                onPosicaoClick={mockOnPosicaoClick}
            />
        );

        const btnHidrogenio = getBotaoElemento(container, 'hidrogenio');

        expect(btnHidrogenio).toHaveTextContent('?');

        expect(screen.queryByText('s')).not.toBeInTheDocument();
    });

    it('Nível 3: NÃO deve mostrar índices laterais/superiores', () => {
        const { container } = render(
            <TabelaPeriodicaInterativa
                codNivel={3}
                posicoesCorretas={[]}
                onPosicaoClick={mockOnPosicaoClick}
            />
        );

        const gridContainer = container.firstChild;
        expect(gridContainer).toHaveClass('sem-indices');

        expect(container.querySelector('.indices-superiores')).toBeNull();
    });

    // =========================================================================
    // 3. INTERAÇÃO E LÓGICA DE ACERTO
    // =========================================================================

    it('Deve chamar onPosicaoClick com o nome do elemento ao clicar', () => {
        const { container } = render(
            <TabelaPeriodicaInterativa
                codNivel={1}
                posicoesCorretas={[]}
                onPosicaoClick={mockOnPosicaoClick}
            />
        );

        const btnFerro = getBotaoElemento(container, 'ferro');
        if (!btnFerro) throw new Error('Botão Ferro não encontrado');

        fireEvent.click(btnFerro);

        expect(mockOnPosicaoClick).toHaveBeenCalledTimes(1);
        expect(mockOnPosicaoClick).toHaveBeenCalledWith('ferro');
    });

    it('Deve mostrar o SÍMBOLO e ficar DESABILITADO se estiver na lista de corretos', () => {
        const { container } = render(
            <TabelaPeriodicaInterativa
                codNivel={1}
                posicoesCorretas={['oxigenio']} // Oxigênio já foi acertado
                onPosicaoClick={mockOnPosicaoClick}
            />
        );

        const btnOxigenio = getBotaoElemento(container, 'oxigenio');
        const btnNitrogenio = getBotaoElemento(container, 'nitrogenio');

        expect(btnOxigenio).toHaveTextContent('O');
        expect(btnOxigenio).toBeDisabled();

        expect(btnNitrogenio).toHaveTextContent('p');
        expect(btnNitrogenio).not.toBeDisabled();
    });

    // =========================================================================
    // 4. ESTILIZAÇÃO DINÂMICA
    // =========================================================================

    it('Deve aplicar a classe CSS correta baseada no subnível', () => {
        const { container } = render(
            <TabelaPeriodicaInterativa
                codNivel={1}
                posicoesCorretas={[]}
                onPosicaoClick={mockOnPosicaoClick}
            />
        );

        const btnSodio = getBotaoElemento(container, 'sodio');
        const btnUranio = getBotaoElemento(container, 'uranio');

        expect(btnSodio).toHaveClass('subnivel-s');
        expect(btnUranio).toHaveClass('subnivel-f');
    });
});
