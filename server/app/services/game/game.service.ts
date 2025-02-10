import { ErrorType, MAXIMUM_TIME, MINIMUM_TIME, State } from '@app/app.constants';
import { Game, GameDocument } from '@app/model/database/game';
import { Question } from '@app/model/database/question';
import { CreateGameDto } from '@app/model/dto/game/create-game.dto';
import { UpdateGameDto } from '@app/model/dto/game/update-game.dto';
import { QuestionService } from '@app/services/question/question.service';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class GameService {
    constructor(
        @InjectModel(Game.name) public gameModel: Model<GameDocument>,
        private questionService: QuestionService,
    ) {}

    async updateGame(id: string, gameUpdate: UpdateGameDto): Promise<Game> {
        try {
            const game = await this.gameModel.findOne({ id });
            if (game === null) {
                return await Promise.reject(ErrorType.NotFoundModifyGame);
            }
            if ('questions' in gameUpdate) {
                await this.verifyQuestions(gameUpdate.questions);
            }
            if ('title' in gameUpdate) {
                await this.verifyTitle(gameUpdate.title);
            }
            if ('duration' in gameUpdate) {
                await this.verifyDuration(gameUpdate.duration);
            }
            for (const [key, value] of Object.entries(gameUpdate)) {
                game[key] = value;
            }
            game.lastModification = new Date().toISOString();
            await game.save();
            return game;
        } catch (error) {
            return Promise.reject(error ? new Error(error) : new Error(ErrorType.InternalServerError));
        }
    }

    async deleteGame(id: string): Promise<void> {
        try {
            const game = await this.gameModel.deleteOne({ id });
            if (game.deletedCount === 0) {
                throw new Error(ErrorType.NotFoundDeleteGame);
            }
        } catch (error) {
            return Promise.reject(error ? new Error(error) : new Error(ErrorType.InternalServerError));
        }
    }

    async createGame(game: CreateGameDto): Promise<Game> {
        try {
            if ('id' in game) {
                delete game.id;
            }
            await this.verifyDuration(game.duration);
            await this.verifyQuestions(game.questions);
            await this.verifyTitle(game.title);
            game.lastModification = new Date().toISOString();
            game.isVisible = false;
            const saveGame = await this.gameModel.create(game);
            return saveGame;
        } catch (error) {
            return Promise.reject(error ? new Error(error) : new Error(ErrorType.InternalServerError));
        }
    }

    async getAllGames(forAdmin: boolean): Promise<Game[]> {
        if (forAdmin) {
            return await this.gameModel.find().select('-_id -__v');
        }
        return await this.gameModel.find({ isVisible: true }).select('-questions.choices.isCorrect -isVisible -_id -__v');
    }

    async getGame(id: string, state: State): Promise<Game> {
        const game = await this.getGameControl(state, id);
        if (game === null) {
            return await Promise.reject(ErrorType.NotFoundGame);
        }
        return game;
    }
    private async getGameControl(state: State, id: string): Promise<Game> {
        switch (state) {
            case State.AdminPage: {
                return await this.gameModel.findOne({ id }).select('-_id -__v');
            }
            case State.NormalPage: {
                return await this.gameModel.findOne({ id }).select('-_id -__v -questions.choices.isCorrect -isVisible');
            }
            case State.CreateLobby: {
                return await this.gameModel.findOne({ id }).select('-_id -__v -lastModification -isVisible');
            }
            default: {
                return await this.gameModel.findOne({ id }).select('-_id -__v -isVisible');
            }
        }
    }

    private async verifyQuestions(questions: Question[]): Promise<void> {
        let index = 0;
        try {
            if (questions.length === 0) {
                return Promise.reject(ErrorType.BadRequestQuestion);
            }
            for (const question of questions) {
                index += 1;
                await this.questionService.validateQuestion(question);
            }
        } catch (error) {
            return Promise.reject(`Question #${index}: ` + error);
        }
    }
    private async verifyTitle(title: string): Promise<void> {
        const game = await this.gameModel.findOne({ title });
        if (game != null) {
            return Promise.reject(ErrorType.ForbiddenTitle);
        }
    }

    private async verifyDuration(duration: number): Promise<void> {
        if (duration < MINIMUM_TIME || duration > MAXIMUM_TIME) {
            return Promise.reject(ErrorType.BadRequestDurationQuestion);
        }
    }
}
