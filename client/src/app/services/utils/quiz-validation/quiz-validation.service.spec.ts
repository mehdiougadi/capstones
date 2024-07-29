import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { QuizMessage } from '@common/client-message/quiz-pop-up';
import { QuestionType } from '@common/constant/state';
import { Quiz } from '@common/interfaces/quiz';
import { QuizValidationService } from './quiz-validation.service';

describe('QuizValidationService', () => {
    let service: QuizValidationService;
    let dialogSpy: jasmine.SpyObj<MatDialog>;
    let mockQuiz: Quiz;
    let mockQuizList: Quiz[];

    beforeEach(() => {
        const spy = jasmine.createSpyObj('MatDialog', ['open']);
        TestBed.configureTestingModule({
            providers: [QuizValidationService, { provide: MatDialog, useValue: spy }],
        });
        service = TestBed.inject(QuizValidationService);
        dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

        mockQuiz = {
            _id: '1',
            title: 'Sample Quiz',
            description: 'Description of the quiz',
            questions: [],
            duration: 10,
            visible: true,
            lastModification: new Date(),
        };

        mockQuizList = [
            {
                _id: '1',
                title: 'Quiz 1',
                description: 'Description of Quiz 1',
                questions: [],
                duration: 10,
                visible: true,
                lastModification: new Date(),
            },
            {
                _id: '2',
                title: 'Quiz 2',
                description: 'Description of Quiz 2',
                questions: [],
                duration: 15,
                visible: true,
                lastModification: new Date(),
            },
        ];
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should return true if the quiz title does not exist in the quiz list', () => {
        const isValid = service['isDuplicateTitle'](mockQuiz, mockQuizList);
        expect(isValid).toBeTrue();
        expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should return false and open message dialog if the question title already exists in the question list', () => {
        mockQuiz.title = 'Quiz 2';

        const isValid = service['isDuplicateTitle'](mockQuiz, mockQuizList);
        expect(isValid).toBeFalse();
        expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
            data: { message: QuizMessage.QUIZ_ALREADY_EXISTS },
        });
    });

    it('should return true if the quiz title is not empty', () => {
        const isValid = service['isTitleValid'](mockQuiz);
        expect(isValid).toBeTrue();
        expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should return false and open message dialog if the quiz title is empty', () => {
        mockQuiz.title = '';

        const isValid = service['isTitleValid'](mockQuiz);
        expect(isValid).toBeFalse();
        expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
            data: { message: QuizMessage.QUIZ_TITLE_EMPTY },
        });
    });

    it('should return true if there are questions in the quiz', () => {
        mockQuiz.questions = [
            { _id: '1', text: 'Question 1', type: QuestionType.QCM, points: 10, choices: [], date: new Date() },
            { _id: '2', text: 'Question 2', type: QuestionType.QCM, points: 10, choices: [], date: new Date() },
        ];

        const isValid = service['isQuestionsValid'](mockQuiz);
        expect(isValid).toBeTrue();
        expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should return false and open message dialog if there are no questions in the quiz', () => {
        const isValid = service['isQuestionsValid'](mockQuiz);
        expect(isValid).toBeFalse();
        expect(dialogSpy.open).toHaveBeenCalledWith(jasmine.anything(), {
            data: { message: QuizMessage.QUIZ_NO_QUESTIONS },
        });
    });
});
