import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import JogoPage from './JogoPage';

// --- CONFIGURAÇÃO DE MOCKS GLOBAIS ---

// 1. Mock do React Router
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const atual = await vi.importActual('react-router-dom');
    return {
        ...atual,
        useNavigate: () => mockedNavigate,
        useParams: () => ({ codNivel: '1' }),
    };
});

// 2. Mock do Tutorial
vi.mock('../../components/GameTutorial/GameTutorial', () => ({
    default: () => <div data-testid="mock-tutorial"></div>
}));


// 3. Mock da Tabela Periódica
// O caminho deve ser EXATAMENTE igual ao import dentro do JogoPage.tsx
vi.mock('../../components/TabelaPeriodicaInterativa/TabelaPeriodicaInterativa', () => ({
    default: ({ onPosicaoClick }: { onPosicaoClick: (val: string) => void }) => (
        <div data-testid="tabela-mock">
            <button onClick={() => onPosicaoClick('hidrogenio')}>Posição H</button>
            <button onClick={() => onPosicaoClick('helio')}>Posição He</button>
            <button onClick={() => onPosicaoClick('errado')}>Posição Errada</button>
        </div>
    )
}));

// --- DADOS MOCKADOS ---
const mockData = {
    listaOpcoes: [
        { nome: 'hidrogenio', simbolo: 'H', imgUrl: '/img/h.png' },
        { nome: 'helio', simbolo: 'He', imgUrl: '/img/he.png' }
    ],
    rodadas: [
        {
            nomeElemento: 'hidrogenio',
            posicaoElemento: 'hidrogenio',
            dicas: ['Dica 1', 'Dica 2']
        },
        {
            nomeElemento: 'helio',
            posicaoElemento: 'helio',
            dicas: ['Dica Helio']
        }
    ]
};

describe('Página JogoPage', () => {
    const originalAudio = window.Audio;
    let playMock: Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();

        localStorage.setItem('bigbang_tutorial_v5', 'true');
        sessionStorage.setItem('jogo_ativo', 'true');
        localStorage.setItem('playerName', 'Tester');

        window.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => mockData,
        }) as unknown as typeof fetch;

        // --- MOCK DO AUDIO ---
        playMock = vi.fn().mockResolvedValue(undefined);
        class AudioMock {
            volume = 1;
            play = playMock;
            pause = vi.fn();
            catch = vi.fn();
        }
        window.Audio = AudioMock as any;
    });

    afterEach(() => {
        window.Audio = originalAudio;
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    const renderPage = () => render(
        <BrowserRouter>
            <JogoPage />
        </BrowserRouter>
    );

    // --- TESTES DE INICIALIZAÇÃO ---

    it('Deve redirecionar para Home se não houver permissão no sessionStorage', () => {
        sessionStorage.removeItem('jogo_ativo');
        renderPage();
        expect(mockedNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('Deve exibir erro se a API falhar', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        window.fetch = vi.fn().mockRejectedValue(new Error('Falha na API')) as unknown as typeof fetch;

        renderPage();

        await waitFor(() => {
            expect(screen.getByText(/Erro: Falha na API/i)).toBeInTheDocument();
        });
        consoleSpy.mockRestore();
    });

    it('Deve renderizar o jogo corretamente após carregar', async () => {
        renderPage();
        await waitFor(() => {
            expect(screen.getByText(/Clique em DICAS/i)).toBeInTheDocument();
            // Verifica se o mock da tabela carregou
            expect(screen.getByTestId('tabela-mock')).toBeInTheDocument();
        });
    });

    // --- TESTES INTERATIVOS ---

    it('Deve permitir usar dica, selecionar elemento correto e posição correta', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        renderPage();

        await waitFor(() => expect(screen.getByAltText('hidrogenio')).toBeInTheDocument());

        // 1. Clica em DICA
        fireEvent.click(screen.getByText('DICAS'));
        expect(screen.getByText('1 - Dica 1')).toBeInTheDocument();

        // 2. Clica no ELEMENTO CORRETO (Card Lateral)
        fireEvent.click(screen.getByAltText('hidrogenio'));
        expect(screen.getByText(/ACERTOU/i)).toBeInTheDocument();

        // Avança tempo (Feedback -> Libera Tabela)
        act(() => { vi.advanceTimersByTime(2000); });

        // 3. Clica na POSIÇÃO NA TABELA (Botão do Mock)
        const btnPosicao = await screen.findByText('Posição H');
        fireEvent.click(btnPosicao);

        expect(screen.getByText(/POSIÇÃO CORRETA/i)).toBeInTheDocument();

        // Avança tempo (Próxima Rodada)
        act(() => { vi.advanceTimersByTime(2000); });

        await waitFor(() => {
            expect(screen.getByText(/Rodada 2/i)).toBeInTheDocument();
        });
    });

    it('Deve tratar erro do usuário (Elemento errado)', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        renderPage();
        await waitFor(() => expect(screen.getByAltText('hidrogenio')).toBeInTheDocument());

        fireEvent.click(screen.getByText('DICAS'));

        // Clica no Elemento Errado
        fireEvent.click(screen.getByAltText('helio'));
        expect(screen.getByText(/ERROU/i)).toBeInTheDocument();

        // Avança tempo (Reset do Feedback)
        act(() => { vi.advanceTimersByTime(2000); });

        // Se errou o elemento, ele pula pra próxima rodada (conforme lógica padrão)
        await waitFor(() => {
            expect(screen.getByText(/Rodada 2/i)).toBeInTheDocument();
        });
    });

    it('Deve tratar erro ao selecionar a posição errada na tabela', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        renderPage();
        await waitFor(() => expect(screen.getByAltText('hidrogenio')).toBeInTheDocument());

        // Acerta elemento primeiro
        fireEvent.click(screen.getByText('DICAS'));
        fireEvent.click(screen.getByAltText('hidrogenio'));

        act(() => { vi.advanceTimersByTime(2000); });

        // Erro na Tabela
        const btnErro = await screen.findByText('Posição Errada');
        fireEvent.click(btnErro);

        expect(screen.getByText(/Posição incorreta/i)).toBeInTheDocument();

        act(() => { vi.advanceTimersByTime(2000); });

        await waitFor(() => {
            expect(screen.getByText(/Rodada 2/i)).toBeInTheDocument();
        });
    });

    it('Deve desabilitar o botão de dicas se todas já foram exibidas', async () => {
        renderPage();
        await waitFor(() => expect(screen.getByText('DICAS')).toBeInTheDocument());

        const btnDica = screen.getByText('DICAS');

        fireEvent.click(btnDica);
        await waitFor(() => expect(screen.getByText('1 - Dica 1')).toBeInTheDocument());

        fireEvent.click(btnDica);
        await waitFor(() => expect(screen.getByText('2 - Dica 2')).toBeInTheDocument());

        await waitFor(() => {
            expect(btnDica).toBeDisabled();
        });
    });

    it('Deve finalizar o jogo e submeter pontuação', async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });

        // Simula API retornando apenas 1 rodada
        const dadosCurtos = { ...mockData, rodadas: [mockData.rodadas[0]] };
        window.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => dadosCurtos,
        }) as unknown as typeof fetch;

        renderPage();
        await waitFor(() => expect(screen.getByAltText('hidrogenio')).toBeInTheDocument());

        // Joga a rodada
        fireEvent.click(screen.getByText('DICAS'));
        fireEvent.click(screen.getByAltText('hidrogenio'));
        act(() => { vi.advanceTimersByTime(2000); });

        const btnPosicao = await screen.findByText('Posição H');
        fireEvent.click(btnPosicao);

        // Delay fim de jogo
        act(() => { vi.advanceTimersByTime(2000); });

        // Verifica Fim de Jogo
        await waitFor(() => {
            expect(screen.getByAltText('Fim de Jogo')).toBeInTheDocument();
        });

        expect(window.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/submeter-pontuacao'),
            expect.objectContaining({ method: 'POST' })
        );
    });
});