import { Question } from '@app/model/database/question';
import { CreateQuestionDto } from '@app/model/dto/question/create-question.dto';
import { QuestionDbService } from '@app/services/question-service/question.service';
import { QuestionType } from '@common/constant/state';
import { Test, TestingModule } from '@nestjs/testing';
import { QuestionController } from './question.controller';

describe('QuestionController', () => {
    let controller: QuestionController;
    let questionDbService: QuestionDbService;
    const mockedQuestion: CreateQuestionDto = {
        _id: 'randomId12',
        type: QuestionType.QCM,
        text: 'Just a new question',
        points: 10,
        choices: [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: false },
        ],
        date: new Date(),
    };

    const questionMock: Question = {
        type: QuestionType.QCM,
        text: 'It is just a question',
        points: 10,
        choices: [
            { text: 'Choice 1', isCorrect: true },
            { text: 'Choice 2', isCorrect: false },
        ],
        date: new Date(),
        _id: 'randomId10',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [QuestionController],
            providers: [
                {
                    provide: QuestionDbService,
                    useValue: {
                        findAllQuestions: jest.fn(),
                        findQuestionById: jest.fn(),
                        createQuestion: jest.fn(),
                        updateQuestion: jest.fn(),
                        deleteQuestion: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<QuestionController>(QuestionController);
        questionDbService = module.get<QuestionDbService>(QuestionDbService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('createQuestion', () => {
        it('should create a question', async () => {
            jest.spyOn(questionDbService, 'createQuestion').mockResolvedValue();

            const allQuestions: Question[] = [];
            jest.spyOn(controller, 'getAllQuestions').mockResolvedValue(allQuestions);

            const result = await controller.createQuestion(mockedQuestion);

            expect(result).toEqual(allQuestions);
        });
    });

    describe('getAllQuestions', () => {
        it('should return all questions', async () => {
            const allQuestions: Question[] = [];
            jest.spyOn(questionDbService, 'findAllQuestions').mockResolvedValue(allQuestions);

            const result = await controller.getAllQuestions();

            expect(result).toEqual(allQuestions);
        });
    });

    describe('getQuestion', () => {
        it('should return a specific question by ID', async () => {
            jest.spyOn(questionDbService, 'findQuestionById').mockResolvedValue(questionMock);

            const result = await controller.getQuestion(questionMock._id);

            expect(result).toEqual(questionMock);
        });
    });

    describe('updateQuestion', () => {
        it('should update a specific question by ID', async () => {
            jest.spyOn(questionDbService, 'updateQuestion').mockResolvedValue(questionMock);

            const result = await controller.updateQuestion(questionMock._id, mockedQuestion);

            expect(result).toEqual(questionMock);
        });
    });

    describe('deleteQuestion', () => {
        it('should delete a specific question using its ID', async () => {
            jest.spyOn(questionDbService, 'deleteQuestion').mockResolvedValue(undefined);

            const result = await controller.deleteQuestion(questionMock._id);

            expect(result).toBeUndefined();
        });
    });
});
