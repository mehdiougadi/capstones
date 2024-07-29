import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ImportModalComponent } from '@app/components/admin/import-modal/import-modal.component';
import { MessageDialogComponent } from '@app/components/general/message-dialog/message-dialog.component';
import { ImportMessage } from '@common/client-message/import-pop-up';
import { QuestionMessage } from '@common/client-message/question-pop-up';
import { QuizMessage } from '@common/client-message/quiz-pop-up';
import { QuestionType } from '@common/constant/state';
import { Answer } from '@common/interfaces/answer';
import { Question } from '@common/interfaces/question';
import { Quiz } from '@common/interfaces/quiz';
import { ImportQuizJsonService } from './import-quiz-json.service';

describe('ImportQuizJsonService', () => {
    let service: ImportQuizJsonService;
    let mockMatDialog: jasmine.SpyObj<MatDialog>;
    let mockQuizData: Quiz;
    let mockQuizList: Quiz[];

    beforeEach(() => {
        mockQuizList = [
            { _id: '1', title: 'Test Quiz', description: 'Description 1', questions: [], duration: 60, visible: true, lastModification: new Date() },
        ];
        const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
        mockQuizData = {
            _id: 'testId',
            title: 'UNTAKEN TITLE',
            description: 'Test Description',
            questions: [
                {
                    _id: 'TESTinG ID',
                    text: 'test text',
                    choices: [
                        { text: 'testChoice', isCorrect: true },
                        { text: 'testChoice', isCorrect: false },
                    ],
                    points: 10,
                    date: new Date(),
                    type: QuestionType.QCM,
                },
            ],
            visible: true,
            lastModification: new Date(),
            duration: 20,
        };
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [ImportQuizJsonService, { provide: MatDialog, useValue: matDialogSpy }],
        });
        service = TestBed.inject(ImportQuizJsonService);
        mockMatDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
        service['quizManagerService'].quizList = mockQuizList;
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should resolve with false if file format is not JSON', async () => {
        const file = new File([''], 'test.txt', { type: 'text/plain' });
        expect(await service.isImportValid(file)).toBeFalse();
        expect(mockMatDialog.open).toHaveBeenCalledOnceWith(jasmine.anything(), { data: { message: jasmine.any(String) } });
    });

    it('should resolve with false if JSON parsing fails', async () => {
        const file = new File([''], 'test.json', { type: 'application/json' });
        expect(await service.isImportValid(file)).toBeFalse();
    });

    it('should resolve with false if JSON parsing fails', async () => {
        const file = new File(['{"invalid": "json"}'], 'test.json', { type: 'application/json' });
        expect(await service.isImportValid(file)).toBeFalse();
    });

    it('should resolve with the result of createQuiz if JSON parsing succeeds', async () => {
        const file = new File([JSON.stringify(mockQuizData)], 'test.json', { type: 'application/json' });
        spyOn(service, 'createQuiz').and.returnValue(true);

        expect(await service.isImportValid(file)).toBeTrue();
        expect(service.createQuiz).toHaveBeenCalledWith(JSON.parse(JSON.stringify(mockQuizData)), '');
    });

    it('should assign newName if name is already in quizList', () => {
        const result = service.createQuiz(mockQuizData, 'newName');

        expect(result).toBeTrue();
        expect(mockQuizData.title).toEqual('newName');
    });

    it('Title should not be undefined or wrong type', async () => {
        const testQuiz: Omit<Quiz, 'title'> = {
            _id: '1',
            description: 'Test Description',
            questions: [],
            duration: 10,
            visible: true,
            lastModification: new Date(),
        };
        const file = new File([JSON.stringify(testQuiz)], 'test.json', { type: 'application/json' });

        expect(await service.isImportValid(file)).toBeFalse();
        expect(mockMatDialog.open).toHaveBeenCalledOnceWith(MessageDialogComponent, { data: { message: ImportMessage.QUIZ_TITLE_TYPE } });
    });

    it('should call importModalComponent if the quiz name is already in quizList', async () => {
        mockQuizData.title = 'Test Quiz';
        const file = new File([JSON.stringify(mockQuizData)], 'test.json', { type: 'application/json' });

        expect(await service.isImportValid(file)).toBeFalse();
        expect(mockMatDialog.open).toHaveBeenCalledOnceWith(ImportModalComponent, { data: { quiz: JSON.parse(JSON.stringify(mockQuizData)) } });
    });

    it('Description should not be undefined or wrong type', async () => {
        const testQuiz: Omit<Quiz, 'description'> = {
            _id: '1',
            title: 'Test Description',
            questions: [],
            duration: 10,
            visible: true,
            lastModification: new Date(),
        };
        const file = new File([JSON.stringify(testQuiz)], 'test.json', { type: 'application/json' });

        expect(await service.isImportValid(file)).toBeFalse();
        expect(mockMatDialog.open).toHaveBeenCalledOnceWith(MessageDialogComponent, { data: { message: ImportMessage.QUIZ_DESCRIPTION_TYPE } });
    });

    it('Questions should not be undefined or wrong type', async () => {
        const testQuiz: Omit<Quiz, 'questions'> = {
            _id: '1',
            title: 'Test Description',
            description: 'Test Description',
            duration: 10,
            visible: true,
            lastModification: new Date(),
        };
        const file = new File([JSON.stringify(testQuiz)], 'test.json', { type: 'application/json' });

        expect(await service.isImportValid(file)).toBeFalse();
        expect(mockMatDialog.open).toHaveBeenCalledOnceWith(MessageDialogComponent, { data: { message: ImportMessage.QUIZ_QUESTIONS_TYPE } });
    });

    it('Duration should not be undefined or wrong type', async () => {
        const testQuiz: Omit<Quiz, 'duration'> = {
            _id: '1',
            title: 'Test Description',
            description: 'Test Description',
            questions: [],
            visible: true,
            lastModification: new Date(),
        };
        const file = new File([JSON.stringify(testQuiz)], 'test.json', { type: 'application/json' });

        expect(await service.isImportValid(file)).toBeFalse();
        expect(mockMatDialog.open).toHaveBeenCalledOnceWith(MessageDialogComponent, { data: { message: ImportMessage.QUIZ_DURATION_TYPE } });
    });

    it('Question text should not be undefined or wrong type', async () => {
        type OmitQuestionText = Omit<Question, 'text'>;
        const testQuiz: Omit<Quiz, 'questions'> & { questions: OmitQuestionText[] } = {
            _id: '1',
            title: 'Test Description',
            description: 'Test Description',
            questions: [],
            visible: true,
            lastModification: new Date(),
            duration: 0,
        };
        const testQuestion: Omit<Question, 'text'> = {
            _id: '1',
            points: 10,
            choices: [],
            date: new Date(),
            type: QuestionType.QCM,
        };
        testQuiz.questions = [testQuestion];
        const file = new File([JSON.stringify(testQuiz)], 'test.json', { type: 'application/json' });

        expect(await service.isImportValid(file)).toBeFalse();
        expect(mockMatDialog.open).toHaveBeenCalledWith(MessageDialogComponent, { data: { message: ImportMessage.QUESTION_TEXT_TYPE } });
    });

    it('should open message dialog if choices are not defined for QRL type question', async () => {
        const mockQuestion = {
            _id: '1',
            text: 'What is the capital of France?',
            points: 20,
            type: QuestionType.QRL,
            date: new Date(),
            choices: [
                { text: 'Choice 1', isCorrect: true },
                { text: 'Choice 2', isCorrect: false },
            ],
        };

        const result = service['isQuestionDefined'](mockQuestion);
        expect(result).toBeFalse();
        expect(mockMatDialog.open).toHaveBeenCalledWith(MessageDialogComponent, { data: { message: ImportMessage.QRL_CHOICES } });
    });

    it('should open message dialog if question type is not defined', () => {
        const mockQuestion = {
            _id: '1',
            text: 'What is the capital of France?',
            points: 20,
            type: 'InvalidType' as QuestionType,
            date: new Date(),
            choices: [
                { text: 'Choice 1', isCorrect: true },
                { text: 'Choice 2', isCorrect: false },
            ],
        };

        const result = service['isQuestionTypeDefined'](mockQuestion);
        expect(result).toBeFalse();
        expect(mockMatDialog.open).toHaveBeenCalledWith(MessageDialogComponent, { data: { message: ImportMessage.QUESTION_TYPE } });
    });

    it('should return false if question type is undefined or invalid', () => {
        const mockQuestion = {
            _id: '1',
            text: 'What is the capital of France?',
            points: 20,
            type: 'invalid' as QuestionType,
            date: new Date(),
            choices: [
                { text: 'Choice 1', isCorrect: true },
                { text: 'Choice 2', isCorrect: false },
            ],
        };

        const result = service['isQuestionDefined'](mockQuestion);
        expect(result).toBeFalse();
    });

    it('Question points should not be undefined or wrong type', async () => {
        type OmitQuestionPoints = Omit<Question, 'points'>;
        const testQuiz: Omit<Quiz, 'questions'> & { questions: OmitQuestionPoints[] } = {
            _id: '1',
            title: 'Test Description',
            description: 'Test Description',
            questions: [],
            visible: true,
            lastModification: new Date(),
            duration: 10,
        };
        const testQuestion: Omit<Question, 'points'> = {
            _id: '1',
            text: 'What is the capital of France?',
            type: QuestionType.QCM,
            choices: [
                { text: 'Paris', isCorrect: true },
                { text: 'London', isCorrect: false },
                { text: 'Berlin', isCorrect: false },
                { text: 'Rome', isCorrect: false },
            ],
            date: new Date(),
        };
        testQuiz.questions = [testQuestion];
        const file = new File([JSON.stringify(testQuiz)], 'test.json', { type: 'application/json' });

        expect(await service.isImportValid(file)).toBeFalse();
        expect(mockMatDialog.open).toHaveBeenCalledWith(MessageDialogComponent, { data: { message: ImportMessage.QUESTION_POINTS_TYPE } });
    });

    it('Question choices should not be undefined or wrong type', async () => {
        type OmitQuestionChoices = Omit<Question, 'choices'>;
        const testQuiz: Omit<Quiz, 'questions'> & { questions: OmitQuestionChoices[] } = {
            _id: '1',
            title: 'Test Description',
            description: 'Test Description',
            questions: [{ _id: '1', text: 'test text', points: 10, date: new Date(), type: QuestionType.QCM }],

            visible: true,
            lastModification: new Date(),
            duration: 0,
        };
        const file = new File([JSON.stringify(testQuiz)], 'test.json', { type: 'application/json' });

        expect(await service.isImportValid(file)).toBeFalse();
        expect(mockMatDialog.open).toHaveBeenCalledOnceWith(MessageDialogComponent, { data: { message: ImportMessage.QUESTION_CHOICES_TYPE } });
    });

    it('choices text should not be undefined or wrong type', async () => {
        type OmitchoicesText = Omit<Answer, 'text'>;
        type OmitQuestionChoices = Omit<Question, 'choices'> & { choices: OmitchoicesText[] };
        const testChoices: OmitchoicesText = {
            isCorrect: true,
        };
        const testQuiz: Omit<Quiz, 'questions'> & { questions: OmitQuestionChoices[] } = {
            _id: '1',
            title: 'Test Description',
            description: 'Test Description',
            questions: [{ _id: '1', text: 't1', choices: [testChoices], points: 10, date: new Date(), type: QuestionType.QCM }],
            visible: true,
            lastModification: new Date(),
            duration: 0,
        };
        const file = new File([JSON.stringify(testQuiz)], 'test.json', { type: 'application/json' });

        expect(await service.isImportValid(file)).toBeFalse();
        expect(mockMatDialog.open).toHaveBeenCalledOnceWith(MessageDialogComponent, { data: { message: ImportMessage.CHOICE_TEXT_TYPE } });
    });

    it('choices isCorrect should not be undefined or wrong type', async () => {
        type OmitchoicesIsCorrect = Omit<Answer, 'isCorrect'>;
        type OmitQuestionChoices = Omit<Question, 'choices'> & { choices: OmitchoicesIsCorrect[] };
        const testChoices: OmitchoicesIsCorrect = {
            text: 'test text',
        };
        const testQuiz: Omit<Quiz, 'questions'> & { questions: OmitQuestionChoices[] } = {
            _id: '1',
            title: 'Test Description',
            description: 'Test Description',
            questions: [{ _id: '1', text: 't1', choices: [testChoices], points: 10, date: new Date(), type: QuestionType.QCM }],
            visible: true,
            lastModification: new Date(),
            duration: 0,
        };
        const file = new File([JSON.stringify(testQuiz)], 'test.json', { type: 'application/json' });

        expect(await service.isImportValid(file)).toBeFalse();
        expect(mockMatDialog.open).toHaveBeenCalledOnceWith(MessageDialogComponent, { data: { message: ImportMessage.CHOICE_ISCORRECT_TYPE } });
    });

    it('Should return false if quiz is invalid ', async () => {
        mockQuizData.duration = 0;
        const file = new File([JSON.stringify(mockQuizData)], 'test.json', { type: 'application/json' });

        expect(await service.isImportValid(file)).toBeFalse();
        expect(mockMatDialog.open).toHaveBeenCalledOnceWith(MessageDialogComponent, { data: { message: QuizMessage.QUIZ_DURATION_INVALID } });
    });

    it('Should return false question is invalid ', async () => {
        mockQuizData.questions[0].points = 0;
        const file = new File([JSON.stringify(mockQuizData)], 'test.json', { type: 'application/json' });

        expect(await service.isImportValid(file)).toBeFalse();
        expect(mockMatDialog.open).toHaveBeenCalledOnceWith(MessageDialogComponent, { data: { message: QuestionMessage.QUESTION_POINTS_INVALID } });
    });

    it('Should return true is quiz is valid ', async () => {
        const file = new File([JSON.stringify(mockQuizData)], 'test.json', { type: 'application/json' });
        expect(await service.isImportValid(file)).toBeTrue();
    });
});
