import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import SelecaoPerfilPage from './SelecaoPerfilPage';

// --- MOCKS ---

const mockedNavigate = vi.fn();

// 1. Mock do React Router
vi.mock('react-router-dom', async () => {
    const atual = await vi.importActual('react-router-dom');
    return {
        ...atual,
        useNavigate: () => mockedNavigate,
        useParams: () => ({ codNivel: '1' }),
    };
});

describe('Página SelecaoPerfilPage', () => {
    const originalAudio = window.Audio;

    // Tipagem correta para o mock do play
    let playMock: Mock;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();

        // 2. Mock do window.alert
        vi.spyOn(window, 'alert').mockImplementation(() => {});

        // 3. Mock do Áudio (Igual aos testes anteriores)
        playMock = vi.fn().mockResolvedValue(undefined);

        window.Audio = vi.fn().mockImplementation(function(this: HTMLAudioElement) {
            return {
                play: playMock,
                volume: 1,
                // catch simulado para evitar erros de promise não tratada
                catch: vi.fn(),
            } as unknown as HTMLAudioElement;
        }) as unknown as typeof window.Audio;
    });

    afterEach(() => {
        window.Audio = originalAudio;
        vi.restoreAllMocks();
    });

    const renderPage = () => {
        return render(
            <BrowserRouter>
                <SelecaoPerfilPage />
            </BrowserRouter>
        );
    };

    // --- TESTES DE RENDERIZAÇÃO ---

    it('Deve renderizar o título e o input de nome', () => {
        renderPage();
        expect(screen.getByText('Preparando o Jogo')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Digite seu nome...')).toBeInTheDocument();
        expect(screen.getByText('JOGAR')).toBeInTheDocument();
    });

    // --- TESTES DE INTERAÇÃO (AVATAR E SOM) ---

    it('Deve selecionar um avatar e tocar som ao clicar', () => {
        renderPage();

        // Procura a imagem do "Monstro Azul"
        const avatarImg = screen.getByAltText('Monstro Azul');
        // O clique é na div pai da imagem
        const avatarDiv = avatarImg.closest('.avatar-circle');

        if (!avatarDiv) throw new Error('Container do avatar não encontrado');

        fireEvent.click(avatarDiv);

        // Verifica se a classe CSS 'selected' foi aplicada
        expect(avatarDiv).toHaveClass('selected');

        // Verifica se o som tocou
        expect(window.Audio).toHaveBeenCalledWith('/musica/choose-player.wav');
        expect(playMock).toHaveBeenCalled();
    });

    // --- TESTES DE VALIDAÇÃO (CENÁRIOS NEGATIVOS) ---

    it('Deve exibir alert se tentar jogar sem digitar o nome', () => {
        renderPage();

        // Clica em JOGAR sem preencher nada
        const btnJogar = screen.getByText('JOGAR');
        fireEvent.click(btnJogar);

        expect(window.alert).toHaveBeenCalledWith('Por favor, digite seu nome.');
        // Garante que NÃO navegou
        expect(mockedNavigate).not.toHaveBeenCalled();
    });

    it('Deve exibir alert se tentar jogar sem selecionar avatar', () => {
        renderPage();

        // Preenche o nome
        const inputNome = screen.getByPlaceholderText('Digite seu nome...');
        fireEvent.change(inputNome, { target: { value: 'Jogador Teste' } });

        // Clica em JOGAR sem selecionar avatar
        const btnJogar = screen.getByText('JOGAR');
        fireEvent.click(btnJogar);

        expect(window.alert).toHaveBeenCalledWith('Por favor, selecione um avatar.');
        expect(mockedNavigate).not.toHaveBeenCalled();
    });

    // --- TESTE DE SUCESSO (CENÁRIO POSITIVO) ---

    it('Deve salvar dados e iniciar o jogo quando tudo estiver correto', () => {
        renderPage();

        // 1. Preenche Nome
        const inputNome = screen.getByPlaceholderText('Digite seu nome...');
        fireEvent.change(inputNome, { target: { value: 'Mestre da Quimica' } });

        // 2. Seleciona Avatar (ID 1 - Monstro Azul)
        const avatarImg = screen.getByAltText('Monstro Azul');
        const avatarDiv = avatarImg.closest('.avatar-circle');
        if (avatarDiv) fireEvent.click(avatarDiv);

        // Limpa o mock do Audio para garantir que vamos testar o som do botão Jogar agora
        playMock.mockClear();
        (window.Audio as Mock).mockClear();

        // 3. Clica em JOGAR
        const btnJogar = screen.getByText('JOGAR');
        fireEvent.click(btnJogar);

        // VERIFICAÇÕES:

        // A. Tocou o som de início?
        expect(window.Audio).toHaveBeenCalledWith('/musica/selecao-nivel.wav');
        expect(playMock).toHaveBeenCalled();

        // B. Salvou no LocalStorage?
        expect(localStorage.getItem('playerName')).toBe('Mestre da Quimica');
        expect(localStorage.getItem('playerAvatarId')).toBe('1');
        expect(localStorage.getItem('gameNivel')).toBe('1'); // Veio do mock do useParams

        // C. Salvou no SessionStorage?
        expect(sessionStorage.getItem('jogo_ativo')).toBe('true');

        // D. Navegou para a rota certa?
        expect(mockedNavigate).toHaveBeenCalledWith('/jogo/1');
    });

    // --- TESTE DE EFEITO COLATERAL (CLASSE NO BODY) ---

    it('Deve adicionar classe ao body ao montar e remover ao desmontar', () => {
        const { unmount } = renderPage();

        // Verifica se adicionou
        expect(document.body.classList.contains('niveis-page-body')).toBe(true);

        // Desmonta o componente
        unmount();

        // Verifica se removeu
        expect(document.body.classList.contains('niveis-page-body')).toBe(false);
    });
    it('Deve exibir alert se digitar apenas espaços no nome', () => {
        renderPage();
        const inputNome = screen.getByPlaceholderText('Digite seu nome...');
        fireEvent.change(inputNome, { target: { value: '   ' } }); // Apenas espaços

        // Seleciona avatar para isolar o erro no nome
        const avatarImg = screen.getByAltText('Monstro Azul');
        const avatarDiv = avatarImg.closest('.avatar-circle');
        if (avatarDiv) fireEvent.click(avatarDiv);

        const btnJogar = screen.getByText('JOGAR');
        fireEvent.click(btnJogar);

        expect(window.alert).toHaveBeenCalledWith('Por favor, digite seu nome.');
        expect(mockedNavigate).not.toHaveBeenCalled();
    });

    it('Deve garantir que apenas um avatar fique selecionado por vez', () => {
        renderPage();

        const avatar1 = screen.getByAltText('Monstro Azul').closest('.avatar-circle');
        const avatar2 = screen.getByAltText('Monstro Rosa').closest('.avatar-circle');

        if (!avatar1 || !avatar2) throw new Error('Avatares não encontrados');

        // Clica no 1
        fireEvent.click(avatar1);
        expect(avatar1).toHaveClass('selected');
        expect(avatar2).not.toHaveClass('selected');

        // Clica no 2
        fireEvent.click(avatar2);
        expect(avatar2).toHaveClass('selected');
        expect(avatar1).not.toHaveClass('selected'); // O 1 deve perder a classe
    });
});