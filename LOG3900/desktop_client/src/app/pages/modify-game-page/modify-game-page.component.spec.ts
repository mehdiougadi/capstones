// retrait du lint pour any pour accéder aux attributs privés et retrait du maximum de lignes pour fichier de test
/* eslint-disable @typescript-eslint/no-explicit-any, max-lines */
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { CONGRATULATION, ErrorType, MIN_POINTS, QuestionType, Routes, SUCCESS_QUIZ_CREATION, SUCCESS_QUIZ_MODIFICATION } from '@app/app.constants';
import { ErrorPopupComponent } from '@app/components/error-popup/error-popup.component';
import { Choice } from '@app/interfaces/choice';
import { QuestionForm } from '@app/interfaces/question';
import { GameService } from '@app/services/game/game.service';
import { of, throwError } from 'rxjs';
import { ModifyGamePageComponent } from './modify-game-page.component';
@Component({
    selector: 'app-logo',
})
class LogoStubComponent {}

describe('ModifyGamePageComponent', () => {
    let component: ModifyGamePageComponent;
    let fixture: ComponentFixture<ModifyGamePageComponent>;
    let mockGameService: jasmine.SpyObj<GameService>;
    let mockActivatedRoute: { snapshot: { paramMap: { get: jasmine.Spy } } };
    let mockRouter: jasmine.SpyObj<Router>;
    let fb: FormBuilder;
    const dialogMock = {
        open: jasmine.createSpy('open'),
    };

    beforeEach(() => {
        mockGameService = jasmine.createSpyObj('GameService', ['getGameAdmin', 'createGame', 'updateGame']);
        (mockGameService.createGame as jasmine.Spy).and.returnValue(of({}));
        (mockGameService.updateGame as jasmine.Spy).and.returnValue(of({}));
        mockActivatedRoute = {
            snapshot: { paramMap: { get: jasmine.createSpy('get') } },
        };
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        TestBed.configureTestingModule({
            declarations: [ModifyGamePageComponent, LogoStubComponent],
            providers: [
                { provide: GameService, useValue: mockGameService },
                { provide: ActivatedRoute, useValue: mockActivatedRoute },
                { provide: Router, useValue: mockRouter },
                { provide: MatDialog, useValue: dialogMock },
            ],
            imports: [ReactiveFormsModule],
        }).compileComponents();
        fb = TestBed.inject(FormBuilder);
        fixture = TestBed.createComponent(ModifyGamePageComponent);
        component = fixture.componentInstance;
        mockGameService.getGameAdmin.and.returnValue(of(fakeGame));
        component.ngOnInit();
    });

    afterEach(() => {
        mockGameService.createGame.calls.reset();
        dialogMock.open.calls.reset();
    });

    it('should create the component', () => {
        expect(component).toBeTruthy();
    });

    it('should call getForm on init', () => {
        spyOn(component as any, 'getForm');
        component.ngOnInit();
        expect((component as any).getForm).toHaveBeenCalled();
    });

    it('should validate at least one true or one false', () => {
        const control = new FormControl([] as Choice[], (component as any).atLeastOneTrueOrOneFalseValidator);
        const form = new FormGroup({ choices: control });
        control.setValue([
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
        ]);
        let errors: ValidationErrors | null | undefined = form.get('choices')?.errors;
        expect(errors).toEqual({ atLeastOneTrueOrOneFalse: true });
        control.setValue([
            { text: '', isCorrect: true },
            { text: '', isCorrect: true },
        ]);
        errors = form.get('choices')?.errors;
        expect(errors).toEqual({ atLeastOneTrueOrOneFalse: true });
        control.setValue([
            { text: '', isCorrect: true },
            { text: '', isCorrect: false },
        ]);
        errors = form.get('choices')?.errors;
        expect(errors).toBeNull();
    });

    it('should get showDetails value', () => {
        const control = new FormControl(true);
        const form = new FormGroup({ showDetails: control });
        spyOn(component, 'getQuestionFormGroup').and.returnValue(form);
        const showDetails = component.getShowDetails(0);
        expect(showDetails).toBe(true);
    });

    it('should initialize a question', () => {
        const questionInit = (component as any).initQuestion();
        expect(questionInit instanceof FormGroup).toBe(true);
        expect(questionInit.get('text')?.value).toBe('');
        expect(questionInit.get('points')?.value).toBe(MIN_POINTS);
        expect(questionInit.get('showDetails')?.value).toBe(true);
        expect(questionInit.get('choices') instanceof FormArray).toBe(true);
    });

    it('should update question index', () => {
        const indexToChange = 0;

        const spy = spyOn(component.questions.at(indexToChange), 'patchValue');
        component.onQuestionIndexChange(indexToChange);

        expect(spy).toHaveBeenCalledWith({ index: indexToChange });
    });

    it('should update question type and manipulate controls accordingly', () => {
        const index = 0;

        const formGroup = component.questions.at(index) as FormGroup;
        spyOn(formGroup, 'patchValue').and.callThrough();
        spyOn(formGroup, 'removeControl').and.callThrough();
        spyOn(formGroup, 'setControl').and.callThrough();

        const newTypeQRL = QuestionType.QRL;
        component.onQuestionTypeChange(newTypeQRL, index);

        expect(formGroup.patchValue).toHaveBeenCalledWith({ type: newTypeQRL });
        expect(formGroup.removeControl).toHaveBeenCalledWith('choices');
        expect(formGroup.setControl).not.toHaveBeenCalled();

        const newTypeQCM = QuestionType.QCM;
        component.onQuestionTypeChange(newTypeQCM, index);

        expect(formGroup.patchValue).toHaveBeenCalledWith({ type: newTypeQCM });
        expect(formGroup.setControl).toHaveBeenCalledWith('choices', jasmine.any(Object));
    });

    it('should add a question', () => {
        const questionsBeforeAdd = component.questions.length;
        component.addQuestion();
        expect(component.questions.length).toBe(questionsBeforeAdd + 1);
    });

    it('should delete a question', () => {
        component.addQuestion();
        const questionsBeforeDelete = component.questions.length;
        component.deleteQuestion(0);
        expect(component.questions.length).toBe(questionsBeforeDelete - 1);
    });

    it('should get a question form group', () => {
        component.addQuestion();
        const questionInit = component.getQuestionFormGroup(0);
        expect(questionInit instanceof FormGroup).toBe(true);
    });

    it('should drag a question', () => {
        component.addQuestion();
        component.addQuestion();
        const event = { previousIndex: 0, currentIndex: 1 } as CdkDragDrop<any[]>;
        const question1 = component.questions.at(0);
        const question2 = component.questions.at(1);
        component.dragQuestion(event);
        expect(component.questions.at(0)).toBe(question2);
        expect(component.questions.at(1)).toBe(question1);
    });

    it('should submit the form', () => {
        spyOn(component as any, 'createGame');
        spyOn(component as any, 'modifyGame');
        component.gameForm.setValue(fakeForm);
        component.gameForm.markAllAsTouched();
        component.isNewGame = true;
        component.onSubmit();
        expect(component['createGame']).toHaveBeenCalled();
        component.isNewGame = false;
        component.onSubmit();
        expect(component['createGame']).toHaveBeenCalled();
    });

    it('should get form', () => {
        spyOn(component as any, 'modifyGameForm');
        spyOn(component as any, 'createNewGameForm');
        mockActivatedRoute.snapshot.paramMap.get.and.returnValue('123');
        (component as any).getForm();
        expect((component as any).modifyGameForm).toHaveBeenCalledWith('123');
        expect((component as any).createNewGameForm).not.toHaveBeenCalled();
        mockActivatedRoute.snapshot.paramMap.get.and.returnValue(null);
        (component as any).getForm();
        expect((component as any).createNewGameForm).toHaveBeenCalled();
    });

    it('should create a new game form', () => {
        (component as any).createNewGameForm();
        expect(component.isNewGame).toBe(true);
        expect(component.gameForm instanceof FormGroup).toBe(true);
        expect(component.gameForm.get('title')?.value).toBe('');
        expect(component.gameForm.get('duration')?.value).toBe(0);
        expect(component.gameForm.get('description')?.value).toBe('');
        expect(component.gameForm.get('questions') instanceof FormArray).toBe(true);
    });

    it('should modify a game form', () => {
        const gameId = '123';
        const game = fakeGame;
        mockGameService.getGameAdmin.and.returnValue(of(game));
        spyOn(component as any, 'createQuestions').and.returnValue([]);
        (component as any).modifyGameForm(gameId);
        expect(component.isNewGame).toBe(false);
        expect(component.gameForm instanceof FormGroup).toBe(true);
        expect(component.gameForm.get('title')?.value).toBe(game.title);
        expect(component.gameForm.get('description')?.value).toBe(game.description);
        expect(component.gameForm.get('duration')?.value).toBe(game.duration);
        expect(component.gameForm.get('questions') instanceof FormArray).toBe(true);
    });

    it('should navigate to home when there is an error when getting the game on page loading', () => {
        const mockError = { message: ErrorType.InternalServerError };
        const gameId = 'some-id';
        mockGameService.getGameAdmin.and.returnValue(throwError(() => mockError));
        (component as any).modifyGameForm(gameId);
        expect(mockRouter.navigate).toHaveBeenCalledOnceWith([Routes.Home]);
    });

    it('should create questions for non-QCM types', () => {
        const nonQCMQuestion: QuestionForm = {
            text: 'Non-QCM Question',
            points: 5,
            showDetails: false,
            index: 0,
            type: QuestionType.QRL,
            choices: [],
        };
        const formGroup = (component as any).createQuestions([nonQCMQuestion])[0];
        expect(formGroup.get('text')?.value).toBe(nonQCMQuestion.text);
        expect(formGroup.get('points')?.value).toBe(nonQCMQuestion.points);
        expect(formGroup.get('showDetails')?.value).toBe(false);
        expect(formGroup.get('index')?.value).toBe(nonQCMQuestion.index);
        expect(formGroup.get('type')?.value).toBe(nonQCMQuestion.type);
        expect(formGroup.get('choices')?.value).toBe(undefined);
    });

    it('should create questions', () => {
        spyOn(component as any, 'createChoice').and.callFake((questionInit: QuestionForm) => questionInit.choices);
        const formGroups = (component as any).createQuestions(questions);
        expect(formGroups.length).toBe(questions.length);
        formGroups.forEach((formGroup: FormGroup, index: number) => {
            expect(formGroup.get('text')?.value).toBe(questions[index].text);
            expect(formGroup.get('points')?.value).toBe(questions[index].points);
            expect(formGroup.get('choices')?.value).toEqual(questions[index].choices);
        });
    });

    it('should create choices', () => {
        const formGroups = (component as any).createChoice(question);

        expect(formGroups.length).toBe(question.choices.length);
        formGroups.forEach((formGroup: FormGroup, index: number) => {
            expect(formGroup.get('text')?.value).toBe(question.choices[index].text);
            expect(formGroup.get('isCorrect')?.value).toBe(question.choices[index].isCorrect);
        });
    });

    it('should check form changes', () => {
        const fakeForm2 = {
            title: 'valid value',
            duration: 55,
            description: 'valid',
            questions: fb.array([
                {
                    text: 'yeh',
                    points: 10,
                    showDetails: true,
                    choices: fb.array([
                        {
                            isCorrect: true,
                            text: 'woo hoo',
                        },
                        {
                            isCorrect: false,
                            text: 'woo hoo',
                        },
                    ]),
                },
            ]),
        };
        component.gameForm = fb.group(fakeForm2);
        component.gameForm.updateValueAndValidity({ onlySelf: false, emitEvent: true });
        (component as any).checkChangeForm();
        expect(component.elementToSend).toEqual({});
    });

    it('should handle error on modifyGame', () => {
        const gameId = 'testId';
        const elementToSend = { id: gameId, name: 'Test' };
        component.gameId = gameId;
        component.elementToSend = elementToSend;
        let errorResponse = {
            statusCode: 404,
            message: 'Not Found',
            error: 'Not Found Error',
        };
        mockGameService.updateGame.and.returnValue(throwError(() => errorResponse));
        spyOn(component as any, 'createGame');
        (component as any).modifyGame();
        expect(mockGameService.updateGame).toHaveBeenCalledWith(gameId, elementToSend);
        expect((component as any).createGame).toHaveBeenCalled();
        errorResponse = {
            statusCode: 400,
            message: 'Bad Request',
            error: 'Bad Request Error',
        };
        (component as any).modifyGame();
        expect(mockGameService.updateGame).toHaveBeenCalledWith(gameId, elementToSend);
        expect((component as any).createGame).toHaveBeenCalled();
    });

    it('should call updateGame on modifyGame', () => {
        const gameId = '123';
        const elementToSend = { id: gameId, title: 'Test' };
        component.gameId = gameId;
        component.elementToSend = elementToSend;
        (component as any).modifyGame();
        expect(mockGameService.updateGame).toHaveBeenCalledWith(gameId, elementToSend);
        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Administration]);
        expect(dialogMock.open).toHaveBeenCalledWith(ErrorPopupComponent, { data: { title: CONGRATULATION, message: SUCCESS_QUIZ_MODIFICATION } });
    });

    it('should call createGame on createGame', () => {
        const elementToSend = { name: 'Test' };
        component.elementToSend = elementToSend;
        (component as any).createGame();
        expect(mockGameService.createGame).toHaveBeenCalledWith(elementToSend);
        expect(mockRouter.navigate).toHaveBeenCalledWith([Routes.Administration]);
        expect(dialogMock.open).toHaveBeenCalledWith(ErrorPopupComponent, { data: { title: CONGRATULATION, message: SUCCESS_QUIZ_CREATION } });
    });

    it('should change the errorMessage to equal the response message error of the request', () => {
        const mockError = { message: ErrorType.InternalServerError };
        mockGameService.createGame.and.returnValue(throwError(() => mockError));
        (component as any).createGame();
        expect(component.errorMessage).toEqual(mockError.message);
    });

    it('checkLength should change the value of isRed to true if it is greater then 300', () => {
        // Utilisation de chiffre magique pour tester
        /* eslint-disable-next-line @typescript-eslint/no-magic-numbers */
        component.checkLength(350);
        expect(component.isRed).toEqual(true);
        // Utilisation de chiffre magique pour tester
        /* eslint-disable-next-line @typescript-eslint/no-magic-numbers */
        component.checkLength(250);
        expect(component.isRed).toEqual(false);
    });
    const question: QuestionForm = {
        text: 'Test Question',
        points: 10,
        showDetails: true,
        index: 0,
        choices: [
            { isCorrect: true, text: 'Choice 1' },
            { isCorrect: false, text: 'Choice 2' },
        ],
        type: QuestionType.QCM,
    };

    const questions: QuestionForm[] = [question, question];
    const fakeGame = {
        id: '123',
        title: 'Test Game',
        description: 'This is a test game.',
        duration: 60,
        questions: [
            {
                text: 'yeh',
                points: 10,
                type: QuestionType.QCM,
                choices: [
                    {
                        isCorrect: true,
                        text: 'woo hoo',
                    },
                    {
                        isCorrect: false,
                        text: 'woo hoo',
                    },
                ],
            },
        ],
    };

    const fakeForm = {
        title: 'valid value',
        duration: 50,
        description: 'valid',
        questions: [
            {
                text: 'yeh',
                points: 10,
                showDetails: true,
                index: 0,
                choices: [
                    {
                        isCorrect: true,
                        text: 'woo hoo',
                    },
                    {
                        isCorrect: false,
                        text: 'woo hoo',
                    },
                ],
                type: QuestionType.QCM,
            },
        ],
    };
});
