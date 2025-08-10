import { CreateHistoryDto } from '@app/model/dto/history/create-history.dto';
import { HistoryService } from '@app/services/history/history.service';
import { Body, Controller, Delete, Get, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiInternalServerErrorResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('History')
@Controller('history')
export class HistoryController {
    constructor(private readonly historyService: HistoryService) {}

    @ApiOkResponse({
        description: 'Create a new history record',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Post('/')
    async addHistory(@Body() createHistoryDto: CreateHistoryDto, @Res() response: Response) {
        try {
            await this.historyService.addHistory(createHistoryDto);
            response.status(HttpStatus.OK).json({ message: 'History created successfully' });
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error creating history' });
        }
    }

    @ApiOkResponse({
        description: 'Get all history records',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Get('/')
    async getAllHistory(@Res() response: Response) {
        try {
            const histories = await this.historyService.getAllHistory();
            response.status(HttpStatus.OK).json(histories);
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error getting histories' });
        }
    }

    @ApiOkResponse({
        description: 'Delete all history records',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Delete('/')
    async deleteAllHistories(@Res() response: Response) {
        try {
            await this.historyService.deleteAllHistories();
            response.status(HttpStatus.OK).json({ message: 'All histories deleted successfully' });
        } catch (error) {
            response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Internal server error deleting histories' });
        }
    }
}
