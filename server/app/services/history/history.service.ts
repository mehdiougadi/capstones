import { ErrorType } from '@app/app.constants';
import { History } from '@app/model/database/history';
import { CreateHistoryDto } from '@app/model/dto/history/create-history.dto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class HistoryService {
    constructor(@InjectModel(History.name) public historyModel: Model<History>) {}

    async addHistory(history: CreateHistoryDto): Promise<History> {
        try {
            return await this.historyModel.create(history);
        } catch (error) {
            return Promise.reject(error ? new Error(error) : new Error(ErrorType.InternalServerError));
        }
    }

    async getAllHistory(): Promise<History[]> {
        try {
            const histories = await this.historyModel.find();
            return histories;
        } catch (error) {
            return Promise.reject(new Error(ErrorType.InternalServerError));
        }
    }

    async deleteAllHistories(): Promise<void> {
        try {
            await this.historyModel.deleteMany({});
        } catch (error) {
            return Promise.reject(error ? new Error(error) : new Error(ErrorType.InternalServerError));
        }
    }
}
