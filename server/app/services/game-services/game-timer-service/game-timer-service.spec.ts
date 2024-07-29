import { Room } from '@app/common-server/room';
import { GameConnectionGateway } from '@app/gateways/game-connection/game-connection.gateway';
import { TimerGateway } from '@app/gateways/timer/timer.gateway';
import { Player } from '@common/classes/player';
import { RANDOM_INT_VALUE, SAFE_TIME_ANSWERS, TIMEOUT } from '@common/constant/constants';
import { GameState } from '@common/enum/socket-messages';
import { Question } from '@common/interfaces/question';
import { Test, TestingModule } from '@nestjs/testing';
import { GameServiceTimer } from './game-timer-service';

describe('GameServiceTimer', () => {
    let service: GameServiceTimer;
    let mockTimerGateway: Partial<TimerGateway>;
    let mockGameConnectionGateway: Partial<GameConnectionGateway>;
    let room: Room;
    beforeEach(async () => {
        jest.useFakeTimers();
        mockTimerGateway = { updateTimeForQuestion: jest.fn() };
        mockGameConnectionGateway = { sendRoomState: jest.fn() };
        room = {
            id: 'room1',
            listPlayers: [new Player('Player 1'), new Player('Player 2')],
            quiz: {
                questions: [
                    { _id: 'q1', text: 'Question 1', points: 10, choices: [], date: new Date() } as Question,
                    { _id: 'q2', text: 'Question 2', points: 20, choices: [], date: new Date() } as Question,
                ],
                duration: 30,
                visible: true,
                lastModification: new Date(),
                _id: 'quizId',
                title: 'Sample Quiz',
                description: 'A sample quiz for testing',
            },
            isPanicMode: false,
            accessCode: 'ACCESS123',
            numberOfPlayers: 0,
            nameBanned: [],
            currentTime: 30,
            bestScore: 0,
            currentQuestionIndex: 0,
            isLocked: false,
            lockPlayerPoints: false,
            roundFinished: false,
            isTesting: false,
            randomMode: false,
            dateCreated: new Date(),
            isPaused: false,
            currentState: GameState.END_ROUND,
            timer: setTimeout(() => {
                /* empty */
            }, TIMEOUT),
            questionStats: [],
        };
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GameServiceTimer,
                { provide: TimerGateway, useValue: mockTimerGateway },
                { provide: GameConnectionGateway, useValue: mockGameConnectionGateway },
            ],
        }).compile();

        service = module.get<GameServiceTimer>(GameServiceTimer);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('startTimerForRoom', () => {
        it('should start a timer for the room with the specified interval and execute onComplete when time is up', () => {
            jest.useFakeTimers();
            const onComplete = jest.fn();

            const setIntervalSpy = jest.spyOn(global, 'setInterval');
            const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

            service.startTimerForRoom(room, room.quiz.duration, onComplete);

            expect(setIntervalSpy).toHaveBeenCalled();
            expect(room.timer).not.toBeNull();

            jest.advanceTimersByTime(RANDOM_INT_VALUE);

            expect(onComplete).toHaveBeenCalled();
            expect(room.currentTime).toBe(1);
            expect(clearIntervalSpy).toHaveBeenCalled();

            setIntervalSpy.mockRestore();
            jest.useRealTimers();
        });
    });
    describe('startPanicTimerForRoom', () => {
        it('should start a panic mode timer for the room with a faster interval and execute onComplete when time is up', () => {
            jest.useFakeTimers();
            const onComplete = jest.fn();

            const setIntervalSpy = jest.spyOn(global, 'setInterval');
            const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

            service.startPanicTimerForRoom(room, room.quiz.duration, onComplete);
            expect(setIntervalSpy).toHaveBeenCalled();
            expect(room.timer).not.toBeNull();

            jest.advanceTimersByTime(RANDOM_INT_VALUE);

            expect(onComplete).toHaveBeenCalled();
            expect(room.currentTime).toBe(1);
            expect(clearIntervalSpy).toHaveBeenCalled();
            jest.useRealTimers();
        });
    });
    describe('timerNextRoundManager', () => {
        beforeEach(() => {
            jest.spyOn(service, 'updateClientTime').mockImplementation();
            jest.spyOn(service, 'stopTimerForRoom').mockImplementation();
            jest.spyOn(mockGameConnectionGateway, 'sendRoomState').mockImplementation();
        });

        it('should send GameState.SEND_ANSWERS message and stop the timer if it is a round', () => {
            const result = service.timerNextRoundManager(room, true);

            expect(service.updateClientTime).toHaveBeenCalledWith(room, 0);
            expect(service.stopTimerForRoom).toHaveBeenCalledWith(room);
            expect(mockGameConnectionGateway.sendRoomState).toHaveBeenCalledWith(room.id, GameState.SEND_ANSWERS);
            expect(result).toBe(GameState.NONE);
        });

        it('should just reset the time and return GameState.NEXT_ROUND if it is not a round', () => {
            const result = service.timerNextRoundManager(room, false);

            expect(service.updateClientTime).toHaveBeenCalledWith(room, 0);
            expect(result).toBe(GameState.NEXT_ROUND);
        });
    });
    describe('startTimerFirstToAnswer', () => {
        it('should lock player points after SAFE_TIME_ANSWERS milliseconds', async () => {
            expect(room.lockPlayerPoints).toBe(false);
            service.startTimerFirstToAnswer(room);
            jest.advanceTimersByTime(SAFE_TIME_ANSWERS);

            expect(room.lockPlayerPoints).toBe(true);
        });
    });
});
