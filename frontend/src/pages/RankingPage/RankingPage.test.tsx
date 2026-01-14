import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import RankingPage from './RankingPage';

// --- MOCKS E DADOS ---

const mockRankingData = [
    { usuario: 'Alice', pontuacao: 100, nivel: 'INICIANTE', data_hora: '2023-01-01' },
    { usuario: 'Bob', pontuacao: 50, nivel: 'INICIANTE', data_hora: '2023-01-01' },
    { usuario: 'Charlie', pontuacao: 200, nivel: 'CIENTISTA', data_hora: '2023-01-01' },
    { usuario: 'Dave', pontuacao: 80, nivel: 'CURIOSO', data_hora: '2023-01-01' },
];

const renderWithRouter = (component: React.ReactNode) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Página RankingPage', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        sessionStorage.clear();
        document.body.className = '';

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockRankingData,
        });
    });

    afterEach(() => {
        cleanup();
    });

    // =========================================================================
    // 1. TESTES DE CICLO DE VIDA E EFEITOS
    // =========================================================================

    describe('Ciclo de Vida e Efeitos', () => {

        it('Deve adicionar a classe "ranking-page-body" ao body ao montar e remover ao desmontar', async () => {
            const { unmount } = renderWithRouter(<RankingPage />);

            expect(document.body.classList.contains('ranking-page-body')).toBe(true);

            // Aguarda carregamento para evitar act warning
            await waitFor(() => screen.getByAltText('Ranking'));

            unmount();

            expect(document.body.classList.contains('ranking-page-body')).toBe(false);
        });

        it('Deve limpar "jogo_ativo" do sessionStorage ao carregar', async () => {
            sessionStorage.setItem('jogo_ativo', 'true');

            renderWithRouter(<RankingPage />);

            expect(sessionStorage.getItem('jogo_ativo')).toBeNull();

            // CORREÇÃO ACT WARNING:
            // Precisamos esperar o fetch terminar mesmo que não usemos o resultado neste teste,
            // senão o estado atualiza depois que o teste acaba.
            await waitFor(() => screen.getByAltText('Ranking'));
        });
    });

    // =========================================================================
    // 2. CAMINHOS BONS (HAPPY PATH)
    // =========================================================================

    describe('Happy Path (Renderização e Lógica)', () => {

        it('Deve exibir "Carregando Ranking..." inicialmente', () => {
            globalThis.fetch = vi.fn().mockReturnValue(new Promise(() => {}));
            renderWithRouter(<RankingPage />);
            expect(screen.getByText(/Carregando Ranking.../i)).toBeInTheDocument();
        });

        it('Deve renderizar os dados corretamente separados por colunas', async () => {
            renderWithRouter(<RankingPage />);

            await waitFor(() => {
                expect(screen.getByText('INICIANTE')).toBeInTheDocument();
                expect(screen.getByText('CURIOSO')).toBeInTheDocument();
                expect(screen.getByText('CIENTISTA')).toBeInTheDocument();
            });

            expect(screen.getByText(/Alice - 100 pts/i)).toBeInTheDocument();
            expect(screen.getByText(/Charlie - 200 pts/i)).toBeInTheDocument();
        });

        it('Deve ordenar os jogadores por pontuação (maior para o menor)', async () => {
            const unsortedData = [
                { usuario: 'Fraco', pontuacao: 10, nivel: 'INICIANTE' },
                { usuario: 'Forte', pontuacao: 900, nivel: 'INICIANTE' },
                { usuario: 'Medio', pontuacao: 50, nivel: 'INICIANTE' },
            ];

            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => unsortedData,
            });

            renderWithRouter(<RankingPage />);

            await waitFor(() => screen.getByText('INICIANTE'));

            const items = screen.getAllByRole('heading', { level: 6 });

            expect(items[0]).toHaveTextContent('1. Forte - 900 pts');
            expect(items[1]).toHaveTextContent('2. Medio - 50 pts');
            expect(items[2]).toHaveTextContent('3. Fraco - 10 pts');
        });

        it('Deve limitar a exibição ao TOP 10 jogadores por nível', async () => {
            const manyUsers = Array.from({ length: 12 }, (_, i) => ({
                usuario: `User${i}`,
                pontuacao: 100 - i,
                nivel: 'INICIANTE'
            }));

            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => manyUsers,
            });

            renderWithRouter(<RankingPage />);

            await waitFor(() => screen.getByText('INICIANTE'));

            expect(screen.getByText(/1. User0/i)).toBeInTheDocument();
            expect(screen.getByText(/10. User9/i)).toBeInTheDocument();
            expect(screen.queryByText(/11. User10/i)).not.toBeInTheDocument();
        });

        it('Deve exibir as imagens dos troféus corretas para cada nível', async () => {
            renderWithRouter(<RankingPage />);
            await waitFor(() => screen.getByText('INICIANTE'));

            const imgBronze = screen.getByAltText('Troféu INICIANTE');
            const imgPrata = screen.getByAltText('Troféu CURIOSO');
            const imgOuro = screen.getByAltText('Troféu CIENTISTA');

            expect(imgBronze).toHaveAttribute('src', '/img/trofeu/bronze.png');
            expect(imgPrata).toHaveAttribute('src', '/img/trofeu/prata.png');
            expect(imgOuro).toHaveAttribute('src', '/img/trofeu/ouro.png');
        });

        it('Deve aplicar classes de cor alternadas (Zebra Striping)', async () => {
            const zebraData = [
                { usuario: 'A', pontuacao: 10, nivel: 'INICIANTE' },
                { usuario: 'B', pontuacao: 9, nivel: 'INICIANTE' },
                { usuario: 'C', pontuacao: 8, nivel: 'INICIANTE' },
            ];

            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => zebraData,
            });

            renderWithRouter(<RankingPage />);
            await waitFor(() => screen.getByText('INICIANTE'));

            const linha1 = screen.getByText(/1. A/i);
            const linha2 = screen.getByText(/2. B/i);
            const linha3 = screen.getByText(/3. C/i);

            expect(linha1).toHaveClass('cor2');
            expect(linha2).toHaveClass('cor1');
            expect(linha3).toHaveClass('cor2');
        });
    });

    // =========================================================================
    // 3. CAMINHOS RUINS (UNHAPPY PATH)
    // =========================================================================

    describe('Unhappy Path (Erros e Falhas)', () => {

        it('Deve exibir mensagem de erro genérica se a API retornar status diferente de OK', async () => {
            // Mock de console.error para não poluir o terminal, pois esperamos um erro
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            });

            renderWithRouter(<RankingPage />);

            // CORREÇÃO DO TESTE QUE FALHAVA:
            // O componente exibe uma mensagem fixa quando cai no catch/erro,
            // e não o texto exato do erro 500.
            await waitFor(() => {
                expect(screen.getByText(/Falha ao carregar o ranking/i)).toBeInTheDocument();
            });

            consoleSpy.mockRestore();
        });

        it('Deve exibir mensagem de falha se o fetch lançar exceção (ex: Rede)', async () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network Error'));

            renderWithRouter(<RankingPage />);

            await waitFor(() => {
                expect(screen.getByText(/Falha ao carregar o ranking/i)).toBeInTheDocument();
            });

            consoleSpy.mockRestore();
        });

        it('Deve exibir "Nenhum dado" nas colunas se a API retornar array vazio', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => [],
            });

            renderWithRouter(<RankingPage />);

            await waitFor(() => screen.getByText('INICIANTE'));

            const msgs = screen.getAllByText('Nenhum dado.');
            expect(msgs).toHaveLength(3);
        });

        it('Deve exibir "Nenhum dado" apenas na coluna que não tiver dados', async () => {
            const partialData = [
                { usuario: 'Solo', pontuacao: 10, nivel: 'INICIANTE' }
            ];

            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => partialData,
            });

            renderWithRouter(<RankingPage />);
            await waitFor(() => screen.getByText('INICIANTE'));

            expect(screen.getByText(/1. Solo/i)).toBeInTheDocument();

            const msgs = screen.getAllByText('Nenhum dado.');
            expect(msgs).toHaveLength(2);
        });
    });
});