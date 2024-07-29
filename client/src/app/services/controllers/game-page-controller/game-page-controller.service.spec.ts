/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed, fakeAsync } from '@angular/core/testing';

import { Room } from '@app/common-client/interfaces/room';
import { GameControllerService } from '@app/services/controllers/game-controller/game-controller.service';
import { GameConnectionSocketService } from '@app/services/sockets/game-connection-socket/game-connection-socket.service';
import { PlayerConnectionSocketService } from '@app/services/sockets/player-connection-socket/player-connection-socket.service';
import { Player } from '@common/classes/player';
import { QuestionType } from '@common/constant/state';
import { GameState } from '@common/enum/socket-messages';
import { Subject, of } from 'rxjs';
import { GamePageControllerService } from './game-page-controller.service';

describe('GamePageControllerService', () => {
    let service: GamePageControllerService;
    let gameControllerSpy: jasmine.SpyObj<GameControllerService>;
    let gameConnectionSocketSpy: jasmine.SpyObj<GameConnectionSocketService>;
    let playerConnectionSocketSpy: jasmine.SpyObj<PlayerConnectionSocketService>;
    const gameSubject = new Subject<string>();
    let mockRoom: Room;
    beforeEach(() => {
        gameControllerSpy = jasmine.createSpyObj('GameController', [
            'findPlayerByName',
            'getGameInfo',
            'leaveRoom',
            'endRoom',
            'assignPlayer',
            'checkIfGameExist',
            'saveIsTesting',
            'saveIsTestingWithRoom',
            'leavePage',
        ]);

        gameConnectionSocketSpy = jasmine.createSpyObj(
            'GameConnectionSocketService',
            ['connect', 'disconnect', 'connectToGameStage', 'connectHostToGame', 'connectPlayersToGame'],
            { gameStageSubject$: gameSubject },
        );
        playerConnectionSocketSpy = jasmine.createSpyObj('PlayerConnectionSocketService', [
            'connect',
            'disconnect',
            'connectPlayerToGame',
            'connectHostToGame',
            'connectPlayersToGame',
        ]);
        TestBed.configureTestingModule({
            providers: [
                { provide: GameControllerService, useValue: gameControllerSpy },
                { provide: GameConnectionSocketService, useValue: gameConnectionSocketSpy },
                { provide: PlayerConnectionSocketService, useValue: playerConnectionSocketSpy },
            ],
        });
        service = TestBed.inject(GamePageControllerService);
        gameControllerSpy = TestBed.inject(GameControllerService) as jasmine.SpyObj<GameControllerService>;
        gameConnectionSocketSpy = TestBed.inject(GameConnectionSocketService) as jasmine.SpyObj<GameConnectionSocketService>;
        playerConnectionSocketSpy = TestBed.inject(PlayerConnectionSocketService) as jasmine.SpyObj<PlayerConnectionSocketService>;
        mockRoom = {
            id: '1',
            quiz: {
                _id: '123',
                title: 'Fake Quiz',
                description: 'Fake description',
                visible: true,
                lastModification: new Date(),
                questions: [
                    {
                        _id: '1',
                        text: 'Quelle est la capitale de la France?',
                        type: QuestionType.QCM,
                        points: 10,
                        choices: [
                            { text: 'Paris', isCorrect: true },
                            { text: 'Berlin', isCorrect: false },
                            { text: 'Londres', isCorrect: false },
                            { text: 'Madrid', isCorrect: false },
                        ],
                        date: new Date(),
                    },
                    {
                        _id: '2',
                        text: 'En quelle année a été déclarée la Première Guerre mondiale?',
                        type: QuestionType.QCM,
                        points: 15,
                        choices: [
                            { text: '1914', isCorrect: true },
                            { text: '1918', isCorrect: false },
                            { text: '1922', isCorrect: false },
                            { text: '1939', isCorrect: false },
                        ],
                        date: new Date(),
                    },
                ],
                duration: 30,
            },
            currentQuestionIndex: 0,
            accessCode: 'ABC1',
            listPlayers: [new Player('Alice'), new Player('Bob'), new Player('Charlie')],
            currentTime: 30,
            roundFinished: false,
            isLocked: false,
            isTesting: false,
            isPaused: false,
            questionStats: [],
            currentState: GameState.END_ROUND,
        };
        gameControllerSpy.assignPlayer.and.returnValue(mockRoom.listPlayers[0]);
        gameControllerSpy.findPlayerByName.and.returnValue(mockRoom.listPlayers[0]);
        gameControllerSpy.getGameInfo.and.returnValue(of(mockRoom));
        gameControllerSpy.checkIfGameExist.and.returnValue(true);
        service.firstSetup(mockRoom.id);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
    it('should call nextQuestion ', () => {
        spyOn<any>(service, 'updateRoomStateAfterRound');
        gameSubject.next(GameState.NEXT_ROUND);
        expect(service['updateRoomStateAfterRound']).toHaveBeenCalled();
    });
    it('should call updateRoom ', () => {
        spyOn<any>(service, 'updateRoomStateAfterRound');
        gameSubject.next(GameState.BETWEEN_ROUNDS);
        expect(service['updateRoomStateAfterRound']).toHaveBeenCalled();
    });
    it('should call updateRoomStateAfterRound ', () => {
        spyOn<any>(service, 'updateRoomStateAfterRound');
        gameSubject.next(GameState.FINAL_END_ROUND);
        expect(service['updateRoomStateAfterRound']).toHaveBeenCalled();
    });
    it('should process room info response', () => {
        service['currentPlayer'] = mockRoom.listPlayers[0];
        service['processRoomInfoResponse'](mockRoom, false);
        expect(service['room']).toEqual(mockRoom);
        expect(service['currentPlayer']).toEqual(mockRoom.listPlayers[0]);
    });
    it('should process room info response', () => {
        service['currentPlayer'] = mockRoom.listPlayers[0];
        service['processRoomInfoResponse'](mockRoom, true);
        expect(service['room']).toEqual(mockRoom);
        expect(service['currentPlayer']).toEqual(mockRoom.listPlayers[0]);
    });
    it('should update room state after round', fakeAsync(() => {
        spyOn<any>(service, 'processRoomInfoResponse');
        service['updateRoomStateAfterRound'](true);

        expect(gameControllerSpy.getGameInfo).toHaveBeenCalled();
        expect(service['processRoomInfoResponse']).toHaveBeenCalledWith(mockRoom, true);
    }));
    it('should call endRoom ', () => {
        gameSubject.next(GameState.END_ROOM);
        expect(gameControllerSpy.endRoom).toHaveBeenCalled();
    });
    it('should call updateRoomStateAfterRound with socket ', () => {
        spyOn<any>(service, 'updateRoomStateAfterRound');
        gameSubject.next(GameState.END_ROUND);
        expect(service['updateRoomStateAfterRound']).toHaveBeenCalled();
    });
    it('should process room information', () => {
        spyOn<any>(service, 'gameVerification').and.returnValue(false);
        spyOn<any>(service, 'assignCurrentQuestion');

        service['processRoomInformation']();

        expect(service['gameVerification']).toHaveBeenCalled();
        expect(service['assignCurrentQuestion']).toHaveBeenCalled();
        expect(gameConnectionSocketSpy.connectToGameStage).toHaveBeenCalledWith(mockRoom);
        expect(gameControllerSpy.assignPlayer).toHaveBeenCalledWith(mockRoom, mockRoom.isTesting);
        expect(playerConnectionSocketSpy.connectPlayerToGame).toHaveBeenCalledWith(mockRoom, mockRoom.listPlayers[0].name);
    });
    it('should verify game existence', () => {
        gameControllerSpy.checkIfGameExist.and.returnValue(false);
        const result = service['gameVerification']();
        expect(result).toBe(false);
        expect(service['currentPlayer']).toEqual(mockRoom.listPlayers[0]);
    });

    it('should assign current question', () => {
        spyOn(service['currentQuestionSubject'], 'next');
        service['assignCurrentQuestion']();
        expect(service['currentQuestionSubject'].next).toHaveBeenCalledWith(mockRoom.quiz.questions[mockRoom.currentQuestionIndex]);
    });
    it('should call leavePage on controller', () => {
        service.leavePage();
        expect(gameControllerSpy.leavePage).toHaveBeenCalled();
    });
});
