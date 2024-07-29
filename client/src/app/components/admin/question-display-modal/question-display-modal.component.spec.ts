import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ContextQuestionModal, StateQuestionModal } from '@app/common-client/constant/state';
import { QuestionDisplayModalData } from '@app/common-client/interfaces/question-display-modal-data';
import { QuestionManagerService } from '@app/services/managers/question-manager/question-manager.service';
import { QuizManagerService } from '@app/services/managers/quiz-manager/quiz-manager.service';
import { QuestionType } from '@common/constant/state';
import { Question } from '@common/interfaces/question';
import { QuestionDisplayModalComponent } from './question-display-modal.component';

describe('QuestionDisplayModalComponent', () => {
    let component: QuestionDisplayModalComponent;
    let fixture: ComponentFixture<QuestionDisplayModalComponent>;
    let mockDialogRef: MatDialogRef<QuestionDisplayModalComponent>;
    let mockQuizManagerService: jasmine.SpyObj<QuizManagerService>;
    let mockQuestionManagerService: jasmine.SpyObj<QuestionManagerService>;
    const timerTest = 1000;
    const mockQuestion: Question = {
        _id: '1',
        text: 'Test question',
        type: QuestionType.QCM,
        points: 10,
        choices: [
            { text: 'Option 1', isCorrect: true },
            { text: 'Option 2', isCorrect: false },
        ],
        date: new Date(),
    };

    const mockData: QuestionDisplayModalData = {
        question: mockQuestion,
        questionContext: ContextQuestionModal.DEFAULT,
        questionState: StateQuestionModal.DISPLAY,
    };

    beforeEach(async () => {
        mockDialogRef = jasmine.createSpyObj(['close']);
        mockQuestionManagerService = jasmine.createSpyObj('QuestionManagerService', [
            'addQuestionToDB',
            'modifyQuestionFromDB',
            'deleteQuestionFromDB',
        ]);
        mockQuizManagerService = jasmine.createSpyObj('QuizManagerService', [
            'addQuestionToQuiz',
            'modifyQuestionFromQuiz',
            'deleteQuestionFromQuiz',
        ]);
        await TestBed.configureTestingModule({
            declarations: [QuestionDisplayModalComponent],
            imports: [BrowserAnimationsModule, MatDialogModule, HttpClientTestingModule],
            providers: [
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: MAT_DIALOG_DATA, useValue: mockData },
                { provide: QuizManagerService, useValue: mockQuizManagerService },
                { provide: QuestionManagerService, useValue: mockQuestionManagerService },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(QuestionDisplayModalComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should call handleDefaultContextCreate when context is DEFAULT', () => {
        spyOn(component, 'updateQuestionDate');
        spyOn(component, 'handleDefaultContextCreate');

        component.currentContext = ContextQuestionModal.DEFAULT;
        component.createQuestion();

        expect(component.updateQuestionDate).toHaveBeenCalled();
        expect(component.handleDefaultContextCreate).toHaveBeenCalled();
    });

    it('should call handleQuizContextCreate when context is QUIZ and question is valid', () => {
        spyOn(component, 'updateQuestionDate');
        spyOn(component, 'handleQuizContextCreate');
        spyOn(component['questionValidationService'], 'isQuestionValid').and.returnValue(true);

        component.currentContext = ContextQuestionModal.QUIZ;
        component.createQuestion();

        expect(component.updateQuestionDate).toHaveBeenCalled();
        expect(component.handleQuizContextCreate).toHaveBeenCalled();
        expect(component['questionValidationService'].isQuestionValid).toHaveBeenCalledWith(component.currentQuestion);
    });

    it('should update question date and call appropriate handling methods for editing', () => {
        component.currentContext = ContextQuestionModal.DEFAULT;
        spyOn(component, 'updateQuestionDate');
        spyOn(component, 'handleDefaultContextEdit');

        component.editQuestion();

        expect(component.updateQuestionDate).toHaveBeenCalled();
        expect(component.handleDefaultContextEdit).toHaveBeenCalled();
    });

    it('should update question date and call handleQuizContextEdit if context is QUIZ and question is valid', () => {
        component.currentContext = ContextQuestionModal.QUIZ;
        spyOn(component, 'updateQuestionDate');
        spyOn(component['questionValidationService'], 'isQuestionValid').and.returnValue(true);
        spyOn(component, 'handleQuizContextEdit');

        component.editQuestion();

        expect(component.updateQuestionDate).toHaveBeenCalled();
        expect(component.handleQuizContextEdit).toHaveBeenCalled();
        expect(component['questionValidationService'].isQuestionValid).toHaveBeenCalledWith(component.currentQuestion);
    });

    it('should toggle state when changeCurrentState is called', () => {
        expect(component.currentState).toBe(StateQuestionModal.DISPLAY);
        component.changeCurrentState();
        expect(component.currentState).toBe(StateQuestionModal.EDIT);
        component.changeCurrentState();
        expect(component.currentState).toBe(StateQuestionModal.DISPLAY);
    });

    it('should call deleteQuestionFromDB when context is DEFAULT', () => {
        component.currentContext = ContextQuestionModal.DEFAULT;
        component.deleteQuestion();
        expect(mockQuestionManagerService.deleteQuestionFromDB).toHaveBeenCalledWith(mockQuestion._id);
        expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should call deleteQuestionFromQuiz when context is QUIZ', () => {
        component.currentContext = ContextQuestionModal.QUIZ;
        component.deleteQuestion();
        expect(component['quizManagerService'].deleteQuestionFromQuiz).toHaveBeenCalledWith(component.currentQuestion);
        expect(component['dialogRef'].close).toHaveBeenCalled();
    });

    it('should increment choices array length by 1 when incrementMultipleChoice is called', () => {
        const initialLength = component.currentQuestion.choices.length;
        component.incrementMultipleChoice();
        expect(component.currentQuestion.choices.length).toBe(initialLength + 1);
    });

    it('should add a new choice with empty text and isCorrect as false when incrementMultipleChoice is called', () => {
        component.incrementMultipleChoice();
        const newChoice = component.currentQuestion.choices[component.currentQuestion.choices.length - 1];
        expect(newChoice.text).toBe('');
        expect(newChoice.isCorrect).toBe(false);
    });

    it('should decrement choices array length by 1 when decrementMultipleChoice is called', () => {
        const initialLength = component.currentQuestion.choices.length;
        const indexToRemove = 0;
        component.decrementMultipleChoice(indexToRemove);
        expect(component.currentQuestion.choices.length).toBe(initialLength - 1);
    });

    it('should remove the choice at the specified index when decrementMultipleChoice is called', () => {
        const indexToRemove = 1;
        const removedChoice = component.currentQuestion.choices[indexToRemove];
        component.decrementMultipleChoice(indexToRemove);
        expect(component.currentQuestion.choices.includes(removedChoice)).toBe(false);
    });

    it('should update the date of the current question when updateQuestionDate is called', () => {
        const currentDate = new Date();
        const initialDate = component.currentQuestion.date;
        component.updateQuestionDate();
        expect(component.currentQuestion.date).not.toEqual(initialDate);
        const timeDiff = Math.abs(component.currentQuestion.date.getTime() - currentDate.getTime());
        expect(timeDiff).toBeLessThanOrEqual(timerTest);
    });

    it('should close the modal if addQuestionToDb is true', () => {
        component.currentContext = ContextQuestionModal.DEFAULT;
        mockQuestionManagerService.addQuestionToDB.and.returnValue(true);
        component.handleDefaultContextCreate();
        expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should call addQuestionToDB and addQuestionToQuiz, and close the modal', () => {
        component.currentContext = ContextQuestionModal.QUIZ;
        component.isAddedToDB = true;
        component.handleQuizContextCreate();
        expect(mockQuestionManagerService.addQuestionToDB).toHaveBeenCalledWith(component.currentQuestion);
        expect(mockQuizManagerService.addQuestionToQuiz).toHaveBeenCalledWith(component.currentQuestion);
        expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should close the modal if modifyQuestionFromDB is true', () => {
        component.currentContext = ContextQuestionModal.DEFAULT;
        mockQuestionManagerService.modifyQuestionFromDB.and.returnValue(true);
        component.handleDefaultContextEdit();
        expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should call addQuestionToDB and modifyQuestionFromQuiz, and close the modal', () => {
        component.currentContext = ContextQuestionModal.QUIZ;
        component.isAddedToDB = true;
        component.handleQuizContextEdit();
        expect(mockQuestionManagerService.addQuestionToDB).toHaveBeenCalledWith(component.currentQuestion);
        expect(mockQuizManagerService.modifyQuestionFromQuiz).toHaveBeenCalledWith(component.currentQuestion);
        expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should reorder choices in the current question', () => {
        const initialChoices = [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: false },
            { text: 'Choice 3', isCorrect: false },
        ];
        const currentQuestion: Question = {
            _id: '1',
            text: 'Sample question',
            type: QuestionType.QCM,
            points: 10,
            choices: [...initialChoices],
            date: new Date(),
        };
        component.currentQuestion = currentQuestion;
        const event: CdkDragDrop<string[]> = {
            previousIndex: 0,
            currentIndex: 2,
            item: {} as CdkDrag<string>,
            container: {} as CdkDropList<string[]>,
            previousContainer: {} as CdkDropList<string[]>,
            isPointerOverContainer: false,
            distance: { x: 0, y: 0 },
            dropPoint: { x: 0, y: 0 },
            event: {} as MouseEvent,
        };

        component.reOrderQcmAnswers(event);

        expect(component.currentQuestion.choices.length).toBe(initialChoices.length);
        expect(component.currentQuestion.choices[0].text).toBe('Choice 2');
        expect(component.currentQuestion.choices[1].text).toBe('Choice 3');
        expect(component.currentQuestion.choices[2].text).toBe('Choice 1');
    });
});
