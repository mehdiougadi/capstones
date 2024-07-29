import { Quiz } from '@app/model/database/quiz';
import { CreateQuizDto } from '@app/model/dto/quiz/create-quiz.dto';
import { UpdateQuizDto } from '@app/model/dto/quiz/update-quiz.dto';
import { QuizDbService } from '@app/services/quiz-service/quiz.service';
import { Test, TestingModule } from '@nestjs/testing';
import { QuizController } from './quiz.controller';

describe('QuizController', () => {
    let controller: QuizController;
    let quizDbService: QuizDbService;

    const quizList: Quiz[] = [
        {
            _id: '1',
            title: 'Quiz 1',
            description: 'First quiz Test',
            questions: [],
            duration: 60,
            lastModification: new Date(),
            visible: true,
        },
        {
            _id: '2',
            title: 'Quiz 2',
            description: 'Second quiz Test',
            questions: [],
            duration: 45,
            lastModification: new Date(),
            visible: false,
        },
    ];

    const quizExample: Quiz = {
        _id: '3',
        title: 'Quiz 3',
        description: 'Third quiz Test',
        questions: [],
        duration: 30,
        lastModification: new Date(),
        visible: true,
    };

    const quizDtoExample: CreateQuizDto = {
        title: 'New Quiz',
        description: 'What a quiz should look like',
        questions: [],
        duration: 90,
        _id: '4',
        lastModification: new Date(),
        visible: true,
    };

    const quizCreationExample: Quiz = {
        _id: '4',
        title: 'New Quiz',
        description: 'Test for a new quiz',
        questions: [],
        duration: 90,
        lastModification: new Date(),
        visible: true,
    };

    const quizUpdateDto: UpdateQuizDto = {
        title: 'Just an Updated Quiz',
        questionsArray: [],
        lastModification: new Date(),
        _id: '5',
    };

    const quizExampleUpdate: Quiz = {
        _id: '5',
        title: 'Updated Quiz',
        description: 'How to update a quiz',
        questions: [],
        duration: 120,
        lastModification: new Date(),
        visible: false,
    };
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [QuizController],
            providers: [
                {
                    provide: QuizDbService,
                    useValue: {
                        getAllQuiz: jest.fn().mockResolvedValue(quizList),
                        getQuiz: jest.fn().mockResolvedValue(quizExample),
                        addQuiz: jest.fn().mockResolvedValue(quizCreationExample),
                        deleteQuiz: jest.fn(),
                        updateQuiz: jest.fn().mockResolvedValue(quizExampleUpdate),
                    },
                },
            ],
        }).compile();

        controller = module.get<QuizController>(QuizController);
        quizDbService = module.get<QuizDbService>(QuizDbService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    it('should return all quizzes', async () => {
        const result = await controller.getAllQuiz();
        expect(result).toEqual(quizList);
    });

    it('should return a specific quiz by ID', async () => {
        const quizId = 'some_id';
        const result = await controller.getQuiz(quizId);
        expect(result).toEqual(quizExample);
    });

    it('should create a new quiz', async () => {
        const result = await controller.createQuiz(quizDtoExample);
        expect(result).toEqual(quizCreationExample);
    });

    it('should delete a quiz by ID', async () => {
        const quizId = 'some_id';
        await controller.deleteQuiz(quizId);
        expect(quizDbService.deleteQuiz).toHaveBeenCalledWith(quizId);
    });

    it('should update a quiz by ID', async () => {
        const quizId = 'some_id';
        const result = await controller.updateQuiz(quizId, quizUpdateDto);
        expect(result).toEqual(quizExampleUpdate);
    });
});
