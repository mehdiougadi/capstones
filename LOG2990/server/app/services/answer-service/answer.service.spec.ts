import { Answer, AnswerDocument } from '@app/model/database/answer';
import { CreateAnswerDto } from '@app/model/dto/answer/create-answer.dto';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { AnswerDbService } from './answer.service';

const mockAnswerId = 'myAnswerId';
const myAnswer: Answer = new Answer();
myAnswer.text = 'Sample answer';
myAnswer.isCorrect = true;

const updateAnswerDto: CreateAnswerDto = {
    text: 'Updated answer',
    isCorrect: false,
};

const updatedAnswer: Answer = {
    text: updateAnswerDto.text,
    isCorrect: updateAnswerDto.isCorrect,
};

describe('AnswerDbService', () => {
    let service: AnswerDbService;
    let answerModel: Model<AnswerDocument>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AnswerDbService,
                {
                    provide: getModelToken(Answer.name),
                    useValue: {
                        new: jest.fn(),
                        save: jest.fn(),
                        create: jest.fn(),
                        find: jest.fn(),
                        findById: jest.fn(),
                        findByIdAndUpdate: jest.fn(),
                        deleteOne: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AnswerDbService>(AnswerDbService);
        answerModel = module.get<Model<AnswerDocument>>(getModelToken(Answer.name));
    });

    describe('createAnswer', () => {
        it('should create answers', async () => {
            service.createAnswer(updateAnswerDto);
            expect(answerModel.create).toHaveBeenCalled();
        });
    });

    describe('findAllAnswers', () => {
        it('should find all answers', async () => {
            const mockAnswers: Answer[] = [
                { text: 'Answer 1', isCorrect: true },
                { text: 'Answer 2', isCorrect: false },
            ];

            jest.spyOn(answerModel, 'find').mockResolvedValueOnce(mockAnswers);
            const result = await service.findAllAnswers();

            expect(answerModel.find).toHaveBeenCalledWith({});
            expect(result).toEqual(mockAnswers);
        });
    });

    describe('findAnswerById', () => {
        it('should return an answer if found', async () => {
            jest.spyOn(answerModel, 'findById').mockResolvedValueOnce(mockAnswerId);
            const result = await service.findAnswerById(mockAnswerId);

            expect(answerModel.findById).toHaveBeenCalledWith(mockAnswerId);
            expect(result).toEqual(mockAnswerId);
        });

        it('should return null if answer is not found', async () => {
            jest.spyOn(answerModel, 'findById').mockResolvedValueOnce(null);
            const result = await service.findAnswerById(mockAnswerId);

            expect(answerModel.findById).toHaveBeenCalledWith(mockAnswerId);
            expect(result).toBeNull();
        });
    });

    describe('updateAnswer', () => {
        it('should update an answer if found', async () => {
            jest.spyOn(answerModel, 'findByIdAndUpdate').mockResolvedValueOnce(updatedAnswer);
            const result = await service.updateAnswer(mockAnswerId, updateAnswerDto);

            expect(answerModel.findByIdAndUpdate).toHaveBeenCalledWith(mockAnswerId, updateAnswerDto, { new: true });
            expect(result).toEqual(updatedAnswer);
        });
    });

    describe('deleteAnswer', () => {
        it('should delete an answer if found', async () => {
            const deleteResult = {
                acknowledged: true,
                deletedCount: 1,
            };
            jest.spyOn(answerModel, 'deleteOne').mockResolvedValueOnce(deleteResult);
            await service.deleteAnswer(mockAnswerId);

            expect(answerModel.deleteOne).toHaveBeenCalledWith({ _id: mockAnswerId });
        });
    });
});
