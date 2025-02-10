import { ErrorType, POINTS_MAX, POINTS_MIN, QuestionType, STEP } from '@app/app.constants';
import { Choice } from '@app/model/database/choice';
import { Game, GameDocument } from '@app/model/database/game';
import { Question } from '@app/model/database/question';
import { CreateQuestionDto } from '@app/model/dto/question/create-question.dto';
import { UpdateQuestionDto } from '@app/model/dto/question/update-question.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class QuestionService {
    constructor(@InjectModel(Game.name) public gameModel: Model<GameDocument>) {}
    async addQuestion(gameId: string, question: CreateQuestionDto): Promise<void> {
        try {
            await this.validateQuestion(question);
            const game = await this.gameModel.findOne({ id: gameId });
            game.questions.push(question);
            await this.saveQuestionChange(game);
        } catch (error) {
            return Promise.reject(error ? new Error(error) : new Error(ErrorType.InternalServerError));
        }
    }

    async modifyQuestion(gameId: string, questionIndex: number, question: UpdateQuestionDto): Promise<void> {
        try {
            const game = await this.gameModel.findOne({ id: gameId });
            if (!game) {
                return await Promise.reject(ErrorType.NotFoundGame);
            }
            if ('choices' in question) {
                await this.validateChoice(question.choices);
            }
            if ('points' in question) {
                await this.validatePoints(question.points);
            }
            for (const [key, value] of Object.entries(question)) {
                game.questions[questionIndex][key] = value;
            }
            if ('type' in question) {
                if (game.questions[questionIndex].type === QuestionType.QRL) {
                    delete game.questions[questionIndex].choices;
                }
            }
            await this.saveQuestionChange(game);
        } catch (error) {
            return Promise.reject(error ? new Error(error) : new Error(ErrorType.InternalServerError));
        }
    }

    async deleteQuestion(gameId: string, questionIndex: number): Promise<void> {
        try {
            const game = await this.gameModel.findOne({ id: gameId });
            await this.validateIndexWithArray(game.questions, questionIndex);
            if (game.questions.length === 1) {
                return await Promise.reject(ErrorType.ForbiddenDeleteQuestion);
            }
            game.questions.splice(questionIndex, 1);
            await this.saveQuestionChange(game);
        } catch (error) {
            return Promise.reject(error ? new Error(error) : new Error(ErrorType.InternalServerError));
        }
    }

    async getQuestion(gameId: string, questionIndex: number, withAnswer: boolean): Promise<Question> {
        try {
            const game = await this.getTypeGame(withAnswer, gameId);
            await this.validateIndexWithArray(game.questions, questionIndex);
            return game.questions[questionIndex];
        } catch (error) {
            return Promise.reject(new Error(ErrorType.NotFoundQuestion));
        }
    }

    async getAllQuestion(gameId: string, forAdmin: boolean): Promise<Question[]> {
        try {
            const game = await this.getTypeGame(forAdmin, gameId);
            return game.questions;
        } catch (error) {
            return Promise.reject(new Error(ErrorType.NotFoundQuestions));
        }
    }

    async validateQuestion(question: Question): Promise<void> {
        try {
            await this.validatePoints(question.points);
            if (question.type === QuestionType.QCM) await this.validateChoice(question.choices);
        } catch (error) {
            return Promise.reject(error);
        }
    }

    private async validateChoice(choices: Choice[]): Promise<void> {
        let counter = 0;
        for (const choice of choices) {
            if (choice.isCorrect) {
                counter += 1;
            }
        }
        if (counter === 0 || counter === choices.length) {
            return Promise.reject(ErrorType.BadRequestChoice);
        }
    }

    private async validatePoints(points: number): Promise<void> {
        if (!(points % STEP === 0 && points >= POINTS_MIN && points <= POINTS_MAX)) {
            return Promise.reject(ErrorType.BadRequestPoints);
        }
    }

    private async validateIndexWithArray(questions: CreateQuestionDto[], index: number): Promise<void> {
        if (!(index < questions.length && index >= 0)) {
            return Promise.reject(ErrorType.BadRequestIndexQuestion);
        }
    }

    private async saveQuestionChange(game: GameDocument): Promise<void> {
        game.markModified('questions');
        game.lastModification = new Date().toISOString();
        await game.save();
    }

    private async getTypeGame(withAnswer: boolean, id: string): Promise<Game> {
        if (withAnswer) {
            return await this.gameModel.findOne({ id });
        }
        return await this.gameModel.findOne({ id }).select('-questions.choices.isCorrect');
    }
}
