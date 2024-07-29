import { Answer, AnswerDocument } from '@app/model/database/answer';
import { CreateAnswerDto } from '@app/model/dto/answer/create-answer.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class AnswerDbService {
    constructor(@InjectModel(Answer.name) private answerModel: Model<AnswerDocument>) {}

    async createAnswer(createAnswerDto: CreateAnswerDto): Promise<Answer> {
        return this.answerModel.create(createAnswerDto);
    }

    async findAllAnswers(): Promise<Answer[]> {
        return this.answerModel.find({});
    }

    async findAnswerById(answerId: string): Promise<Answer | null> {
        return this.answerModel.findById(answerId);
    }

    async updateAnswer(answerId: string, updateAnswerDto: CreateAnswerDto): Promise<Answer | null> {
        return this.answerModel.findByIdAndUpdate(answerId, updateAnswerDto, { new: true });
    }

    async deleteAnswer(answerId: string): Promise<void> {
        await this.answerModel.deleteOne({ _id: answerId });
    }
}
