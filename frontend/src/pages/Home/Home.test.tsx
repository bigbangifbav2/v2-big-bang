import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Home from './Home';

// --- MOCKS ---

// 1. Mock do useNavigate
const mockedNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const atual = await vi.importActual('react-router-dom');
    return {
        ...atual,
        useNavigate: () => mockedNavigate,
        Link: ({ to, children, onClick }: any) => (
            <a href={to} onClick={(e) => {
                if (onClick) onClick(e);
                e.preventDefault();
            }}>
                {children}
            </a>
        )
    };
});

describe('Página Home', () => {
    const originalAudio = window.Audio;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();

        // Mocks das funções de controle
        const playMock = vi.fn().mockResolvedValue(undefined);
        const pauseMock = vi.fn();

        // 1. CORREÇÃO PROTOTYPE (Para a tag <audio> no JSX)
        Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
            writable: true,
            value: playMock
        });
        Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
            writable: true,
            value: pauseMock
        });
        Object.defineProperty(window.HTMLMediaElement.prototype, 'muted', {
            writable: true,
            value: false
        });

        // 2. CORREÇÃO CONSTRUTOR (Para o new Audio())
        // IMPORTANTE: Usamos 'function' normal em vez de arrow function '() =>'
        // Arrow functions não podem ser chamadas com 'new'.
        window.Audio = vi.fn().mockImplementation(function() {
            return {
                play: playMock,
                pause: pauseMock,
                volume: 1,
                muted: false,
            };
        }) as any;
    });

    afterEach(() => {
        window.Audio = originalAudio;
        vi.restoreAllMocks();
    });

    const renderHome = () => {
        return render(
            <BrowserRouter>
                <Home />
            </BrowserRouter>
        );
    };

    // --- TESTES ---

    it('Deve renderizar o botão de engrenagem (Admin) e o Play', () => {
        renderHome();
        expect(screen.getByTitle('Área Administrativa')).toBeInTheDocument();
        expect(screen.getByTitle('Jogar')).toBeInTheDocument();
    });

    it('Deve redirecionar para Login se clicar no Admin SEM token', () => {
        renderHome();
        const btnAdmin = screen.getByTitle('Área Administrativa');
        fireEvent.click(btnAdmin);
        expect(mockedNavigate).toHaveBeenCalledWith('/login');
    });

    it('Deve redirecionar para Admin se clicar no Admin COM token', () => {
        localStorage.setItem('token', 'token-fake-123');
        renderHome();
        const btnAdmin = screen.getByTitle('Área Administrativa');
        fireEvent.click(btnAdmin);
        expect(mockedNavigate).toHaveBeenCalledWith('/admin/elementos');
    });

    it('Deve alternar o ícone de som ao clicar', () => {
        renderHome();
        const btnSom = screen.getByAltText('Controle de Som');

        expect(btnSom).toHaveAttribute('src', '/img/som_on.png');
        fireEvent.click(btnSom);
        expect(btnSom).toHaveAttribute('src', '/img/som_off.png');
        fireEvent.click(btnSom);
        expect(btnSom).toHaveAttribute('src', '/img/som_on.png');
    });

    it('Deve tentar tocar o som de seleção ao clicar no Play', () => {
        renderHome();

        const btnPlay = screen.getByTitle('Jogar');
        // Usamos closest('a') para garantir que clicamos no link se a imagem não propagar
        const link = btnPlay.closest('a') || btnPlay;

        fireEvent.click(link);

        // CORREÇÃO AQUI: Atualizado para o nome do arquivo que seu código realmente usa
        expect(window.Audio).toHaveBeenCalledWith('/musica/selecao-nivel.wav');
    });
});