import { Question, QuestionDocument } from '@app/model/database/question';
import { CreateQuestionDto } from '@app/model/dto/question/create-question.dto';
import { UpdateQuestionDto } from '@app/model/dto/question/update-question.dto';
import { UNIQUE_INDEX } from '@common/constant/constants';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class QuestionDbService {
    randomQuestions: Question[];
    constructor(@InjectModel(Question.name) private questionModel: Model<QuestionDocument>) {}

    async createQuestion(createQuestionDto: CreateQuestionDto): Promise<void> {
        (await this.questionModel.create(createQuestionDto)).save();
    }

    async findAllQuestions(): Promise<Question[]> {
        return this.questionModel.find().populate('choices').exec();
    }

    async findQuestionById(questionId: string): Promise<Question | null> {
        return this.questionModel.findById(questionId);
    }

    async updateQuestion(questionId: string, updateQuestionDto: UpdateQuestionDto): Promise<Question | null> {
        return this.questionModel.findByIdAndUpdate(questionId, updateQuestionDto, { new: true });
    }

    async deleteQuestion(questionId: string) {
        await this.questionModel.deleteOne({ _id: questionId });
    }

    async generateRandomQuestion(): Promise<Question[]> {
        const allQuestions = await this.findAllQuestions();
        const qcmQuestions = allQuestions.filter((question) => question.type === 'QCM');
        this.mixQuestions(qcmQuestions);
        const randomIndexes = this.generateUniqueIndex(qcmQuestions.length, UNIQUE_INDEX);
        const selectedQuestions = randomIndexes.map((index) => qcmQuestions[index]);
        return selectedQuestions;
    }

    private mixQuestions(questions: Question[]): void {
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }
    }

    private generateUniqueIndex(sizeArray: number, numberQuestionSelected: number): number[] {
        const indices = new Set<number>();
        while (indices.size < numberQuestionSelected) {
            const randomIndex = Math.floor(Math.random() * sizeArray);
            indices.add(randomIndex);
        }
        return Array.from(indices);
    }
}
