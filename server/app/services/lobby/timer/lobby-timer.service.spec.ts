/* eslint-disable @typescript-eslint/no-explicit-any */
import { CountDown, TIMER_DELAY } from '@app/app.constants';
import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter } from 'events';
import { LobbyTimer } from './lobby-timer.service';

describe('LobbyTimer', () => {
    let service: LobbyTimer;
    let mockLobbies: {
        [key: string]: {
            game: { duration: number };
            timer: null;
            disablePanicMode: jest.Mock;
            getIsPanicMode: jest.Mock;
            getIsTimerPaused: jest.Mock;
            setTimerPaused: jest.Mock;
            setTimerUnpaused: jest.Mock;
            setPanicMode: jest.Mock;
        };
    };
    let mockEmitter: EventEmitter;
    let setIntervalSpy: jest.SpyInstance;

    beforeEach(async () => {
        jest.useFakeTimers();
        setIntervalSpy = jest.spyOn(global, 'setInterval');
        mockEmitter = new EventEmitter();

        mockLobbies = {
            lobby1: {
                game: { duration: 10 },
                timer: null,
                disablePanicMode: jest.fn(),
                getIsPanicMode: jest.fn(),
                getIsTimerPaused: jest.fn(),
                setTimerPaused: jest.fn(),
                setTimerUnpaused: jest.fn(),
                setPanicMode: jest.fn(),
            },
            lobby2: {
                game: { duration: 15 },
                timer: null,
                disablePanicMode: jest.fn(),
                getIsPanicMode: jest.fn(),
                getIsTimerPaused: jest.fn(),
                setTimerPaused: jest.fn(),
                setTimerUnpaused: jest.fn(),
                setPanicMode: jest.fn(),
            },
        };

        jest.spyOn(global, 'setInterval');
        jest.spyOn(global, 'clearInterval');

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LobbyTimer,
                {
                    provide: 'SharedLobbies',
                    useValue: mockLobbies,
                },
            ],
        }).compile();

        service = module.get<LobbyTimer>(LobbyTimer);
        service.lobbyCountdown = mockEmitter;
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    it('should start a countdown for an existing lobby for GameStart', () => {
        const mockEmit = jest.fn();
        mockEmitter.on('countdown', mockEmit);
        service.startCountdown('lobby1', CountDown.GameStart);
        jest.advanceTimersByTime(TIMER_DELAY);
        expect(setIntervalSpy).toHaveBeenCalledTimes(1);
        expect(setIntervalSpy).toHaveBeenLastCalledWith(expect.any(Function), TIMER_DELAY);
        expect(mockEmit).toHaveBeenCalledWith({ lobbyId: 'lobby1', countdownDuration: CountDown.GameStart });
    });

    it('should not start a countdown for a non-existing lobby', () => {
        service.startCountdown('nonexistent', CountDown.GameStart);
        expect(setInterval).not.toHaveBeenCalled();
    });

    it('should stop any existing countdown for the lobby', () => {
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
        service.startCountdown('lobby1', CountDown.GameStart);
        service.startCountdown('lobby1', CountDown.NextQuestion);
        expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should remove the timer when countdown reaches zero', () => {
        service.startCountdown('lobby1', CountDown.GameStart);
        jest.advanceTimersByTime((CountDown.GameStart + 1) * TIMER_DELAY);
        expect(mockLobbies['lobby1'].timer).toBeUndefined();
    });

    it('should remove the timer when countdown reaches zero', () => {
        service.startCountdown('lobby1', CountDown.GameStart);
        jest.advanceTimersByTime((CountDown.GameStart + 1) * TIMER_DELAY);
        expect(mockLobbies['lobby1'].timer).toBeUndefined();
    });

    it('should remove the timer when countdown of the question reaches zero', () => {
        service.startCountdown('lobby1', CountDown.QuestionTime);
        jest.advanceTimersByTime((mockLobbies['lobby1'].game.duration + 1) * TIMER_DELAY);
        expect(mockLobbies['lobby1'].timer).toBeUndefined();
    });

    it('should remove the timer when countdown of the Qrl reaches zero', () => {
        service.startCountdown('lobby1', CountDown.QuestionTimeQrl);
        jest.advanceTimersByTime((CountDown.QuestionTimeQrl + 1) * TIMER_DELAY);
        expect(mockLobbies['lobby1'].timer).toBeUndefined();
    });

    it('should stop an existing countdown', () => {
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
        service.startCountdown('lobby1', CountDown.GameStart);
        // retrait du lint du any pour tester la fonction privée
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (service as any).stopCountdown('lobby1');
        expect(clearIntervalSpy).toHaveBeenCalled();
        expect(mockLobbies['lobby1'].timer).toBeUndefined();
    });

    it('should do nothing if there is no existing countdown', () => {
        const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
        // retrait du lint du any pour tester la fonction privée
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (service as any).stopCountdown('lobby1');
        expect(clearIntervalSpy).not.toHaveBeenCalled();
    });

    it('should pause the countdown when pauseCountdown is called', () => {
        const lobbyId = 'lobby1';
        const mockLobby = mockLobbies[lobbyId];
        const setTimerPausedSpy = jest.spyOn(mockLobby, 'setTimerPaused');
        service.startCountdown(lobbyId, CountDown.QuestionTime);

        service.pauseCountdown(lobbyId);

        expect(setTimerPausedSpy).toHaveBeenCalled();
    });

    it('should unpause the countdown when unpauseCountdown is called', () => {
        const lobbyId = 'lobby1';
        const mockLobby = mockLobbies[lobbyId];
        const setTimerUnpausedSpy = jest.spyOn(mockLobby, 'setTimerUnpaused');
        service.startCountdown(lobbyId, CountDown.QuestionTime);
        service.pauseCountdown(lobbyId);
        service.unpauseCountdown(lobbyId);

        expect(setTimerUnpausedSpy).toHaveBeenCalled();
    });

    it('should set panic mode when setPanicMode is called', () => {
        const lobbyId = 'lobby1';
        const mockLobby = mockLobbies[lobbyId];
        const setPanicModeSpy = jest.spyOn(mockLobby, 'setPanicMode');
        service.startCountdown(lobbyId, CountDown.QuestionTime);
        service.setPanicMode(lobbyId);

        expect(setPanicModeSpy).toHaveBeenCalled();
    });

    it('should do nothing when pausing countdown if there is no existing timer', () => {
        const lobbyId = 'lobby1';
        mockLobbies[lobbyId].timer = undefined;
        const setTimerPausedSpy = jest.spyOn(mockLobbies[lobbyId], 'setTimerPaused');

        service.pauseCountdown(lobbyId);

        expect(setTimerPausedSpy).not.toHaveBeenCalled();
    });

    it('should do nothing when unpausing countdown if there is no existing timer', () => {
        const lobbyId = 'lobby1';
        mockLobbies[lobbyId].timer = undefined;
        const setTimerUnpausedSpy = jest.spyOn(mockLobbies[lobbyId], 'setTimerUnpaused');

        service.unpauseCountdown(lobbyId);

        expect(setTimerUnpausedSpy).not.toHaveBeenCalled();
    });

    it('should do nothing when setting panic mode if there is no existing timer', () => {
        const lobbyId = 'lobby1';
        mockLobbies[lobbyId].timer = undefined;
        const setPanicModeSpy = jest.spyOn(mockLobbies[lobbyId], 'setPanicMode');

        service.setPanicMode(lobbyId);

        expect(setPanicModeSpy).not.toHaveBeenCalled();
    });
    it('should set up timer with panic mode handling', () => {
        const lobbyId = 'lobby1';
        const countDown = CountDown.QuestionTime;

        service.startCountdown(lobbyId, countDown);

        mockLobbies[lobbyId].getIsPanicMode.mockReturnValueOnce(true);

        jest.runOnlyPendingTimers();

        expect(clearInterval).toHaveBeenCalledTimes(1);
        expect(mockLobbies[lobbyId].timer).toBeDefined();
        expect(setInterval).toHaveBeenCalledTimes(2);
        expect(mockLobbies[lobbyId].timer).toBeDefined();
    });
});
