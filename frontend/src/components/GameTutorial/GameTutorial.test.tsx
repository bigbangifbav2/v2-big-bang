import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import GameTutorial from './GameTutorial';
import { driver } from 'driver.js';

// --- MOCKS ---

const mockDrive = vi.fn();
const mockDestroy = vi.fn();

vi.mock('driver.js', () => ({
    driver: vi.fn(() => ({
        drive: mockDrive,
        destroy: mockDestroy
    }))
}));

describe('Componente GameTutorial', () => {
    const onCloseMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // =========================================================================
    // 1. HAPPY PATH (Ativação e Configuração)
    // =========================================================================

    it('Deve inicializar o driver e chamar .drive() quando isActive for true', () => {
        render(<GameTutorial isActive={true} onClose={onCloseMock} />);

        // Verifica se a função construtora driver() foi chamada
        expect(driver).toHaveBeenCalledTimes(1);

        // Verifica se o método .drive() da instância foi chamado
        expect(mockDrive).toHaveBeenCalledTimes(1);
    });

    it('Deve configurar os passos (steps) corretamente com os seletores esperados', () => {
        render(<GameTutorial isActive={true} onClose={onCloseMock} />);

        const driverConfig = (driver as unknown as Mock).mock.calls[0][0];

        expect(driverConfig).toBeDefined();
        expect(driverConfig.steps).toHaveLength(6);

        const steps = driverConfig.steps;

        expect(steps[0].element).toBe('.question-title');
        expect(steps[1].element).toBe('.tour-placar');
        expect(steps[2].element).toBe('.tour-btn-dica');
        expect(steps[3].element).toBe('.tour-opcoes');
        expect(steps[4].element).toBe('.tour-tabela');
        expect(steps[5].element).toBe('.tour-ajudas');
    });

    it('Deve configurar os textos dos botões corretamente', () => {
        render(<GameTutorial isActive={true} onClose={onCloseMock} />);

        const driverConfig = (driver as unknown as Mock).mock.calls[0][0];

        expect(driverConfig.doneBtnText).toBe("Entendi, vamos jogar!");
        expect(driverConfig.nextBtnText).toBe("Próximo");
    });

    // =========================================================================
    // 2. INTERAÇÃO E ENCERRAMENTO (Callbacks)
    // =========================================================================

    it('Deve chamar onClose quando o tutorial for destruído/encerrado', () => {
        render(<GameTutorial isActive={true} onClose={onCloseMock} />);

        const driverConfig = (driver as unknown as Mock).mock.calls[0][0];

        expect(driverConfig.onDestroyStarted).toBeDefined();

        driverConfig.onDestroyStarted();

        expect(onCloseMock).toHaveBeenCalledTimes(1);
        expect(mockDestroy).toHaveBeenCalledTimes(1);
    });

    // =========================================================================
    // 3. UNHAPPY PATH / EDGE CASES
    // =========================================================================

    it('NÃO deve inicializar o driver se isActive for false', () => {
        render(<GameTutorial isActive={false} onClose={onCloseMock} />);

        expect(driver).not.toHaveBeenCalled();
        expect(mockDrive).not.toHaveBeenCalled();
    });

    it('Deve reinicializar o driver se isActive mudar de false para true', () => {
        const { rerender } = render(<GameTutorial isActive={false} onClose={onCloseMock} />);

        expect(driver).not.toHaveBeenCalled();

        rerender(<GameTutorial isActive={true} onClose={onCloseMock} />);

        expect(driver).toHaveBeenCalledTimes(1);
        expect(mockDrive).toHaveBeenCalledTimes(1);
    });
});