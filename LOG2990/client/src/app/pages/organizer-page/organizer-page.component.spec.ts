/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpClientModule } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Room } from '@app/common-client/interfaces/room';
import { GameManager } from '@app/services/managers/game-manager/game-manager.service';
import { RoomManagerService } from '@app/services/managers/room-manager/room-manager.service';
import { GameConnectionSocketService } from '@app/services/sockets/game-connection-socket/game-connection-socket.service';
import { PlayerConnectionSocketService } from '@app/services/sockets/player-connection-socket/player-connection-socket.service';
import { Player } from '@common/classes/player';
import { GameState } from '@common/enum/socket-messages';
import { Subject, of } from 'rxjs';
import { OrganizerPageComponent } from './organizer-page.component';

describe('OraganisaterPage', () => {
    let component: OrganizerPageComponent;
    let fixture: ComponentFixture<OrganizerPageComponent>;
    let mockRouter: jasmine.SpyObj<Router>;
    let roomManagerSpy: jasmine.SpyObj<RoomManagerService>;
    let gameConnectionSocketSpy: jasmine.SpyObj<GameConnectionSocketService>;
    let playerConnectionSocketSpy: jasmine.SpyObj<PlayerConnectionSocketService>;
    let gameManagerSpy: jasmine.SpyObj<GameManager>;
    let audioPlayer: HTMLAudioElement;
    const playerSubject = new Subject<Player[]>();
    const gameSubject = new Subject<string>();

    beforeEach(() => {
        const spy = jasmine.createSpyObj('MatDialog', ['open']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        gameConnectionSocketSpy = jasmine.createSpyObj(
            'GameConnectionSocketService',
            ['connect', 'connectToGameStage', 'connectPlayersToGame', 'connectToPlayersUpdate', 'disconnect'],
            { playersUpdatedStats$: playerSubject, gameStageSubject$: gameSubject },
        );
        playerConnectionSocketSpy = jasmine.createSpyObj('PlayerConnectionSocketService', [
            'connect',
            'connectPlayerToRoom',
            'removePlayerFromRoom',
            'connectPlayerToGame',
            'banPlayerFromRoom',
            'connectHostToGame',
            'disconnect',
            'setGameStarted',
        ]);
        roomManagerSpy = jasmine.createSpyObj('RoomManagerService', [
            'leaveRoom',
            'changeLockRoom',
            'changeRoomState',
            'startGame',
            'startGameForRoom',
            'startNextRound',
            'advanceToNextRound',
            'sortCurrentPlayerList',
            'playSong',
            'stopSong',
        ]);
        gameManagerSpy = jasmine.createSpyObj('GameManager', ['endGame', 'stopTimer', 'startTimer', 'enablePanicMode']);

        TestBed.configureTestingModule({
            declarations: [OrganizerPageComponent],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: {
                        snapshot: {
                            paramMap: convertToParamMap({ id: 'testRoomId' }),
                            queryParamMap: {
                                get: jasmine.createSpy('get').and.returnValue('true'),
                            },
                        },
                    },
                },
                { provide: MatDialog, useValue: spy },
                { provide: Router, useValue: mockRouter },
                { provide: RoomManagerService, useValue: roomManagerSpy },
                { provide: GameManager, useValue: gameManagerSpy },
                { provide: GameConnectionSocketService, useValue: gameConnectionSocketSpy },
                { provide: PlayerConnectionSocketService, useValue: playerConnectionSocketSpy },
            ],
            schemas: [NO_ERRORS_SCHEMA],
            imports: [HttpClientModule],
        });
        fixture = TestBed.createComponent(OrganizerPageComponent);
        component = fixture.componentInstance;
        audioPlayer = document.createElement('audio') as HTMLAudioElement;
        audioPlayer.id = 'audioPlayer';
        document.body.appendChild(audioPlayer);
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
    describe('ngOnInit', () => {
        it('should return if no roomId in param', () => {
            const mockGameInfo = { id: 'test' } as Room;
            spyOn(component['route'].snapshot.paramMap, 'get').and.returnValue(null);
            const newSpy = spyOn(component as any, 'setCurrentRoom');
            spyOn(component['gameControllerService'], 'getGameInfo').and.returnValue(of(mockGameInfo));
            component.ngOnInit();

            expect(newSpy).not.toHaveBeenCalled();
            expect(mockRouter.navigate).not.toHaveBeenCalledWith(['/home']);
        });
        it('should not navigate to home if roomId is provided', () => {
            const mockGameInfo = { id: 'test' } as Room;
            spyOn(component['route'].snapshot.paramMap, 'get').and.returnValue('test');
            const newSpy = spyOn(component as any, 'setCurrentRoom');
            spyOn(component['gameControllerService'], 'getGameInfo').and.returnValue(of(mockGameInfo));
            component.ngOnInit();

            expect(newSpy).toHaveBeenCalled();
        });
        it('should navigate to home if roomId not is provided', () => {
            const mockGameInfo = {} as Room;
            spyOn(component['route'].snapshot.paramMap, 'get').and.returnValue('test');
            spyOn(component['gameControllerService'], 'getGameInfo').and.returnValue(of(mockGameInfo));
            component.ngOnInit();

            expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
        });
    });
    describe('setCurrentRoom', () => {
        it('should not set currentRoom if room does not exist', () => {
            const room: Room = undefined as unknown as Room;
            component['setCurrentRoom'](room, false);
            expect(component.currentRoom).toBeUndefined();
        });
        it('should call functions and set currentRoom', () => {
            const room: Room = { id: '1234', listPlayers: [new Player('joe'), new Player('alice'), new Player('bob')] } as Room;
            const mockState = GameState.BEFORE_START;
            const mockPlayer = [new Player('joe'), new Player('alice'), new Player('bob')];
            const checkStateSpy = spyOn(component, 'checkState').and.callThrough();
            spyOn(component['timer'], 'handleTime');
            spyOn(component, 'connectionSocketHandler');

            component['setCurrentRoom'](room, false);
            playerSubject.next(mockPlayer);
            gameSubject.next(GameState.BEFORE_START);

            expect(component.currentRoom).toEqual(room);
            expect(component.currentRoom.currentQuestionIndex).toEqual(0);
            expect(component['timer'].handleTime).toHaveBeenCalledWith(room);
            expect(component.connectionSocketHandler).toHaveBeenCalledWith(room);
            expect(checkStateSpy).toHaveBeenCalledWith(mockState, false);
            expect(component.roundStarting).toBeTruthy();
        });
    });
    describe('connectionSocketHandler', () => {
        it('should connect sockets and handle connections properly', () => {
            const room: Room = { id: '1234' } as Room;
            component.gameStarted = false;
            component.connectionSocketHandler(room);
            expect(gameConnectionSocketSpy.connectToGameStage).toHaveBeenCalledWith(room);
            expect(playerConnectionSocketSpy.connectPlayerToRoom).toHaveBeenCalledWith(room);
            expect(playerConnectionSocketSpy.removePlayerFromRoom).toHaveBeenCalledWith(room);
            expect(playerConnectionSocketSpy.setGameStarted).toHaveBeenCalledWith(component.gameStarted);
            expect(playerConnectionSocketSpy.connectHostToGame).toHaveBeenCalledWith(room);
            expect(gameConnectionSocketSpy.connectToPlayersUpdate).toHaveBeenCalledWith(room.id);
        });
    });
    describe('startNextRound', () => {
        it('should set roundFinished to false and increment indexQuestion when starting next round', () => {
            const totalQuestions = 5;
            component.currentRoom = {
                quiz: { questions: new Array(totalQuestions) },
                listPlayers: [new Player('joe'), new Player('alice'), new Player('bob')],
            } as Room;
            component.indexQuestion = 2;
            component.startNextRound();
            expect(component['roundFinished']).toBeFalse();
            expect(component.indexQuestion).toBe(3);
        });
    });
    describe('checkState', () => {
        it('should set roundStarting and gameStarted to true for BEFORE_START state', () => {
            component.checkState(GameState.BEFORE_START, false);
            expect(component.roundStarting).toBeTrue();
            expect(component.gameStarted).toBeTrue();
        });
        it('should set roundFinished to true for END_ROUND state', () => {
            component.checkState(GameState.END_ROUND, false);
            expect(component['roundFinished']).toBeTrue();
        });
        it('should call ngOnDestroy if gameStarted is true for END_ROOM state', () => {
            component.gameStarted = true;
            spyOn(component, 'ngOnDestroy');
            component.checkState(GameState.END_ROOM, false);
            expect(component.ngOnDestroy).toHaveBeenCalled();
        });
        it('should set gameFinished to true for FINAL_END_ROUND state', () => {
            component.checkState(GameState.FINAL_END_ROUND, false);
            expect(component.gameFinished).toBeTrue();
        });
        it('should set roundStarting to false for NEXT_ROUND state', () => {
            component.checkState(GameState.NEXT_ROUND, false);
            expect(component.roundStarting).toBeFalse();
        });
        it('should set roundStarting to false for BETWEEN_ROUNDS state', () => {
            component.checkState(GameState.BETWEEN_ROUNDS, false);
            expect(component.roundStarting).toBeFalse();
        });
        it('should set roundStarting to false and increment currentQuestionIndex if randomMode is true', () => {
            const room: Room = { id: '1234', currentQuestionIndex: 2 } as Room;
            const randomMode = true;

            component.currentRoom = room;
            component.isRandomMode = randomMode;

            component.checkState(GameState.BETWEEN_ROUNDS, randomMode);

            expect(component.roundStarting).toBeFalse();
            if (randomMode) {
                expect(component.currentRoom.currentQuestionIndex).toBe(3);
            }
        });
        it('should set isResultsPage and gameFinished to true', () => {
            component.isResultsPage = false;
            component.gameFinished = false;

            component.checkState(GameState.END_GAME, false);

            expect(component.isResultsPage).toBeTrue();
            expect(component.gameFinished).toBeTrue();
        });
    });
    describe('changeRoomState', () => {
        it('should call changeLockRoom method of RoomManagerService with currentRoom', () => {
            component.changeRoomState();
            expect(roomManagerSpy.changeLockRoom).toHaveBeenCalledWith(component.currentRoom);
        });
    });
    describe('startGame', () => {
        it('should call startGameForRoom method of RoomManagerService with currentRoom', () => {
            component.startGame();
            expect(roomManagerSpy.startGameForRoom).toHaveBeenCalledWith(component.currentRoom, component.isRandomMode);
        });
    });
    describe('isLastQuestion', () => {
        it('should return true if the current question is the last one in the quiz', () => {
            const totalQuestions = 5;
            const currentQuestionIndex = 5;
            component.currentRoom = { quiz: { questions: new Array(totalQuestions) } } as Room;
            component.currentRoom.currentQuestionIndex = currentQuestionIndex;
            const result = component.isLastQuestion();
            expect(result).toBeTrue();
        });
        it('should return false if the current question is not the last one in the quiz', () => {
            const totalQuestions = 5;
            const currentQuestionIndex = 2;
            component.currentRoom = { quiz: { questions: new Array(totalQuestions) } } as Room;
            component.currentRoom.currentQuestionIndex = currentQuestionIndex;
            const result = component.isLastQuestion();
            expect(result).toBeFalse();
        });
    });
    describe('showResults', () => {
        it('should subscribe to endGame method of GameManager and set isResultsPage to true', () => {
            const roomId = '1234';
            const mockObservable = of(true);
            gameManagerSpy.endGame.and.returnValue(mockObservable);
            component.currentRoom = { id: roomId } as Room;
            component.showResults();
            expect(gameManagerSpy.endGame).toHaveBeenCalledWith(roomId);
            expect(component.isResultsPage).toBeTrue();
        });
    });
    describe('stopTimer', () => {
        it('should call stopTimer method of GameManager and subscribe to it', () => {
            const roomId = '1234';
            const mockObservable = of(true);
            gameManagerSpy.stopTimer.and.returnValue(mockObservable);
            component.currentRoom = { id: roomId } as Room;
            component.stopTimer();
            expect(gameManagerSpy.stopTimer).toHaveBeenCalledWith(roomId);
        });
    });
    describe('restartTimer', () => {
        it('should call startTimer method of GameManager and subscribe to it', () => {
            const roomId = '1234';
            const mockObservable = of(true);
            gameManagerSpy.startTimer.and.returnValue(mockObservable);
            component.currentRoom = { id: roomId } as Room;
            component.restartTimer();
            expect(gameManagerSpy.startTimer).toHaveBeenCalledWith(roomId);
        });
    });
    describe('enablePanicMode', () => {
        it('should call enablePanicMode method of GameManager and subscribe to it', () => {
            const roomId = '1234';
            const mockObservable = of(true);
            gameManagerSpy.enablePanicMode.and.returnValue(mockObservable);
            component.currentRoom = { id: roomId } as Room;
            component.enablePanicMode();
            expect(gameManagerSpy.enablePanicMode).toHaveBeenCalledWith(roomId);
        });
    });
    it('should play sound when playSound() is called', () => {
        spyOn(document, 'getElementById').withArgs('audioPlayer').and.returnValue(audioPlayer);
        const playSpy = spyOn(audioPlayer, 'play');

        component['playSound']();

        expect(playSpy).toHaveBeenCalled();
    });
    it('should stop sound and reset currentTime when stopSound() is called', () => {
        spyOn(document, 'getElementById').withArgs('audioPlayer').and.returnValue(audioPlayer);
        const pauseSpy = spyOn(audioPlayer, 'pause');
        audioPlayer.currentTime = 10;

        component['stopSound']();

        expect(pauseSpy).toHaveBeenCalled();
        expect(audioPlayer.currentTime).toBe(0);
    });
    it('should call playSound() when game state is PANIC_MODE', () => {
        const playSoundSpy = spyOn<typeof component, any>(component, 'playSound');

        component.checkState(GameState.PANIC_MODE, false);

        expect(playSoundSpy).toHaveBeenCalled();
    });
    it('should set isEvaluatingQrl to true when game state is QRL_EVALUATION', () => {
        component.checkState(GameState.QRL_EVALUATION, false);
        expect(component.isEvaluatingQrl).toBeTrue();
    });
});
