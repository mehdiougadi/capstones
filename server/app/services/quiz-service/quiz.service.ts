import { Answer, AnswerDocument } from '@app/model/database/answer';
import { Question, QuestionDocument } from '@app/model/database/question';
import { Quiz, QuizDocument } from '@app/model/database/quiz';
import { CreateQuizDto } from '@app/model/dto/quiz/create-quiz.dto';
import { UpdateQuizDto } from '@app/model/dto/quiz/update-quiz.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class QuizDbService {
    constructor(
        @InjectModel(Quiz.name) public quizModel: Model<QuizDocument>,
        @InjectModel(Question.name) private questionModel: Model<QuestionDocument>,
        @InjectModel(Answer.name) private answerModel: Model<AnswerDocument>,
    ) {}

    async getAllQuiz(): Promise<Quiz[]> {
        return this.quizModel.find({});
    }

    async getQuiz(neededId: string): Promise<Quiz> {
        return this.quizModel.findOne({ _id: neededId });
    }

    async addQuiz(quizDto: CreateQuizDto): Promise<void> {
        (await this.quizModel.create(quizDto)).save();
    }

    async deleteQuiz(neededId: string): Promise<void> {
        await this.quizModel.deleteOne({
            _id: neededId,
        });
    }

    async updateQuiz(id: string, updateQuizDto: UpdateQuizDto): Promise<Quiz> {
        return this.quizModel.findByIdAndUpdate(id, updateQuizDto, { new: true });
    }

    generateRandomQuiz(questions: Question[]): Quiz {
        const newQuiz = {
            title: 'Mode aléatoire',
            description: 'Ceci est un mode aléatoire',
            questions,
            duration: 20,
            lastModification: new Date(),
        } as Quiz;

        return newQuiz;
    }
}
