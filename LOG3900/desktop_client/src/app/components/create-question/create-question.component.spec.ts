// retrait du lint pour any pour accéder aux attributs priver
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
    ErrorType,
    INVALID,
    LIMIT_BOTTOM_VALUE,
    LIMIT_TOP_VALUE,
    MAXIMUM_POINTS_VALUE,
    MINIMUM_POINTS_VALUE,
    POINTS_ENTRY,
    QuestionType,
    ROUNDED_POINTS_ENTRY,
    Status,
} from '@app/app.constants';
import { QuestionForm } from '@app/interfaces/question';
import { GameService } from '@app/services/game/game.service';
import { of, throwError } from 'rxjs';
import { CreateQuestionComponent } from './create-question.component';

describe('CreateQuestionComponent', () => {
    let component: CreateQuestionComponent;
    let fixture: ComponentFixture<CreateQuestionComponent>;
    let fb: FormBuilder;
    let mockGameService: jasmine.SpyObj<GameService>;
    let question: QuestionForm;

    beforeEach(async () => {
        mockGameService = jasmine.createSpyObj('GameService', ['updateQuestion', 'createQuestion']);
        await TestBed.configureTestingModule({
            declarations: [CreateQuestionComponent],
            providers: [FormBuilder, { provide: GameService, useValue: mockGameService }],
            imports: [ReactiveFormsModule],
        }).compileComponents();

        fixture = TestBed.createComponent(CreateQuestionComponent);
        component = fixture.componentInstance;
        fb = TestBed.inject(FormBuilder);

        component.questionForm = fb.group({
            choices: fb.array([]),
            showDetails: [false],
            points: [''],
        });

        question = {
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

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should add a choice', () => {
        component.addChoice();
        expect(component.choices.length).toBe(1);
    });

    it('should delete a choice', () => {
        component.addChoice();
        component.deleteChoice(0);
        expect(component.choices.length).toBe(0);
    });

    it('should toggle showDetails', () => {
        component.toggleDetails();
        expect(component.showDetails).toBe(true);
    });

    it('should handle QRL option', () => {
        const spy = spyOn(component.questionTypeChange, 'emit');
        component.selectOption('QRL');
        expect(component.choices.length).toBe(0);
        expect(component.choices.validator).toBeNull();
        expect(component.isQcmSelected).toBeFalse();
        expect(spy).toHaveBeenCalledWith(QuestionType.QRL);
    });

    it('should handle QCM option', () => {
        const spy = spyOn(component.questionTypeChange, 'emit');
        component.selectOption('QCM');

        expect(component.isQcmSelected).toBeTrue();
        expect(spy).toHaveBeenCalledWith(QuestionType.QCM);
    });

    it('should round points to nearest ten', () => {
        component.questionForm.get('points')?.setValue(POINTS_ENTRY);
        component.roundToNearestTen();
        expect(component.questionForm.get('points')?.value).toBe(ROUNDED_POINTS_ENTRY);

        component.questionForm.get('points')?.setValue(LIMIT_TOP_VALUE);
        component.roundToNearestTen();
        expect(component.questionForm.get('points')?.value).toBe(MAXIMUM_POINTS_VALUE);

        component.questionForm.get('points')?.setValue(LIMIT_BOTTOM_VALUE);
        component.roundToNearestTen();
        expect(component.questionForm.get('points')?.value).toBe(MINIMUM_POINTS_VALUE);
    });

    it('should reorder choices on drag', () => {
        component.addChoice();
        component.addChoice();
        const choice1 = component.choices.at(0);
        const choice2 = component.choices.at(1);

        const event = { previousIndex: 0, currentIndex: 1 } as CdkDragDrop<unknown[]>;

        component.dragChoice(event);
        expect(component.choices.at(0)).toBe(choice2);
        expect(component.choices.at(1)).toBe(choice1);
    });

    it('should call createQuestion if questionForm is valid and index is -1', () => {
        component.gameId = 'some_game_id';
        component.questionForm = fb.group({
            index: [INVALID],
            text: 'Test Question',
            points: 10,
            choices: [
                { isCorrect: true, text: 'Choice 1' },
                { isCorrect: false, text: 'Choice 2' },
            ],
        });
        mockGameService.createQuestion.and.returnValue(of('some_value'));
        component.submitQuestion();
        expect(mockGameService.createQuestion).toHaveBeenCalled();
    });

    it('should call updateQuestion if questionForm is valid and index is not -1', () => {
        component.gameId = 'some_game_id';
        component.questionForm = fb.group({
            index: [0],
            text: 'Test Question',
            points: 10,
            choices: [
                { isCorrect: true, text: 'Choice 1' },
                { isCorrect: false, text: 'Choice 2' },
            ],
        });
        mockGameService.updateQuestion.and.returnValue(of('some_value'));
        component.submitQuestion();

        expect(mockGameService.updateQuestion).toHaveBeenCalled();
    });

    it('should set updated to true and mark questionForm as untouched on successful createQuestion call', () => {
        mockGameService.createQuestion.and.returnValue(of('some_value'));
        component.gameId = 'some_game_id';

        (component as any).createQuestion(question);

        expect(component.status).toEqual(component.statusEnum.UpdateAccept);
        expect(component.questionForm.touched).toBeFalse();
    });

    it('should set updated to true and mark questionForm as untouched on successful updateQuestion call', () => {
        mockGameService.updateQuestion.and.returnValue(of('some_value'));
        component.gameId = 'some_game_id';

        (component as any).updateQuestion(question);

        expect(component.status).toEqual(component.statusEnum.UpdateAccept);
        expect(component.questionForm.touched).toBeFalse();
    });

    it('should not call update or create if gameId is null', () => {
        spyOn(component as any, 'createQuestion');
        spyOn(component as any, 'updateQuestion');
        component.gameId = null;

        component.submitQuestion();

        expect((component as any).createQuestion).not.toHaveBeenCalled();
        expect((component as any).updateQuestion).not.toHaveBeenCalled();
    });

    it('should not call update or create if questionForm is invalid', () => {
        spyOn(component as any, 'createQuestion');
        spyOn(component as any, 'updateQuestion');
        component.gameId = 'some_game_id';
        component.questionForm = fb.group({
            index: [INVALID],
            points: [null, Validators.required],
            choices: [
                { isCorrect: true, text: 'Choice 1' },
                { isCorrect: true, text: 'Choice 2' },
            ],
        });
        component.submitQuestion();
        expect((component as any).createQuestion).not.toHaveBeenCalled();
        expect((component as any).updateQuestion).not.toHaveBeenCalled();
    });

    it('should not set updated to true or mark questionForm as untouched on failed createQuestion call', () => {
        const mockError = { message: ErrorType.InternalServerError };
        mockGameService.createQuestion.and.returnValue(throwError(() => mockError));
        component.gameId = 'some_game_id';
        component.questionForm.markAllAsTouched();

        (component as any).createQuestion(question);
        expect(component.questionForm.touched).toBeTrue();
        (component as any).createQuestion(question);
        expect((component as any).status).toEqual(Status.UpdateRefuse);
        expect((component as any).errorType).toEqual(ErrorType.InternalServerError);
    });

    it('should not set updated to true or mark questionForm as untouched on failed updateQuestion call', () => {
        const mockError = { message: ErrorType.InternalServerError };
        mockGameService.updateQuestion.and.returnValue(throwError(() => mockError));
        component.gameId = 'some_game_id';
        component.questionForm.markAllAsTouched();

        (component as any).updateQuestion(question);

        expect(component.status).toEqual(Status.UpdateRefuse);
        expect(component.errorType).toEqual(ErrorType.InternalServerError);
        expect(component.questionForm.touched).toBeTrue();
    });
});
