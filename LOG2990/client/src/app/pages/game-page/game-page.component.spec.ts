/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Room } from '@app/common-client/interfaces/room';
import { HeaderComponent } from '@app/components/general/header/header.component';
import { CreateGamePageComponent } from '@app/pages/create-game-page/create-game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { GamePageControllerService } from '@app/services/controllers/game-page-controller/game-page-controller.service';
import { MouseControllerService } from '@app/services/controllers/mouse-controller/mouse-controller.service';
import { GameManager } from '@app/services/managers/game-manager/game-manager.service';
import { RoomManagerService } from '@app/services/managers/room-manager/room-manager.service';
import { GameConnectionSocketService } from '@app/services/sockets/game-connection-socket/game-connection-socket.service';
import { PlayerConnectionSocketService } from '@app/services/sockets/player-connection-socket/player-connection-socket.service';
import { Player } from '@common/classes/player';
import { TIME_BETWEEN_ROUND } from '@common/constant/constants';
import { QuestionType } from '@common/constant/state';
import { GameState } from '@common/enum/socket-messages';
import { Question } from '@common/interfaces/question';
import { Observable, Subject, of } from 'rxjs';
import { GamePageComponent } from './game-page.component';

describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let communicationServiceSpy: jasmine.SpyObj<GameManager>;
    let gamePageControllerSpy: jasmine.SpyObj<GamePageControllerService>;
    let mouseControllerServiceSpy: jasmine.SpyObj<MouseControllerService>;
    let mockRoom: Room;
    let gameConnectionSocketSpy: jasmine.SpyObj<GameConnectionSocketService>;
    let roomManagerServiceSpy: jasmine.SpyObj<RoomManagerService>;
    let playerConnectionSocketSpy: jasmine.SpyObj<PlayerConnectionSocketService>;
    let routerSpy: jasmine.SpyObj<Router>;
    const mouseSubject = new Subject<void>();
    const gameSubject = new Subject<string>();
    const routerEventsSubject = new Subject<Event | NavigationEnd>();
    const roomSubject = new Subject<Room>();
    const currentPlayerSubject = new Subject<Player>();
    const currentQuestionSubject = new Subject<Question>();
    let matDialog: MatDialog;
    let audioPlayer: HTMLAudioElement;
    beforeEach(() => {
        communicationServiceSpy = jasmine.createSpyObj('CommunicationService', ['getGameInfo', 'nextRound']);
        gamePageControllerSpy = jasmine.createSpyObj('GamePageControllerService', ['firstSetup', 'ngOnDestroy', 'leavePage'], {
            roomSubject$: roomSubject,
            currentPlayerSubject$: currentPlayerSubject,
            currentQuestionSubject$: currentQuestionSubject,
        });
        mouseControllerServiceSpy = jasmine.createSpyObj('MouseControllerService', ['mouseHitDetect'], {
            leftClick$: mouseSubject,
        });
        gameConnectionSocketSpy = jasmine.createSpyObj(
            'GameConnectionSocketService',
            ['connect', 'disconnect', 'connectToGameStage', 'connectHostToGame', 'connectPlayersToGame'],
            { gameStageSubject$: gameSubject },
        );
        playerConnectionSocketSpy = jasmine.createSpyObj(
            'PlayerConnectionSocketService',
            ['connect', 'disconnect', 'connectPlayerToGame', 'connectHostToGame', 'connectPlayersToGame', 'sendUpdatedInteraction'],
            { gameStageSubject$: gameSubject },
        );
        roomManagerServiceSpy = jasmine.createSpyObj('RoomManagerService', ['sendUpdatedInteraction']);
        gameConnectionSocketSpy.connectToGameStage.and.returnValue();
        routerSpy = jasmine.createSpyObj('Router', ['navigate'], { events: routerEventsSubject.asObservable() as Observable<Event> });
        const mockActivatedRoute = {
            queryParams: {
                subscribe: (callback: (params: unknown) => void) => {
                    callback({
                        roomId: '123',
                    });
                },
            },
        };

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

        communicationServiceSpy.getGameInfo.and.returnValue(of(mockRoom));
        TestBed.configureTestingModule({
            declarations: [HeaderComponent],
            providers: [
                { provide: GameManager, useValue: communicationServiceSpy },
                { provide: GamePageControllerService, useValue: gamePageControllerSpy },
                { provide: MouseControllerService, useValue: mouseControllerServiceSpy },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: Router, useValue: routerSpy },
                { provide: GameConnectionSocketService, useValue: gameConnectionSocketSpy },
                { provide: RoomManagerService, useValue: roomManagerServiceSpy },
                { provide: PlayerConnectionSocketService, useValue: playerConnectionSocketSpy },
                { provide: MatDialog, useValue: matDialog },
            ],
            imports: [
                HttpClientTestingModule,
                RouterTestingModule.withRoutes([{ path: 'home', component: MainPageComponent }]),
                RouterTestingModule.withRoutes([{ path: 'create-game', component: CreateGamePageComponent }]),
            ],
        });

        component = new GamePageComponent(
            TestBed.inject(MouseControllerService),
            routerSpy,
            TestBed.inject(ActivatedRoute),
            gameConnectionSocketSpy,
            gamePageControllerSpy,
            roomManagerServiceSpy,
        );
        component.inputQuestion.currentPlayer = mockRoom.listPlayers[0];
        component.inputQuestion.room = mockRoom;
        audioPlayer = document.createElement('audio') as HTMLAudioElement;
        audioPlayer.id = 'audioPlayer';
        document.body.appendChild(audioPlayer);
        jasmine.clock().install();
    });

    it('should call playSound() when game state is PANIC_MODE', () => {
        const playSoundSpy = spyOn<typeof component, any>(component, 'playSound');

        component['handleGameState'](GameState.PANIC_MODE);

        expect(playSoundSpy).toHaveBeenCalled();
    });
    it('should play sound when playSound() is called', () => {
        spyOn(document, 'getElementById').withArgs('audioPlayer').and.returnValue(audioPlayer);
        const playSpy = spyOn(audioPlayer, 'play');

        component['playSound']();

        expect(playSpy).toHaveBeenCalled();
    });

    it('should call sendCorrectionMessage() when game state is QRL_EVALUATION', () => {
        const sendCorrectionSpy = spyOn<typeof component, any>(component, 'sendCorrectionMessage').and.callThrough();

        component['handleGameState'](GameState.QRL_EVALUATION);

        expect(sendCorrectionSpy).toHaveBeenCalled();
    });

    it('should call sendCorrectionMessage() when game state is FINAL_END_ROUND', () => {
        const sendPointMessageSpy = spyOn<typeof component, any>(component, 'sendPointMessage').and.callThrough();

        component.inputQuestion.question = {} as Question;
        component.inputQuestion.question.type = QuestionType.QRL;
        component.inputQuestion.room.isTesting = false;

        component['handleGameState'](GameState.BETWEEN_ROUNDS);

        expect(sendPointMessageSpy).toHaveBeenCalled();
    });

    it('should call sendCorrectionMessage() when game state is END_ROUND', () => {
        const sendPointMessageSpy = spyOn<typeof component, any>(component, 'sendPointMessage').and.callThrough();

        component.inputQuestion.question = {} as Question;
        component.inputQuestion.question.type = QuestionType.QRL;
        component.inputQuestion.room.isTesting = false;

        component['handleGameState'](GameState.BETWEEN_ROUNDS);

        expect(sendPointMessageSpy).toHaveBeenCalled();
    });

    it('should stop sound and reset currentTime when stopSound() is called', () => {
        spyOn(document, 'getElementById').withArgs('audioPlayer').and.returnValue(audioPlayer);
        const pauseSpy = spyOn(audioPlayer, 'pause');
        audioPlayer.currentTime = 10;

        component['stopSound']();

        expect(pauseSpy).toHaveBeenCalled();
        expect(audioPlayer.currentTime).toBe(0);
    });
    it('should stop sound if end round', () => {
        spyOn(document, 'getElementById').withArgs('audioPlayer').and.returnValue(audioPlayer);
        const pauseSpy = spyOn(audioPlayer, 'pause');
        audioPlayer.currentTime = 10;
        component.inputQuestion.room.isTesting = false;
        component['handleGameState'](GameState.END_ROUND);
        expect(pauseSpy).toHaveBeenCalled();
    });
    it('should call mouseHitDetect on mouse event', fakeAsync(() => {
        const event = new MouseEvent('click');
        component.mouseHitDetect(event);
        expect(mouseControllerServiceSpy.mouseHitDetect).toHaveBeenCalledWith(event);
    }));
    it('should call ngOnInit and initialize subscriptions and start round if not started', fakeAsync(() => {
        spyOn<any>(component, 'getParamsInit');
        component.ngOnInit();
        tick();
        flush();

        expect(component['getParamsInit']).toHaveBeenCalled();
    }));
    it('should show and hide popup', fakeAsync(() => {
        const message = 'Test message';

        component['showPopupMessage'](message);

        expect(component.showPopup).toBeTrue();
        expect(component.popupMessage).toBe(message);

        tick(TIME_BETWEEN_ROUND);
        flush();

        expect(component.showPopup).toBeFalse();
        expect(component.popupMessage).toBe('');
    }));

    it('should hide popup after timeout', fakeAsync(() => {
        component.showPopup = true;
        component.popupMessage = 'Initial message';

        component['hidePopup']();

        expect(component.showPopup).toBeFalse();
        expect(component.popupMessage).toBe('');

        tick(TIME_BETWEEN_ROUND);

        expect(component.showPopup).toBeFalse();
        expect(component.popupMessage).toBe('');
    }));

    it('should show bonus message if current player is first to answer', () => {
        spyOn<any>(component, 'showPopupMessage').and.callThrough();

        component.inputQuestion.currentPlayer = mockRoom.listPlayers[0];
        component.inputQuestion.currentPlayer.firstToAnswer = true;
        component['handleFirstToAnswerBonus']();

        expect(component['showPopupMessage']).toHaveBeenCalledWith('Bonus de 20%, premier à répondre');
    });
    it('should put betweenRound at false ', () => {
        component.ngOnInit();
        gameSubject.next(GameState.NEXT_ROUND);
        expect(component.inputQuestion.betweenRound).toEqual(false);
    });
    it('should put betweenRound at false  ', () => {
        component.ngOnInit();
        gameSubject.next(GameState.BETWEEN_ROUNDS);
        expect(component.inputQuestion.betweenRound).toEqual(true);
    });
    it('should call finishGame ', () => {
        component.ngOnInit();
        spyOn<any>(component, 'finishGame');
        gameSubject.next(GameState.END_GAME);
        expect(component['finishGame']).toHaveBeenCalled();
    });
    it('should call navigate create-game', () => {
        component.inputQuestion.room.isTesting = true;
        component['finishGame']();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/create-game']);
    });
    it('should unsubscribe and disconnect on ngOnDestroy', () => {
        component.ngOnInit();
        component.ngOnDestroy();
        expect(component['subscriptions'].roomSubscription?.closed).toBeTrue();
        expect(gameConnectionSocketSpy.disconnect).toHaveBeenCalled();
        expect(component['subscriptions'].gameStageSubscription?.closed).toBeTrue();
        expect(gamePageControllerSpy.ngOnDestroy).toHaveBeenCalled();
        expect(gamePageControllerSpy.leavePage).toHaveBeenCalled();
    });
    it('should subscribe to current player subject and handle bonus on change', () => {
        const currentPlayer = new Player('Test Player');
        spyOn<any>(component, 'handleFirstToAnswerBonus');
        component['subscribeCurrentPlayer']();
        currentPlayerSubject.next(currentPlayer);
        expect(component.inputQuestion.currentPlayer).toBe(currentPlayer);
        expect(component['handleFirstToAnswerBonus']).toHaveBeenCalled();
    });

    it('should subscribe to room subject and set finished loading to true on change', () => {
        component['subscribeRoom']();
        roomSubject.next(mockRoom);
        expect(component.inputQuestion.room).toBe(mockRoom);
        expect(component.finishedLoading).toBeTrue();
    });

    it('should subscribe to current question subject and set current question on change', () => {
        component['subscribeCurrentQuestion']();
        currentQuestionSubject.next(mockRoom.quiz.questions[0]);
        expect(component.inputQuestion.question).toBe(mockRoom.quiz.questions[0]);
    });
    it('should navigate to create-game if room is in testing mode', () => {
        component.inputQuestion.room.isTesting = true;
        component['finishGame']();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/create-game']);
        expect(component.gameFinished).toBeFalse();
    });

    it('should set gameFinished to true if room is not in testing mode', () => {
        component.inputQuestion.room.isTesting = false;
        component['finishGame']();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
        expect(component.gameFinished).toBeTrue();
    });
    it('should set current player from sessionStorage', () => {
        const storedPlayerData = mockRoom.listPlayers[0];
        spyOn(sessionStorage, 'getItem').and.returnValue(JSON.stringify(storedPlayerData));
        component['setCurrentPlayer']();
        const expectedPlayer = new Player(storedPlayerData.name);
        expect(component.inputQuestion.currentPlayer).toEqual(JSON.parse(JSON.stringify(expectedPlayer)));
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });
});
