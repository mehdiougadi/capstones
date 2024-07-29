/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
import { Answer } from '@app/model/database/answer';
import { Question } from '@app/model/database/question';
import { Quiz, QuizDocument } from '@app/model/database/quiz';
import { CreateQuizDto } from '@app/model/dto/quiz/create-quiz.dto';
import { UpdateQuizDto } from '@app/model/dto/quiz/update-quiz.dto';
import { QuestionType } from '@common/constant/state';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { QuizDbService } from './quiz.service';

describe('QuizDbService', () => {
    let service: QuizDbService;
    let quizModel: Model<QuizDocument>;
    const mockQuestions: Question[] = [
        {
            _id: 'question_id_1',
            type: QuestionType.QCM,
            text: 'Question 1',
            points: 30,
            choices: [
                {
                    text: 'Choice 1',
                    isCorrect: true,
                },
                {
                    text: 'Choice 2',
                    isCorrect: false,
                },
            ],
            date: new Date(),
        },
    ];

    const question: Question = {
        _id: 'question_id_1',
        type: QuestionType.QCM,
        text: 'Question 1',
        points: 1,
        choices: [
            {
                text: 'Choice 1',
                isCorrect: true,
            },
            {
                text: 'Choice 2',
                isCorrect: false,
            },
        ],
        date: new Date(),
    };
    const mockQuizzes: Quiz[] = [
        {
            _id: 'quizId',
            title: 'Quiz 1',
            description: 'This is the first quiz',
            visible: true,
            questions: [question],
            duration: 60,
            lastModification: new Date(),
        },
    ];
    const mockQuizId = 'quizId';

    const mockUpdateDto: UpdateQuizDto = {
        title: 'Quiz 1',
        questionsArray: [question],
        lastModification: new Date(),
        _id: mockQuizId,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuizDbService,
                {
                    provide: getModelToken(Quiz.name),
                    useValue: {
                        find: jest.fn(),
                        findOne: jest.fn(),
                        create: jest.fn(),
                        save: jest.fn(),
                        deleteOne: jest.fn(),
                        findByIdAndUpdate: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Question.name),
                    useValue: {
                        create: jest.fn(),
                    },
                },
                {
                    provide: getModelToken(Answer.name),
                    useValue: {
                        create: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<QuizDbService>(QuizDbService);
        quizModel = module.get<Model<QuizDocument>>(getModelToken(Quiz.name));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getAllQuiz', () => {
        it('should return an array of quizzes', async () => {
            jest.spyOn(quizModel, 'find').mockResolvedValueOnce(mockQuizzes);

            const result = await service.getAllQuiz();

            expect(result).toEqual(mockQuizzes);
        });
    });

    describe('getQuiz', () => {
        it('should return a quiz if found', async () => {
            jest.spyOn(quizModel, 'findOne').mockResolvedValueOnce(mockQuizzes[0]);
            const result = await service.getQuiz(mockQuizId);
            expect(result).toEqual(mockQuizzes[0]);
        });
    });

    describe('deleteQuiz', () => {
        it('should delete a quiz successfully', async () => {
            const mockDeleteResult = {
                acknowledged: true,
                deletedCount: 1,
            };

            jest.spyOn(quizModel, 'deleteOne').mockResolvedValueOnce(mockDeleteResult);

            await service.deleteQuiz(mockQuizId);

            expect(quizModel.deleteOne).toHaveBeenCalledWith({ _id: mockQuizId });
        });
    });

    describe('addQuiz', () => {
        it('should save a new quiz successfully', async () => {
            const mockQuizDto: CreateQuizDto = {
                title: 'New Quiz',
                _id: 'new_quiz_id',
                description: 'Description of new quiz',
                visible: true,
                questions: [],
                duration: 45,
                lastModification: new Date(),
            };

            const mockQuizDocument = {
                ...mockQuizDto,
                _id: 'new_quiz_id',
            };

            jest.spyOn(quizModel, 'create').mockResolvedValueOnce({
                ...mockQuizDocument,
                save: jest.fn().mockResolvedValueOnce(mockQuizDocument),
            } as any);

            await service.addQuiz(mockQuizDto);

            expect(quizModel.create).toHaveBeenCalledWith(mockQuizDto);
        });
    });

    describe('updateQuiz', () => {
        it('should update a quiz successfully', async () => {
            const mockUpdatedQuiz = {
                _id: mockQuizId,
            };

            jest.spyOn(quizModel, 'findByIdAndUpdate').mockResolvedValueOnce(mockUpdatedQuiz as unknown);

            const result = await service.updateQuiz(mockQuizId, mockUpdateDto);

            expect(quizModel.findByIdAndUpdate).toHaveBeenCalledWith(mockQuizId, mockUpdateDto, { new: true });
            expect(result).toEqual(mockUpdatedQuiz);
        });
    });

    describe('generateRandomQuiz', () => {
        it('should generate a random quiz successfully', async () => {
            const result = service.generateRandomQuiz(mockQuestions);
            expect(result.title).toBe('Mode aléatoire');
            expect(result.description).toBe('Ceci est un mode aléatoire');
            expect(result.questions).toEqual(mockQuestions);
            expect(result.duration).toBe(20);
            expect(result.lastModification).toBeInstanceOf(Date);
        });
    });
});
