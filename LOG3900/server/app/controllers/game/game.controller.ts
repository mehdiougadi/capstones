import { State } from '@app/app.constants';
import { ErrorController } from '@app/controllers/error/error.controller';
import { CustomHttpError } from '@app/model/database/custom-http-error';
import { Game } from '@app/model/database/game';
import { CreateGameDto } from '@app/model/dto/game/create-game.dto';
import { UpdateGameDto } from '@app/model/dto/game/update-game.dto';
import { GameService } from '@app/services/game/game.service';
import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Res } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('Game')
@Controller('game')
export class GameController extends ErrorController {
    constructor(private readonly gameService: GameService) {
        super();
    }

    @ApiOkResponse({
        description: 'Get all games',
        type: Game,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails to find the games',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Get('/admin')
    async findAllGames(@Res() response: Response) {
        try {
            const allGames = await this.gameService.getAllGames(true);
            response.status(HttpStatus.OK).json(allGames);
        } catch (error) {
            const errorCode = this.errorCode(error.message);
            response.status(errorCode).send(new CustomHttpError(errorCode, error.message, HttpStatus[errorCode]));
        }
    }

    @ApiOkResponse({
        description: 'Get all games visible',
        type: Game,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails to find the games',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Get('/')
    async findAllGamesVisible(@Res() response: Response) {
        try {
            const allGames = await this.gameService.getAllGames(false);
            response.status(HttpStatus.OK).json(allGames);
        } catch (error) {
            const errorCode = this.errorCode(error.message);
            response.status(errorCode).send(new CustomHttpError(errorCode, error.message, HttpStatus[errorCode]));
        }
    }

    @ApiOkResponse({
        description: 'Get a game from its id without the choice attribute isCorrect',
        type: Game,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails to find the game',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Get('/:id')
    async findGame(@Param('id') id: string, @Res() response: Response) {
        try {
            const game = await this.gameService.getGame(id, State.NormalPage);
            response.status(HttpStatus.OK).json(game);
        } catch (error) {
            const errorCode = this.errorCode(error.message);
            response.status(errorCode).send(new CustomHttpError(errorCode, error.message, HttpStatus[errorCode]));
        }
    }

    @ApiOkResponse({
        description: 'Get a game from its id with choice attribute isCorrect',
        type: Game,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails to find the game',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Get('admin/:id')
    async findGameAdmin(@Param('id') id: string, @Res() response: Response) {
        try {
            const game = await this.gameService.getGame(id, State.AdminPage);
            response.status(HttpStatus.OK).json(game);
        } catch (error) {
            const errorCode = this.errorCode(error.message);
            response.status(errorCode).send(new CustomHttpError(errorCode, error.message, HttpStatus[errorCode]));
        }
    }

    @ApiCreatedResponse({
        description: 'Add new game',
    })
    @ApiBadRequestResponse({
        description: 'Return BAD_REQUEST http status when request does not meet the requirements of a new game',
    })
    @ApiForbiddenResponse({
        description: 'Return FORBIDDEN http status when request tries to create a game with the same name',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Post('/')
    async createGame(@Body() createGameDto: CreateGameDto, @Res() response: Response) {
        try {
            await this.gameService.createGame(createGameDto);
            response.status(HttpStatus.CREATED).send();
        } catch (error) {
            const errorCode = this.errorCode(error.message);
            response.status(errorCode).send(new CustomHttpError(errorCode, error.message, HttpStatus[errorCode]));
        }
    }

    @ApiOkResponse({
        description: 'Modify a Game',
        type: Game,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails to find the game',
    })
    @ApiBadRequestResponse({
        description: 'Return BAD_REQUEST http status when request does not meet the requirements of a game',
    })
    @ApiForbiddenResponse({
        description: 'Return FORBIDDEN http status when request tries to modify a game title with an existing one',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Patch(':id')
    async modifyGame(@Param('id') id: string, @Body() updateGameDto: UpdateGameDto, @Res() response: Response) {
        try {
            await this.gameService.updateGame(id, updateGameDto);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            const errorCode = this.errorCode(error.message);
            response.status(errorCode).send(new CustomHttpError(errorCode, error.message, HttpStatus[errorCode]));
        }
    }

    @ApiOkResponse({
        description: 'Delete a Game',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails to find the game',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Delete(':id')
    async deleteGame(@Param('id') id: string, @Res() response: Response) {
        try {
            await this.gameService.deleteGame(id);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            const errorCode = this.errorCode(error.message);
            response.status(errorCode).send(new CustomHttpError(errorCode, error.message, HttpStatus[errorCode]));
        }
    }

    @ApiOkResponse({
        description: 'Export a game as JSON file',
        type: Game,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Post('/export/:id')
    async exportGame(@Param('id') id: string, @Res() response: Response) {
        try {
            const game = await this.gameService.getGame(id, State.Export);
            delete game.isVisible;
            const jsonData = JSON.stringify(game);

            response.setHeader('Content-Type', 'application/json');
            response.setHeader('Content-Disposition', `attachment; filename=${game.title}.json`);

            response.status(HttpStatus.OK).send(jsonData);
        } catch (error) {
            const errorCode = this.errorCode(error.message);
            response.status(errorCode).send(new CustomHttpError(errorCode, error.message, HttpStatus[errorCode]));
        }
    }
}
