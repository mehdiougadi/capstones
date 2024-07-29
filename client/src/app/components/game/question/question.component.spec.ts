/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { InputQuestion } from '@app/common-client/interfaces/input-question';
import { Room } from '@app/common-client/interfaces/room';
import { GameControllerService } from '@app/services/controllers/game-controller/game-controller.service';
import { KeyboardService } from '@app/services/controllers/keyboard-controller/keyboard-controller.service';
import { SendAnswersService } from '@app/services/controllers/sendAnswers/send-answers.service';
import { RoomManagerService } from '@app/services/managers/room-manager/room-manager.service';
import { GameConnectionSocketService } from '@app/services/sockets/game-connection-socket/game-connection-socket.service';
import { Player } from '@common/classes/player';
import { FIVE_SECONDS, QRL_ANSWER_LIMIT } from '@common/constant/constants';
import { QuestionType } from '@common/constant/state';
import { GameState } from '@common/enum/socket-messages';
import { Subject } from 'rxjs';
import { QuestionComponent } from './question.component';
describe('QuestionComponent', () => {
    let component: QuestionComponent;
    let fixture: ComponentFixture<QuestionComponent>;
    let gameControllerSpy: jasmine.SpyObj<GameControllerService>;
    let keyboardServiceSpy: jasmine.SpyObj<KeyboardService>;
    let sendAnswersServiceSpy: jasmine.SpyObj<SendAnswersService>;
    let gameConnectionSocketSpy: jasmine.SpyObj<GameConnectionSocketService>;
    let roomManagerServiceSpy: jasmine.SpyObj<RoomManagerService>;
    const gameSubject = new Subject<string>();
    const keyBoardSubject = new Subject<void>();
    const confirmChoiceSubject = new Subject<boolean>();
    let mockRoom: Room;
    beforeEach(async () => {
        gameConnectionSocketSpy = jasmine.createSpyObj(
            'GameConnectionSocketService',
            ['connect', 'disconnect', 'connectToGameStage', 'connectHostToGame', 'connectPlayersToGame', 'sendStatsUpdate', 'sendStatsUpdateQRL'],
            { gameStageSubject$: gameSubject },
        );
        keyboardServiceSpy = jasmine.createSpyObj('KeyboardService', ['handleKeyboardEventGameplay'], { enterPressed$: keyBoardSubject });
        roomManagerServiceSpy = jasmine.createSpyObj('RoomManagerService', ['sendUpdatedInteraction', 'sendQrlInteraction']);
        gameControllerSpy = jasmine.createSpyObj<GameControllerService>('GameControllerService', [
            'isInputFocused',
            'startNextRound',
            'findPlayerByName',
            'deleteRoom',
            'verificationAnswers',
        ]);
        gameControllerSpy.isInputFocused = false;
        sendAnswersServiceSpy = jasmine.createSpyObj(
            'sendAnswersServiceSpy',
            [
                'verificationAnswersSubscriptionMethod',
                'setAttributes',
                'setQrlAnswer',
                'mouseSubscription',
                'unsubscribeKeyboard',
                'unsubscribeMouse',
                'keyboardSubscriptionFunction',
                'unsubscribeVerificationAnswers',
                'setChoices',
                'blockAnswers',
            ],
            { confirmChoice$: confirmChoiceSubject },
        );
        await TestBed.configureTestingModule({
            declarations: [QuestionComponent],
            providers: [
                { provide: GameControllerService, useValue: gameControllerSpy },
                { provide: SendAnswersService, useValue: sendAnswersServiceSpy },
                { provide: KeyboardService, useValue: keyboardServiceSpy },
                { provide: GameConnectionSocketService, useValue: gameConnectionSocketSpy },
                { provide: RoomManagerService, useValue: roomManagerServiceSpy },
            ],
        }).compileComponents();
        gameControllerSpy = jasmine.createSpyObj('GameController', [
            'startNextRound',
            'findPlayerByName',
            'deleteRoom',
            'verificationAnswers',
            'isInputOnFocus',
        ]);
        fixture = TestBed.createComponent(QuestionComponent);
        component = fixture.componentInstance;
        sendAnswersServiceSpy = TestBed.inject(SendAnswersService) as jasmine.SpyObj<SendAnswersService>;
        gameConnectionSocketSpy = TestBed.inject(GameConnectionSocketService) as jasmine.SpyObj<GameConnectionSocketService>;
        gameControllerSpy = TestBed.inject(GameControllerService) as jasmine.SpyObj<GameControllerService>;
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
        component.inputQuestion = {} as unknown as InputQuestion;
        component.inputQuestion.betweenRound = false;
        component.inputQuestion.room = mockRoom;
        component.inputQuestion.room.listPlayers[0].interaction = 'red';
        component.inputQuestion.room.listPlayers[1].interaction = 'red';
        component.inputQuestion.room.listPlayers[2].interaction = 'red';
        component.inputQuestion.question = {
            _id: '1',
            text: 'Test Title',
            type: QuestionType.QCM,
            points: 10,
            choices: [
                { text: 'Option 1', isCorrect: true },
                { text: 'Option 2', isCorrect: false },
            ],
            date: new Date(),
        };
        component.inputQuestion.currentPlayer = new Player('joe');
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should select an option when clicked', () => {
        fixture.detectChanges();
        const buttons = fixture.debugElement.queryAll(By.css('.option button'));
        if (buttons.length > 0) {
            buttons[0].nativeElement.click();
            fixture.detectChanges();
            expect(component['selectedOptions'].length).toBe(1);
            expect(component['selectedOptions'][0]).toEqual(component.inputQuestion.question.choices[0]);
        } else {
            fail("Aucun bouton d'option trouvé dans le template du composant.");
        }
    });
    it('should toggle option selection on click', () => {
        fixture.detectChanges();
        const buttons = fixture.debugElement.queryAll(By.css('.option button'));
        if (buttons.length > 0) {
            const button = buttons[0].nativeElement;
            button.click();
            fixture.detectChanges();
            button.click();
            fixture.detectChanges();
            expect(component['selectedOptions'].length).toBe(0);
        } else {
            fail("Les boutons d'option n'existent pas dans le template du composant.");
        }
    });
    it('should display the correct class for selected option', () => {
        component.selectOption(component.inputQuestion.question.choices[0]);
        fixture.detectChanges();
        const button = fixture.debugElement.query(By.css('.option button')).nativeElement;
        expect(button.classList).toContain('button-selected');
    });
    it('should not select options if round is finished', () => {
        component.inputQuestion.room.roundFinished = true;
        fixture.detectChanges();
        const button = fixture.debugElement.query(By.css('.option button')).nativeElement;
        button.click();
        fixture.detectChanges();
        expect(component['selectedOptions'].length).toBe(0);
    });
    it('should detect key press', () => {
        const event = new KeyboardEvent('keydown', { key: 'A' });
        component.buttonDetect(event);
        expect(component.buttonPressed).toBe('A');
    });
    it('should handle keyboard event for QCM question', () => {
        fixture.detectChanges();
        gameControllerSpy.isInputFocused = false;
        const event = new KeyboardEvent('keydown', { key: '1' });
        window.dispatchEvent(event);
        expect(component['selectedOptions'].length).toBe(1);
        expect(component['selectedOptions'][0].text).toBe('Option 1');
    });
    it('should call checkCharacterLimit if question type is QRL', () => {
        spyOn(component, 'checkCharacterLimit');
        const event = new KeyboardEvent('keydown', { key: 'A' });
        component.inputQuestion.question.type = QuestionType.QRL;
        component.handleKeyboardEvent(event);
        expect(component.checkCharacterLimit).toHaveBeenCalledWith(event);
    });
    it('should return correct class for an option', () => {
        component.selectOption(component.inputQuestion.question.choices[0]);
        fixture.detectChanges();
        expect(component.getClassForOption(component.inputQuestion.question.choices[0])).toBe('button-selected');
        expect(component.getClassForOption(component.inputQuestion.question.choices[1])).toBe('button-unselected');
    });
    it('should reset answers', () => {
        component.selectOption(component.inputQuestion.question.choices[0]);
        component['resetAnswer']();
        expect(component['selectedOptions'].length).toBe(0);
    });
    it('should not handle keyboard event if confirmChoices or roundFinished is true', () => {
        component.confirmChoices = true;
        component.inputQuestion.room.roundFinished = true;
        fixture.detectChanges();
        const event = new KeyboardEvent('keydown', { key: '1' });
        window.dispatchEvent(event);
        expect(component['selectedOptions'].length).toBe(0);
    });
    it('should return incorrect-answer class for incorrectly selected option when round is finished', () => {
        component.inputQuestion.room.roundFinished = true;
        component['selectedOptions'] = [component.inputQuestion.question.choices[1]];
        fixture.detectChanges();
        const className = component.getClassForOption(component.inputQuestion.question.choices[1]);
        expect(className).toBe('incorrect-answer');
    });
    it('should not handle keyboard event if isInputFocused is true', () => {
        gameControllerSpy.isInputFocused = true;
        fixture.detectChanges();
        const event = new KeyboardEvent('keydown', { key: '1' });
        window.dispatchEvent(event);
        expect(component['selectedOptions'].length).toBe(0);
    });
    it('should handle keyboard event for QCM question when isInputFocused is false', () => {
        gameControllerSpy.isInputFocused = false;
        fixture.detectChanges();
        const event = new KeyboardEvent('keydown', { key: '1' });
        window.dispatchEvent(event);
        expect(component['selectedOptions'].length).toBe(1);
        expect(component['selectedOptions'][0].text).toBe('Option 1');
    });
    it('should handle keyboard event', fakeAsync(() => {
        const event = new KeyboardEvent('keydown', { key: '1' });
        component.handleKeyboardEvent(event);
        expect(keyboardServiceSpy.handleKeyboardEventGameplay).toHaveBeenCalledWith(event);
    }));
    it('should unsubscribe keyboard and mouse on end round', () => {
        component['handleEndRound']();
        expect(sendAnswersServiceSpy.blockAnswers).toHaveBeenCalled();
    });
    it('should handle next round', () => {
        component['handleNextRound']();
        expect(sendAnswersServiceSpy.keyboardSubscriptionFunction).toHaveBeenCalled();
        expect(sendAnswersServiceSpy.mouseSubscription).toHaveBeenCalled();
    });
    it('should handle game stage changes with switch statement', () => {
        spyOn<any>(component, 'handleGameStageChanges').and.callThrough();
        component['handleGameStageChanges'](GameState.NEXT_ROUND);
        component['handleGameStageChanges'](GameState.SEND_ANSWERS);
        component['handleGameStageChanges'](GameState.END_ROUND);
        component['handleGameStageChanges'](GameState.FINAL_END_ROUND);
        expect(component['handleGameStageChanges']).toHaveBeenCalledWith(GameState.NEXT_ROUND);
        expect(component['handleGameStageChanges']).toHaveBeenCalledWith(GameState.SEND_ANSWERS);
        expect(component['handleGameStageChanges']).toHaveBeenCalledWith(GameState.END_ROUND);
        expect(component['handleGameStageChanges']).toHaveBeenCalledWith(GameState.FINAL_END_ROUND);
    });
    it('should subscribe to keyboard and mouse if istesting', () => {
        component.inputQuestion.room = mockRoom;
        component.inputQuestion.room.isTesting = true;
        component['subscribeToChoices']();
        expect(sendAnswersServiceSpy.keyboardSubscriptionFunction).toHaveBeenCalled();
        expect(sendAnswersServiceSpy.mouseSubscription).toHaveBeenCalled();
    });
    it('should update confirmChoices when confirmChoice$ emits a value', () => {
        const confirmChoice = true;
        component.choiceSubscriptionFunction();
        (sendAnswersServiceSpy.confirmChoice$ as Subject<boolean>).next(confirmChoice);
        expect(component.confirmChoices).toEqual(confirmChoice);
    });
    it('should reset userResponse and characterCount and call setQrlAnswer when question type is QRL', () => {
        component.inputQuestion.question.type = QuestionType.QRL;
        component.userResponse = 'test';
        component.characterCount = 5;
        component['resetAnswer']();
        expect(component.userResponse).toEqual('');
        expect(component.characterCount).toEqual(QRL_ANSWER_LIMIT);
        expect(sendAnswersServiceSpy.setQrlAnswer).toHaveBeenCalledWith('');
    });
    it('should check character limit and update properties accordingly', () => {
        const eventMock = { target: { value: 'Test response' } as HTMLTextAreaElement } as unknown as Event;
        component.checkCharacterLimit(eventMock);
        expect(component.userResponse).toBe('Test response');
        expect(component.characterCount).toBe(QRL_ANSWER_LIMIT - 'Test response'.length);
        expect(component.inputQuestion.currentPlayer.interaction).toBe('yellow');
        expect(roomManagerServiceSpy.sendUpdatedInteraction).toHaveBeenCalledWith(
            component.inputQuestion.room.id,
            component.inputQuestion.currentPlayer,
        );
        expect(sendAnswersServiceSpy.setQrlAnswer).toHaveBeenCalledWith('Test response');
    });
    it('should set characterCount to 0 and truncate userResponse if characterCount is negative', () => {
        const eventMock = { target: { value: 'A'.repeat(QRL_ANSWER_LIMIT + 1) } as HTMLTextAreaElement } as unknown as Event;
        component.checkCharacterLimit(eventMock);
        expect(component.userResponse.length).toBe(QRL_ANSWER_LIMIT);
        expect(component.characterCount).toBe(0);
    });
    it('should call sendStatsUpdateQRL when currentTime is less than or equal to 1 and onlyOnce is less than 1', () => {
        component['currentTime'] = 1;
        component['onlyOnce'] = 0;
        component.qrlAnswerChange();
        expect(gameConnectionSocketSpy.sendStatsUpdateQRL).toHaveBeenCalledWith(
            component.inputQuestion.room.id,
            component.inputQuestion.room.currentQuestionIndex,
        );
        expect(component['onlyOnce']).toBe(1);
    });
    it('should reset hasInteracted flag after FIVE_SECONDS', fakeAsync(() => {
        component.inputQuestion.currentPlayer.hasInteracted = true;
        component['manageTimer']();
        tick(FIVE_SECONDS);
        expect(component.inputQuestion.currentPlayer.hasInteracted).toBeFalse();
        expect(roomManagerServiceSpy.sendQrlInteraction).toHaveBeenCalledWith(component.inputQuestion.room.id, component.inputQuestion.currentPlayer);
    }));
    it('should reset hasInteracted flag after FIVE_SECONDS', fakeAsync(() => {
        component.inputQuestion.currentPlayer.hasInteracted = false;
        component['manageTimer']();
        tick(FIVE_SECONDS);
        expect(component.inputQuestion.currentPlayer.hasInteracted).toBeFalse();
        expect(roomManagerServiceSpy.sendQrlInteraction).toHaveBeenCalledWith(component.inputQuestion.room.id, component.inputQuestion.currentPlayer);
    }));
    it('should subscribe to gameStageSubject$ and call handleGameStageChanges with correct state', () => {
        spyOn(component as any, 'handleGameStageChanges');
        (component as any).subscribeToGameStageChanges();
        gameSubject.next('NEXT_ROUND');
        expect((component as any)['handleGameStageChanges']).toHaveBeenCalledWith('NEXT_ROUND');
    });
    it('should set isInputFocused to true on input focus', () => {
        component.onInputFocus();
        expect(gameControllerSpy.isInputFocused).toBeTrue();
    });

    it('should set isInputFocused to false on input blur', () => {
        component.onInputBlur();
        expect(gameControllerSpy.isInputFocused).toBeFalse();
    });
});
