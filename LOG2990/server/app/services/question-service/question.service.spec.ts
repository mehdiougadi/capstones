/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Answer } from '@app/model/database/answer';
import { Question, QuestionDocument } from '@app/model/database/question';
import { CreateQuestionDto } from '@app/model/dto/question/create-question.dto';
import { UpdateQuestionDto } from '@app/model/dto/question/update-question.dto';
import { QuestionType } from '@common/constant/state';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { QuestionDbService } from './question.service';

const mockQuestion: Question = {
    _id: 'myQuestionId',
    text: 'just a simple question',
    choices: [],
    points: 10,
    type: QuestionType.QCM,
    date: new Date(),
};

const mockAnswer: Answer = {
    text: 'Sample answer',
    isCorrect: true,
};

const usefulQuestionDto: UpdateQuestionDto = {
    type: QuestionType.QCM,
    points: 10,
    date: new Date(),
    _id: 'myQuestionId',
    choices: [mockAnswer],
    text: 'just a simple question dto',
};

describe('QuestionDbService', () => {
    let service: QuestionDbService;
    let questionModel: Model<QuestionDocument>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                QuestionDbService,
                {
                    provide: getModelToken(Question.name),
                    useValue: {
                        new: jest.fn(),
                        create: jest.fn,
                        save: jest.fn(),
                        find: jest.fn(),
                        findById: jest.fn(),
                        findByIdAndUpdate: jest.fn(),
                        deleteOne: jest.fn(),
                        populate: jest.fn().mockReturnThis(),
                    },
                },
                {
                    provide: getModelToken(Answer.name),
                    useValue: {
                        new: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<QuestionDbService>(QuestionDbService);
        questionModel = module.get<Model<QuestionDocument>>(getModelToken(Question.name));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findQuestionById', () => {
        it('should return a question if found', async () => {
            jest.spyOn(questionModel, 'findById').mockResolvedValueOnce(mockQuestion);

            const result = await service.findQuestionById('myQuestionId');

            expect(questionModel.findById).toHaveBeenCalledWith('myQuestionId');
            expect(result).toEqual(mockQuestion);
        });

        it('should return null if question is not found', async () => {
            jest.spyOn(questionModel, 'findById').mockResolvedValueOnce(null);

            const result = await service.findQuestionById('GameState.NONExistentId');

            expect(questionModel.findById).toHaveBeenCalledWith('GameState.NONExistentId');
            expect(result).toBeNull();
        });
    });

    describe('createQuestion', () => {
        it('should save a new question successfully', async () => {
            const mockQuestionDto: CreateQuestionDto = {
                _id: 'new_question_id',
                text: 'test_text',
                type: QuestionType.QCM,
                choices: [],
                points: 45,
                date: new Date(),
            };

            const mockQuestionDocument = {
                ...mockQuestionDto,
                _id: 'new_question_id',
            };

            jest.spyOn(questionModel, 'create').mockResolvedValueOnce({
                ...mockQuestionDocument,
                save: jest.fn().mockResolvedValueOnce(mockQuestionDocument),
            } as any);

            await service.createQuestion(mockQuestionDto);

            expect(questionModel.create).toHaveBeenCalledWith(mockQuestionDto);
        });
    });

    it('should generate random questions successfully', async () => {
        const dateGenerated = new Date();
        const allQuestions: Question[] = [
            { _id: '1', type: QuestionType.QCM, text: 'Question 1', choices: [], points: 10, date: dateGenerated },
            { _id: '2', type: QuestionType.QCM, text: 'Question 2', choices: [], points: 10, date: dateGenerated },
            { _id: '3', type: QuestionType.QCM, text: 'Question 3', choices: [], points: 10, date: dateGenerated },
            { _id: '4', type: QuestionType.QCM, text: 'Question 4', choices: [], points: 10, date: dateGenerated },
            { _id: '5', type: QuestionType.QCM, text: 'Question 5', choices: [], points: 10, date: dateGenerated },
        ];
        jest.spyOn(service, 'findAllQuestions').mockResolvedValueOnce(allQuestions);
        const selectedQuestions = await service.generateRandomQuestion();

        expect(selectedQuestions.length).toBe(5);
        selectedQuestions.forEach((question) => {
            expect(allQuestions).toContainEqual(question);
        });
    });

    describe('findAllQuestions', () => {
        it('should return an array of questions', async () => {
            const questions: Question[] = [
                {
                    _id: 'test',
                    type: QuestionType.QCM,
                    points: 10,
                    text: 'Question 1',
                    choices: [{ isCorrect: true, text: 'Choice 1' }],
                    date: new Date(),
                },
                {
                    _id: 'test',
                    type: QuestionType.QCM,
                    points: 10,
                    text: 'Question 2',
                    choices: [{ isCorrect: false, text: 'Choice 2' }],
                    date: new Date(),
                },
            ];
            jest.spyOn(questionModel, 'find').mockReturnValueOnce({
                populate: jest.fn().mockReturnValueOnce({
                    exec: jest.fn().mockResolvedValueOnce(questions),
                }),
            } as any);

            const result = await service.findAllQuestions();
            expect(result).toEqual(questions);
        });
    });

    describe('updateQuestion', () => {
        it('should update a question if found', async () => {
            jest.spyOn(questionModel, 'findByIdAndUpdate').mockResolvedValueOnce(mockQuestion);

            const result = await service.updateQuestion('myQuestionId', usefulQuestionDto);

            expect(questionModel.findByIdAndUpdate).toHaveBeenCalledWith('myQuestionId', usefulQuestionDto, { new: true });
            expect(result).toEqual(mockQuestion);
        });
    });

    describe('deleteQuestion', () => {
        it('should delete a question if found', async () => {
            jest.spyOn(questionModel, 'deleteOne');
            await service.deleteQuestion('myQuestionId');
            expect(questionModel.deleteOne).toHaveBeenCalledWith({ _id: 'myQuestionId' });
        });
    });

    describe('generateRandomQuestion', () => {
        it('should generate random questions successfully', async () => {
            const dateGenerated = new Date();
            const allQuestions: Question[] = [
                { _id: '1', type: QuestionType.QCM, text: 'Question 1', choices: [], points: 10, date: dateGenerated },
                { _id: '2', type: QuestionType.QCM, text: 'Question 2', choices: [], points: 10, date: dateGenerated },
                { _id: '3', type: QuestionType.QCM, text: 'Question 3', choices: [], points: 10, date: dateGenerated },
                { _id: '4', type: QuestionType.QCM, text: 'Question 4', choices: [], points: 10, date: dateGenerated },
                { _id: '5', type: QuestionType.QCM, text: 'Question 5', choices: [], points: 10, date: dateGenerated },
            ];
            jest.spyOn(service, 'findAllQuestions').mockResolvedValueOnce(allQuestions);
            const selectedQuestions = await service.generateRandomQuestion();

            expect(selectedQuestions.length).toBe(5);
            selectedQuestions.forEach((question) => {
                expect(allQuestions).toContainEqual(question);
            });
        });
    });
});
