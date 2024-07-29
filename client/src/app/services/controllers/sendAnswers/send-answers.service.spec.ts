import { TestBed, fakeAsync, tick } from '@angular/core/testing';

import { Room } from '@app/common-client/interfaces/room';
import { GameControllerService } from '@app/services/controllers/game-controller/game-controller.service';
import { KeyboardService } from '@app/services/controllers/keyboard-controller/keyboard-controller.service';
import { MouseControllerService } from '@app/services/controllers/mouse-controller/mouse-controller.service';
import { Player } from '@common/classes/player';
import { QuestionType } from '@common/constant/state';
import { GameState } from '@common/enum/socket-messages';
import { Subject, of } from 'rxjs';
import { SendAnswersService } from './send-answers.service';

describe('SendAnswersService', () => {
    let service: SendAnswersService;
    let keyboardServiceSpy: jasmine.SpyObj<KeyboardService>;
    const keyBoardSubject = new Subject<void>();
    let mouseControllerServiceSpy: jasmine.SpyObj<MouseControllerService>;
    let gameControllerSpy: jasmine.SpyObj<GameControllerService>;
    const mouseSubject = new Subject<void>();
    let mockRoom: Room;
    beforeEach(() => {
        gameControllerSpy = jasmine.createSpyObj('GameController', ['verificationAnswers', 'setQrlAnswer']);
        keyboardServiceSpy = jasmine.createSpyObj('KeyboardService', ['handleKeyboardEventGameplay'], {
            enterPressed$: keyBoardSubject,
        });
        mouseControllerServiceSpy = jasmine.createSpyObj('MouseControllerService', ['mouseHitDetect'], {
            leftClick$: mouseSubject,
        });
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
        TestBed.configureTestingModule({
            providers: [
                { provide: KeyboardService, useValue: keyboardServiceSpy },
                { provide: MouseControllerService, useValue: mouseControllerServiceSpy },
                { provide: GameControllerService, useValue: gameControllerSpy },
            ],
        });
        service = TestBed.inject(SendAnswersService);
        service['room'] = mockRoom;
        service['currentPlayer'] = mockRoom.listPlayers[0];
        keyboardServiceSpy = TestBed.inject(KeyboardService) as jasmine.SpyObj<KeyboardService>;
        mouseControllerServiceSpy = TestBed.inject(MouseControllerService) as jasmine.SpyObj<MouseControllerService>;
        gameControllerSpy = TestBed.inject(GameControllerService) as jasmine.SpyObj<GameControllerService>;
        gameControllerSpy.verificationAnswers.and.returnValue(of(true));
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set room and currentPlayer attributes', () => {
        service.setAttributes(mockRoom, mockRoom.listPlayers[0]);

        expect(service['room']).toEqual(mockRoom);
        expect(service['currentPlayer']).toEqual(mockRoom.listPlayers[0]);
    });

    it('should set choiceArray attribute', () => {
        service.setChoices([mockRoom.quiz.questions[0].choices[1]]);
        expect(service['choiceArray']).toEqual([mockRoom.quiz.questions[0].choices[1]]);
    });

    it('should set qrlAnswer correctly', () => {
        const answer = 'Sample QRL answer';
        service.setQrlAnswer(answer);
        expect(service['qrlAnswer']).toEqual(answer);
    });

    it('should call verification with keyboard', fakeAsync(() => {
        spyOn(service, 'verificationAnswersSubscriptionMethod');
        service.keyboardSubscriptionFunction();
        keyBoardSubject.next();
        tick();
        expect(service.verificationAnswersSubscriptionMethod).toHaveBeenCalled();
    }));

    it('should call verification with mouse', fakeAsync(() => {
        spyOn(service, 'verificationAnswersSubscriptionMethod');
        service.mouseSubscription();
        mouseSubject.next();
        tick();
        expect(service.verificationAnswersSubscriptionMethod).toHaveBeenCalled();
    }));

    it('should unsubscribe keyboard and mouse, subscribe to question type, and emit true to confirmChoiceSubject', () => {
        spyOn(service, 'unsubscribeKeyboard');
        spyOn(service, 'unsubscribeMouse');
        spyOn(service, 'subscribeToQuestionType');
        const confirmChoiceSubjectSpy = spyOn(service['confirmChoiceSubject'], 'next');

        service.verificationAnswersSubscriptionMethod();

        expect(service.unsubscribeKeyboard).toHaveBeenCalled();
        expect(service.unsubscribeMouse).toHaveBeenCalled();
        expect(service.subscribeToQuestionType).toHaveBeenCalled();
        expect(confirmChoiceSubjectSpy).toHaveBeenCalledWith(true);
    });

    it('should subscribe to verification answers if isQcm is true', () => {
        service['isQcm'] = true;
        spyOn(service, 'subscribeToVerificationAnswers');
        spyOn(service, 'subscribeToSetQrlAnswer');

        service.subscribeToQuestionType();

        expect(service.subscribeToVerificationAnswers).toHaveBeenCalled();
        expect(service.subscribeToSetQrlAnswer).not.toHaveBeenCalled();
    });

    it('should subscribe to set QRL answer if isQcm is false', () => {
        service['isQcm'] = false;
        spyOn(service, 'subscribeToVerificationAnswers');
        spyOn(service, 'subscribeToSetQrlAnswer');

        service.subscribeToQuestionType();

        expect(service.subscribeToVerificationAnswers).not.toHaveBeenCalled();
        expect(service.subscribeToSetQrlAnswer).toHaveBeenCalled();
    });

    it('should call unsubscribeKeyboard and unsubscribeMouse', () => {
        spyOn(service, 'unsubscribeKeyboard').and.callThrough();
        spyOn(service, 'unsubscribeMouse').and.callThrough();

        service.blockAnswers();

        expect(service.unsubscribeKeyboard).toHaveBeenCalled();
        expect(service.unsubscribeMouse).toHaveBeenCalled();
    });

    it('should unsubscribe from verification answers subscription', () => {
        const subscriptionSpy = jasmine.createSpyObj('Subscription', ['unsubscribe']);
        service['subscriptions'].verificationAnswersSubscription = subscriptionSpy;

        service.unsubscribeVerificationAnswers();

        expect(subscriptionSpy.unsubscribe).toHaveBeenCalled();
    });

    it('should unsubscribe from set QRL answer subscription', () => {
        const subscriptionSpy = jasmine.createSpyObj('Subscription', ['unsubscribe']);
        service['subscriptions'].setQrlAnswerSubscription = subscriptionSpy;

        service.unsubscribeSetQrlAnswer();

        expect(subscriptionSpy.unsubscribe).toHaveBeenCalled();
    });

    it('should subscribe to verification answers', () => {
        service['choiceArray'] = [mockRoom.quiz.questions[0].choices[1]];

        const subscriptionSpy = jasmine.createSpyObj('Subscription', ['unsubscribe']);
        service['subscriptions'].verificationAnswersSubscription = subscriptionSpy;

        const expectedResult = true;
        gameControllerSpy.verificationAnswers.and.returnValue(of(expectedResult));

        service.subscribeToVerificationAnswers();

        expect(subscriptionSpy.unsubscribe).toHaveBeenCalled();

        expect(gameControllerSpy.verificationAnswers).toHaveBeenCalledWith(mockRoom.id, mockRoom.listPlayers[0].name, [
            mockRoom.quiz.questions[0].choices[1],
        ]);

        expect(service['subscriptions'].verificationAnswersSubscription).toBeDefined();
    });

    it('should subscribe to set QRL answer', () => {
        service['qrlAnswer'] = 'Sample QRL answer';

        const subscriptionSpy = jasmine.createSpyObj('Subscription', ['unsubscribe']);
        service['subscriptions'].setQrlAnswerSubscription = subscriptionSpy;

        const expectedResult = true;
        gameControllerSpy.setQrlAnswer.and.returnValue(of(expectedResult));

        service.subscribeToSetQrlAnswer();

        expect(subscriptionSpy.unsubscribe).toHaveBeenCalled();

        expect(gameControllerSpy.setQrlAnswer).toHaveBeenCalledWith(mockRoom.id, mockRoom.listPlayers[0].name, 'Sample QRL answer');

        expect(service['subscriptions'].setQrlAnswerSubscription).toBeDefined();
    });
});
