import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { QuestionMessage } from '@common/client-message/question-pop-up';
import { QuestionType } from '@common/constant/state';
import { Question } from '@common/interfaces/question';
import { QuestionValidationService } from './question-validation.service';

describe('QuestionValidationService', () => {
    let service: QuestionValidationService;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let mockQuestion: Question;
    let mockQuestionList: Question[];

    beforeEach(() => {
        const spy = jasmine.createSpyObj('MatDialog', ['open']);
        TestBed.configureTestingModule({
            providers: [QuestionValidationService, { provide: MatDialog, useValue: spy }],
        });
        service = TestBed.inject(QuestionValidationService);
        dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

        mockQuestion = {
            _id: '1',
            text: 'Sample question',
            type: QuestionType.QCM,
            points: 20,
            choices: [],
            date: new Date(),
        };

        mockQuestionList = [
            { _id: '2', text: 'Question 1', type: QuestionType.QCM, points: 10, choices: [], date: new Date() },
            { _id: '3', text: 'Question 2', type: QuestionType.QCM, points: 10, choices: [], date: new Date() },
            { _id: '4', text: 'Question 3', type: QuestionType.QCM, points: 10, choices: [], date: new Date() },
        ];
    });
    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return true if the question title does not exist in the question list', () => {
        const isValid = service['isTitleInBank'](mockQuestion, mockQuestionList);
        expect(isValid).toBeTrue();
        expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should return true if the question title and points are valid for QRL type question', () => {
        mockQuestion.type = QuestionType.QRL;
        const isValid = service.isQuestionValid(mockQuestion);
        expect(isValid).toBeTrue();
    });

    it('should return false and open message dialog if the question title already exists in the question list', () => {
        mockQuestion.text = 'Question 2';

        const isValid = service['isTitleInBank'](mockQuestion, mockQuestionList);
        expect(isValid).toBeFalse();
        expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
            data: { message: QuestionMessage.QUESTION_ALREADY_EXISTS },
        });
    });

    it('should return true if the question title is not empty', () => {
        const isValid = service['isTitleValid'](mockQuestion);
        expect(isValid).toBeTrue();
        expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should return false and open message dialog if the question title is empty', () => {
        mockQuestion.text = '';

        const isValid = service['isTitleValid'](mockQuestion);
        expect(isValid).toBeFalse();
        expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
            data: { message: QuestionMessage.QUESTION_TITLE_EMPTY },
        });
    });

    it('should return true for valid points', () => {
        mockQuestion.points = 10;
        const isValid = service['isPointsValid'](mockQuestion);
        expect(isValid).toBeTrue();
        expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should return false for points less than lower bound', () => {
        mockQuestion.points = 5;
        const isValid = service['isPointsValid'](mockQuestion);
        expect(isValid).toBeFalse();
        expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
            data: { message: QuestionMessage.QUESTION_POINTS_INVALID },
        });
    });

    it('should return false for points higher than higher bound', () => {
        mockQuestion.points = 105;
        const isValid = service['isPointsValid'](mockQuestion);
        expect(isValid).toBeFalse();
        expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
            data: { message: QuestionMessage.QUESTION_POINTS_INVALID },
        });
    });

    it('should return false for points not divisible by 10', () => {
        mockQuestion.points = 25;
        const isValid = service['isPointsValid'](mockQuestion);
        expect(isValid).toBeFalse();
        expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
            data: { message: QuestionMessage.QUESTION_POINTS_INVALID },
        });
    });

    it('should return true if all answer texts are non-empty for a QCM question', () => {
        mockQuestion.choices = [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: false },
            { text: 'Choice 3', isCorrect: false },
        ];

        const isValid = service['isAnswersValid'](mockQuestion);
        expect(isValid).toBeTrue();
        expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should return false if any answer text is empty for a QCM question', () => {
        mockQuestion.choices = [
            { text: 'Choice 1', isCorrect: true },
            { text: '', isCorrect: false },
            { text: 'Choice 3', isCorrect: false },
        ];

        const isValid = service['isAnswersValid'](mockQuestion);
        expect(isValid).toBeFalse();
        expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
            data: { message: QuestionMessage.ANSWER_TEXT_EMPTY },
        });
    });

    it('should return true if at least one correct answer is provided for a QCM question', () => {
        mockQuestion.choices = [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: false },
            { text: 'Choice 3', isCorrect: false },
        ];

        const isValid = service['isRightAnswersValid'](mockQuestion);
        expect(isValid).toBeTrue();
        expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should return true for non-QCM question with valid title and points', () => {
        const qrlQuestion: Question = {
            _id: '1',
            text: 'Sample question',
            type: QuestionType.QRL,
            points: 20,
            choices: [],
            date: new Date(),
        };

        const isValid = service.isQuestionValid(qrlQuestion);
        expect(isValid).toBeTrue();
    });

    it('should return false if no correct answer is provided for a QCM question', () => {
        mockQuestion.choices = [
            { text: 'Choice 1', isCorrect: false },
            { text: 'Choice 2', isCorrect: false },
            { text: 'Choice 3', isCorrect: false },
        ];

        const isValid = service['isRightAnswersValid'](mockQuestion);
        expect(isValid).toBeFalse();
        expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
            data: { message: QuestionMessage.RIGHT_ANSWER_MISSING },
        });
    });

    it('should return true if at least one incorrect answer is provided for a QCM question', () => {
        mockQuestion.choices = [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: true },
            { text: 'Choice 3', isCorrect: false },
        ];

        const isValid = service['isWrongAnswersValid'](mockQuestion);
        expect(isValid).toBeTrue();
        expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should return false if no incorrect answer is provided for a QCM question', () => {
        mockQuestion.choices = [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: true },
            { text: 'Choice 3', isCorrect: true },
        ];

        const isValid = service['isWrongAnswersValid'](mockQuestion);
        expect(isValid).toBeFalse();
        expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
            data: { message: QuestionMessage.WRONG_ANSWER_MISSING },
        });
    });

    it('should return true if the number of choices is within the allowed range for a QCM question', () => {
        mockQuestion.choices = [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: false },
            { text: 'Choice 3', isCorrect: false },
        ];

        const isValid = service['isAnswerLengthValid'](mockQuestion);
        expect(isValid).toBeTrue();
        expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should return false if the number of choices is less than the minimum allowed for a QCM question', () => {
        mockQuestion.choices = [{ text: 'Choice 1', isCorrect: true }];

        const isValid = service['isAnswerLengthValid'](mockQuestion);
        expect(isValid).toBeFalse();
        expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
            data: { message: QuestionMessage.CHOICES_LENGTH_INVALID },
        });
    });

    it('should return false if the number of choices is greater than the maximum allowed for a QCM question', () => {
        mockQuestion.choices = [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: false },
            { text: 'Choice 3', isCorrect: false },
            { text: 'Choice 4', isCorrect: false },
            { text: 'Choice 5', isCorrect: false },
        ];

        const isValid = service['isAnswerLengthValid'](mockQuestion);
        expect(isValid).toBeFalse();
        expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
            data: { message: QuestionMessage.CHOICES_LENGTH_INVALID },
        });
    });
});
