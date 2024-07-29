/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import { AddPlayerResponse } from '@app/common-client/interfaces/add-player';
import { Room } from '@app/common-client/interfaces/room';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { GameManager } from '@app/services/managers/game-manager/game-manager.service';
import { Player } from '@common/classes/player';
import { GameMessage } from '@common/client-message/game-pop-up';
import { QuestionType } from '@common/constant/state';
import { GameState } from '@common/enum/socket-messages';
import { Answer } from '@common/interfaces/answer';
import { Observable, Subject, of, throwError } from 'rxjs';
import { GameControllerService } from './game-controller.service';

describe('GameControllerService', () => {
    let service: GameControllerService;
    let gameManagerSpy: jasmine.SpyObj<GameManager>;
    let mockRoom: Room;
    let answers: Answer[];
    let dialog: jasmine.SpyObj<MatDialog>;
    let routerSpy: jasmine.SpyObj<Router>;
    const routerEventsSubject = new Subject<Event | NavigationEnd>();
    beforeEach(() => {
        gameManagerSpy = jasmine.createSpyObj('GameManager', [
            'createSession',
            'addPlayer',
            'verifAnswers',
            'setQrlAnswer',
            'nextRound',
            'deleteRoom',
            'getGameInfo',
            'joinRoom',
            'leaveRoom',
        ]);
        routerSpy = jasmine.createSpyObj('Router', ['navigate'], { events: routerEventsSubject.asObservable() as Observable<Event> });
        const dialogMock = jasmine.createSpyObj('MatDialog', ['open']);

        TestBed.configureTestingModule({
            providers: [
                GameControllerService,
                { provide: GameManager, useValue: gameManagerSpy },
                { provide: MatDialog, useValue: dialogMock },
                { provide: Router, useValue: routerSpy },
            ],
        });

        service = TestBed.inject(GameControllerService);
        gameManagerSpy = TestBed.inject(GameManager) as jasmine.SpyObj<GameManager>;
        dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
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
        answers = [
            { text: 'Answer 1', isCorrect: true },
            { text: 'Answer 2', isCorrect: false },
        ];
        gameManagerSpy.getGameInfo.and.returnValue(of(mockRoom));
        gameManagerSpy.createSession.and.returnValue(of(mockRoom.id));
        gameManagerSpy.joinRoom.and.returnValue(of());
    });
    describe('leavePage', () => {
        it('should navigate to /create-game if isTesting is true', () => {
            service['isTesting'] = true;
            spyOn(sessionStorage, 'getItem').and.returnValue(JSON.stringify(true));
            service.leavePage();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/create-game']);
        });

        it('should navigate to /home if isTesting is false', () => {
            service['isTesting'] = false;
            spyOn(sessionStorage, 'getItem').and.returnValue(JSON.stringify(false));
            service.leavePage();
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
        });
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    describe('createSession', () => {
        it('should navigate to game route when isTesting is true', () => {
            const mockAddPlayerResponse: AddPlayerResponse = {
                id: 'mockedId',
                msg: 'Mocked message',
            };
            gameManagerSpy.createSession.and.returnValue(of(mockRoom.id));
            gameManagerSpy.joinRoom.and.returnValue(of(mockAddPlayerResponse));

            service.createSession('123', true, false);
            expect(gameManagerSpy.createSession).toHaveBeenCalledWith('123', true, false);
            expect(gameManagerSpy.joinRoom).toHaveBeenCalledWith('Admin', mockRoom.accessCode, false);
            expect(routerSpy.navigate).toHaveBeenCalledWith([`/game/${mockRoom.id}`], { queryParams: { roomId: mockRoom.id, testing: true } });
        });

        it('should navigate to waiting-room route when isTesting is false', () => {
            gameManagerSpy.createSession.and.returnValue(of(mockRoom.id));

            service.createSession('123', false, false);

            expect(gameManagerSpy.createSession).toHaveBeenCalledWith('123', false, false);
            expect(routerSpy.navigate).toHaveBeenCalledWith([`/organizer/${mockRoom.id}`], {
                queryParams: { roomId: mockRoom.id, playerName: 'Admin', randomMode: 'false' },
            });
        });

        it('should navigate to waiting-room route with randomMode when isTesting is false and randomMode is true', () => {
            gameManagerSpy.createSession.and.returnValue(of(mockRoom.id));
            service.createSession('123', false, true);
            expect(gameManagerSpy.createSession).toHaveBeenCalledWith('123', false, true);
        });

        it('should handle error during createSession', () => {
            const errorMessage = 'Failed to create session';
            gameManagerSpy.createSession.and.returnValue(throwError(() => new Error(errorMessage)));

            service.createSession('quizId', true, false);

            expect(gameManagerSpy.createSession).toHaveBeenCalledWith('quizId', true, false);
            expect(dialog.open).toHaveBeenCalledWith(MessageDialogComponent, {
                data: { message: GameMessage.CANT_GET_ROOM },
            });
        });
    });

    describe('verificationAnswers', () => {
        it('should return true on successful verification', () => {
            const currentPlayer = 'Alice';

            gameManagerSpy.verifAnswers.and.returnValue(of(true));

            service.verificationAnswers(mockRoom.id, currentPlayer, answers).subscribe((result) => {
                expect(result).toBe(true);
                expect(gameManagerSpy.verifAnswers).toHaveBeenCalledWith(mockRoom.id.toString(), currentPlayer, answers);
            });
        });

        describe('setQrlAnswer', () => {
            const roomId = '1';
            const currentPlayer = 'Alice';
            const qrlAnswer = 'QR answer';

            it('should return true on successful setQrlAnswer', () => {
                gameManagerSpy.setQrlAnswer.and.returnValue(of(true));

                service.setQrlAnswer(roomId, currentPlayer, qrlAnswer).subscribe((result) => {
                    expect(result).toBe(true);
                    expect(gameManagerSpy.setQrlAnswer).toHaveBeenCalledWith(roomId, currentPlayer, qrlAnswer);
                });
            });

            it('should return false and handle error on setQrlAnswer failure', () => {
                const errorMessage = 'Failed to set QR answer';

                gameManagerSpy.setQrlAnswer.and.returnValue(throwError(() => new Error(errorMessage)));

                service.setQrlAnswer(roomId, currentPlayer, qrlAnswer).subscribe((result) => {
                    expect(result).toBe(false);
                    expect(gameManagerSpy.setQrlAnswer).toHaveBeenCalledWith(roomId, currentPlayer, qrlAnswer);
                    expect(dialog.open).toHaveBeenCalledWith(MessageDialogComponent, {
                        data: { message: GameMessage.CANT_VERIFY_ANSWER },
                    });
                });
            });
        });

        it('should return false and handle error on verification failure', () => {
            const currentPlayer = 'Alice';
            const errorMessage = 'Failed to verify answers';

            gameManagerSpy.verifAnswers.and.returnValue(throwError(() => new Error(errorMessage)));

            service.verificationAnswers(mockRoom.id, currentPlayer, answers).subscribe((result) => {
                expect(result).toBe(false);
                expect(gameManagerSpy.verifAnswers).toHaveBeenCalledWith(mockRoom.id.toString(), currentPlayer, answers);
                expect(dialog.open).toHaveBeenCalledWith(MessageDialogComponent, {
                    data: { message: GameMessage.CANT_VERIFY_ANSWER },
                });
            });
        });
    });

    describe('findPlayerByName', () => {
        it('should return a player when found in the list', () => {
            const result = service.findPlayerByName(mockRoom.listPlayers, mockRoom.listPlayers[0].name);
            expect(result).toBe(mockRoom.listPlayers[0]);
        });

        it('should return a new Player with name "null" when player not found', () => {
            const result = service.findPlayerByName(mockRoom.listPlayers, 'name');
            expect(result.name).toBe('null');
        });
    });

    describe('startNextRound', () => {
        it('should return true on successful startNextRound', () => {
            gameManagerSpy.nextRound.and.returnValue(of(true));

            service.startNextRound(mockRoom.id).subscribe((result) => {
                expect(result).toBe(true);
                expect(gameManagerSpy.nextRound).toHaveBeenCalledWith(mockRoom.id);
            });
        });

        it('should return false and handle error on startNextRound failure', () => {
            const errorMessage = 'Failed to start the next round';

            gameManagerSpy.nextRound.and.returnValue(throwError(() => new Error(errorMessage)));

            service.startNextRound(mockRoom.id).subscribe((result) => {
                expect(result).toBe(false);
                expect(gameManagerSpy.nextRound).toHaveBeenCalledWith(mockRoom.id);
                expect(dialog.open).toHaveBeenCalledWith(MessageDialogComponent, {
                    data: { message: GameMessage.CANT_VERIFY_ANSWER },
                });
            });
        });
    });

    describe('deleteRoom', () => {
        it('should return true on successful room deletion', () => {
            gameManagerSpy.deleteRoom.and.returnValue(of(true));

            service.deleteRoom(mockRoom.id).subscribe((result) => {
                expect(result).toBe(true);
                expect(gameManagerSpy.deleteRoom).toHaveBeenCalledWith(mockRoom.id);
            });
        });

        it('should handle error on room deletion failure', () => {
            gameManagerSpy.deleteRoom.and.returnValue(of(false));

            service.deleteRoom(mockRoom.id).subscribe((result) => {
                expect(result).toBe(false);
                expect(gameManagerSpy.deleteRoom).toHaveBeenCalledWith(mockRoom.id);
            });
        });
    });
    it('should return the game info', () => {
        const roomId = '1';

        service.getGameInfo(roomId).subscribe((result) => {
            expect(result).toEqual(mockRoom);
            expect(gameManagerSpy.getGameInfo).toHaveBeenCalledWith(roomId);
        });
    });
    describe('leaveRoom', () => {
        it('should return true on successful leaveRoom', () => {
            gameManagerSpy.leaveRoom.and.returnValue(of(true));

            service.leaveRoom('Alice', '1');
            expect(gameManagerSpy.leaveRoom).toHaveBeenCalledWith('Alice', '1');
        });
    });
    it('should navigate to /create-game when room is null and isTestingQuiz is true', () => {
        spyOn(sessionStorage, 'getItem').and.returnValue(JSON.stringify(true));
        const room = {} as Room;
        service.checkIfGameExist(room);

        expect(routerSpy.navigate).toHaveBeenCalledWith(['/create-game']);
    });
    it('should navigate to /home when room is null and isTestingQuiz is false', () => {
        spyOn(sessionStorage, 'getItem').and.returnValue(JSON.stringify(false));
        const room = {} as Room;
        service.checkIfGameExist(room);

        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });
    it('should not navigate when room is not null', () => {
        spyOn(sessionStorage, 'getItem').and.returnValue(JSON.stringify(true));
        service.checkIfGameExist(mockRoom);

        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
    it('should assign currentPlayer from sessionStorage and call checkIfPlayerExist', () => {
        spyOn(sessionStorage, 'getItem').and.returnValue(JSON.stringify(mockRoom.listPlayers[0]));
        service.assignPlayer(mockRoom, true);
        expect(sessionStorage.getItem).toHaveBeenCalledWith('currentPlayer');
    });
    it('should navigate to /create-game when currentPlayer is not found and isTestingQuiz is true', () => {
        service['currentPlayer'] = mockRoom.listPlayers[0];
        mockRoom.listPlayers = [];

        service['checkIfPlayerExist'](mockRoom, true);

        expect(routerSpy.navigate).toHaveBeenCalledWith(['/create-game']);
    });

    it('should navigate to /home when currentPlayer is not found and isTestingQuiz is false', () => {
        service['currentPlayer'] = mockRoom.listPlayers[0];
        mockRoom.listPlayers = [];
        service['checkIfPlayerExist'](mockRoom, false);
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should not navigate when currentPlayer is found', () => {
        const mockPlayer = mockRoom.listPlayers[0];
        service['currentPlayer'] = mockPlayer;

        service['checkIfPlayerExist'](mockRoom, true);
        expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
    it('should show dialog and navigate to /home', () => {
        spyOn(service as any, 'showDialog');
        service.endRoom();
        expect(service['showDialog']).toHaveBeenCalledWith(GameMessage.ORG_LEFT);
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
    });
    it('should open a dialog with the provided message', () => {
        const message = 'Test Message';
        service['showDialog'](message);
        expect(dialog.open).toHaveBeenCalledWith(MessageDialogComponent, {
            data: { message },
        });
    });
    describe('saveIsTestingWithRoom', () => {
        it('should save isTesting as true if room.isTesting is true', () => {
            const roomWithTestingTrue: Room = { ...mockRoom, isTesting: true };
            spyOn(service, 'saveIsTesting');
            service.saveIsTestingWithRoom(roomWithTestingTrue);

            expect(service.saveIsTesting).toHaveBeenCalledWith(true);
        });

        it('should save isTesting as false if room.isTesting is false', () => {
            const roomWithTestingFalse: Room = { ...mockRoom, isTesting: false };
            spyOn(service, 'saveIsTesting');
            service.saveIsTestingWithRoom(roomWithTestingFalse);

            expect(service.saveIsTesting).toHaveBeenCalledWith(false);
        });
    });
});
