import { GameHistoryDbService } from '@app/services/game-history/game-history.service';
import { Controller, Delete, Get } from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';

@Controller('history')
export class GameHistoryController {
    constructor(private gameHistoryDbService: GameHistoryDbService) {}

    @Get('/')
    @ApiOkResponse({
        description: 'Retourne la liste des anciennes games',
    })
    async getHistory() {
        return this.gameHistoryDbService.getAllGameHistories();
    }

    @Delete('/')
    @ApiOkResponse({
        description: 'Supprime lhisorique',
    })
    async deleteHistory() {
        return this.gameHistoryDbService.deleteAllHistory();
    }
}
