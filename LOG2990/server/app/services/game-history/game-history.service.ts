import { CreateHistoryDto } from '@app/model/dto/game-history/create-history.dto';
import { GameHistory } from '@app/model/schema/game-history/game-history.shema';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class GameHistoryDbService {
    constructor(@InjectModel(GameHistory.name) private gameHistoryModel: Model<GameHistory>) {}

    async addGameToHistory(newHistory: CreateHistoryDto): Promise<void> {
        await this.gameHistoryModel.create(newHistory);
    }

    async deleteAllHistory(): Promise<boolean> {
        await this.gameHistoryModel.deleteMany({});
        return true;
    }

    async getAllGameHistories(): Promise<GameHistory[]> {
        return this.gameHistoryModel.find().exec();
    }
}
