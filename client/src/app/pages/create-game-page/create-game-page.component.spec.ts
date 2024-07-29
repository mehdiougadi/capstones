/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpErrorResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { GameControllerService } from '@app/services/controllers/game-controller/game-controller.service';
import { GameManager } from '@app/services/managers/game-manager/game-manager.service';
import { GameMessage } from '@common/client-message/game-pop-up';
import { FIVE_SECONDS } from '@common/constant/constants';
import { QuestionType } from '@common/constant/state';
import { Quiz } from '@common/interfaces/quiz';
import { of, throwError } from 'rxjs';
import { CreateGamePageComponent } from './create-game-page.component';

describe('CreateGamePageComponent', () => {
    let component: CreateGamePageComponent;
    let fixture: ComponentFixture<CreateGamePageComponent>;
    let mockCommunicationService: jasmine.SpyObj<GameManager>;
    let mockGameControllerService: jasmine.SpyObj<GameControllerService>;
    let mockMatDialog: jasmine.SpyObj<MatDialog>;

    beforeEach(async () => {
        mockCommunicationService = jasmine.createSpyObj('CommunicationService', ['getQuizById']);
        mockGameControllerService = jasmine.createSpyObj('GameControllerService', ['createSession', 'saveIsTesting']);
        mockMatDialog = jasmine.createSpyObj('MatDialog', ['open']);

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, MatDialogModule, BrowserAnimationsModule],
            declarations: [CreateGamePageComponent],
            providers: [
                { provide: GameManager, useValue: mockCommunicationService },
                { provide: GameControllerService, useValue: mockGameControllerService },
                { provide: MatDialog, useValue: mockMatDialog },
            ],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();

        fixture = TestBed.createComponent(CreateGamePageComponent);
        component = fixture.componentInstance;

        mockCommunicationService.getQuizById.and.returnValue(
            of({
                _id: '1',
                title: 'Quiz Visible',
                visible: true,
                questions: [],
                duration: 30,
                description: 'Description of a visible quiz',
                lastModification: new Date(),
            }),
        );
        fixture.detectChanges();
    });

    it('should call updateQuizList', fakeAsync(() => {
        const newSpy = spyOn(component['quizManagerService'], 'updateQuizList');
        component['updateQuizList']();
        spyOn(component as any, 'updateQuizList');
        tick(FIVE_SECONDS);
        expect(newSpy).toHaveBeenCalled();
    }));

    it('should call verifCreateGame with true when startGame is called', () => {
        component.startGame();
        expect(component['gameControllerService'].saveIsTesting).toHaveBeenCalled();
    });
    it('should call verifCreateGame with false when masterWaitingRoom is called', () => {
        component.masterWaitingRoom();
        expect(component['gameControllerService'].saveIsTesting).toHaveBeenCalled();
    });
    it('should unsubscribe from quizSubscription if it exists', () => {
        const mockSubscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);
        component['quizSubscription'] = mockSubscription;

        component.ngOnDestroy();
        expect(mockSubscription.unsubscribe).toHaveBeenCalled();
    });
    it('should not throw error during ngOnDestroy', () => {
        expect(() => component.ngOnDestroy()).not.toThrow();
    });
    it('should set selectedQuiz to the passed quiz object', () => {
        const mockQuiz: Quiz = {
            _id: '1',
            title: 'Test Quiz',
            description: 'A description',
            questions: [],
            duration: 30,
            visible: true,
            lastModification: new Date(),
        };

        component.selectQuiz(mockQuiz);

        expect(component.selectedQuiz).toBe(mockQuiz);
    });
    it('should start game session if selected quiz is visible and isTesting is true', () => {
        const mockQuiz: Quiz = {
            _id: '1',
            title: 'Quiz 1',
            visible: true,
            questions: [],
            duration: 30,
            description: '',
            lastModification: new Date(),
        };
        component.selectedQuiz = mockQuiz;
        mockCommunicationService.getQuizById.and.returnValue(of(mockQuiz));

        component['verifCreateGame'](true);

        expect(mockGameControllerService.createSession).toHaveBeenCalledWith(mockQuiz._id, true, false);
    });
    it('should open dialog and reset selected quiz if it is not visible', () => {
        const mockQuiz: Quiz = {
            _id: '2',
            title: 'Quiz 2',
            visible: false,
            questions: [],
            duration: 30,
            description: '',
            lastModification: new Date(),
        };
        component.selectedQuiz = mockQuiz;
        mockCommunicationService.getQuizById.and.returnValue(of(mockQuiz));

        component['verifCreateGame'](false);

        expect(mockMatDialog.open).toHaveBeenCalled();
        expect(component.selectedQuiz).toBeNull();
    });
    it('should open dialog on error when fetching quiz details', () => {
        const errorResponse = new HttpErrorResponse({ error: 'test error', status: 404 });
        component.selectedQuiz = {
            _id: '3',
            title: 'Quiz 3',
            visible: true,
            questions: [],
            duration: 30,
            description: '',
            lastModification: new Date(),
        };
        mockCommunicationService.getQuizById.and.returnValue(throwError(() => errorResponse));

        component['verifCreateGame'](true);

        expect(mockMatDialog.open).toHaveBeenCalled();
    });

    it('should start game session if selected quiz is visible', () => {
        const mockQuiz: Quiz = {
            _id: '1',
            title: 'Quiz 1',
            visible: true,
            questions: [],
            duration: 30,
            description: 'A visible quiz',
            lastModification: new Date(),
        };

        component.selectedQuiz = mockQuiz;

        if (component.selectedQuiz) {
            mockCommunicationService.getQuizById.and.returnValue(of(component.selectedQuiz));
            component['verifCreateGame'](false);

            expect(mockGameControllerService.createSession).toHaveBeenCalledWith(component.selectedQuiz._id, false, false);
        } else {
            fail('selectedQuiz is null');
        }
    });

    it('should start random mode if there are enough QCM questions', () => {
        const qcmQuestions = [
            { _id: 'testID', text: 'Test Quiz', choices: [], type: QuestionType.QCM, points: 10, date: new Date() },
            { _id: 'secondTestID', text: 'Test Quiz number 2', choices: [], type: QuestionType.QCM, points: 50, date: new Date() },
            { _id: 'thirdTestID', text: 'Test Quiz number 3', choices: [], type: QuestionType.QCM, points: 100, date: new Date() },
            { _id: 'fourthTestID', text: 'Test Quiz number 4', choices: [], type: QuestionType.QCM, points: 150, date: new Date() },
            { _id: 'fifthTestID', text: 'Test Quiz number 5', choices: [], type: QuestionType.QCM, points: 200, date: new Date() },
        ];
        component['questionManagerService'].bankQuestionList = qcmQuestions;

        component.startRandomMode();

        expect(component['gameControllerService'].createSession).toHaveBeenCalledOnceWith(jasmine.any(String), false, true);
    });

    it('should start random mode if there are enough QCM questions', () => {
        const qcmQuestions = [
            { _id: 'testID', text: 'Test Quiz', choices: [], type: QuestionType.QCM, points: 10, date: new Date() },
            { _id: 'secondTestID', text: 'Test Quiz number 2', choices: [], type: QuestionType.QCM, points: 50, date: new Date() },
            { _id: 'thirdTestID', text: 'Test Quiz number 3', choices: [], type: QuestionType.QCM, points: 100, date: new Date() },
            { _id: 'fourthTestID', text: 'Test Quiz number 4', choices: [], type: QuestionType.QCM, points: 150, date: new Date() },
            { _id: 'fifthTestID', text: 'Test Quiz number 5', choices: [], type: QuestionType.QCM, points: 200, date: new Date() },
        ];
        component['questionManagerService'].bankQuestionList = qcmQuestions;
        component.startRandomMode();

        expect(component['gameControllerService'].createSession).toHaveBeenCalledOnceWith(jasmine.any(String), false, true);
    });

    it('should show error dialog if there are not enough QCM questions', () => {
        const nonQcmQuestions = [
            { _id: 'testID', text: 'Test Quiz', choices: [], type: QuestionType.QCM, points: 10, date: new Date() },
            { _id: 'secondTestID', text: 'Test Quiz number 2', choices: [], type: QuestionType.QCM, points: 50, date: new Date() },
            { _id: 'thirdTestID', text: 'Test Quiz number 3', choices: [], type: QuestionType.QCM, points: 100, date: new Date() },
            { _id: 'fourthTestID', text: 'Test Quiz number 4', choices: [], type: QuestionType.QCM, points: 150, date: new Date() },
            { _id: 'fifthTestID', text: 'Test Quiz number 5', choices: [], type: QuestionType.QRL, points: 200, date: new Date() },
        ];
        component['questionManagerService'].bankQuestionList = nonQcmQuestions;

        spyOn(component, 'showDialog');

        component.startRandomMode();

        expect(component.showDialog).toHaveBeenCalledOnceWith(GameMessage.INSUFFICIENT_QUESTIONS);
    });

    it('should show error dialog if no quiz is selected', () => {
        component.selectedQuiz = null;
        component['verifCreateGame'](true);
        expect(mockMatDialog.open).toHaveBeenCalledWith(MessageDialogComponent, {
            data: { message: GameMessage.CANT_GET_QUIZZES },
        });
    });

    afterEach(() => {
        fixture.destroy();
    });
});
