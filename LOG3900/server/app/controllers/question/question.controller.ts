import { ErrorController } from '@app/controllers/error/error.controller';
import { CustomHttpError } from '@app/model/database/custom-http-error';
import { Question } from '@app/model/database/question';
import { CreateQuestionDto } from '@app/model/dto/question/create-question.dto';
import { UpdateQuestionDto } from '@app/model/dto/question/update-question.dto';
import { QuestionService } from '@app/services/question/question.service';
import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Res } from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiCreatedResponse,
    ApiInternalServerErrorResponse,
    ApiNotFoundResponse,
    ApiOkResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
@ApiTags('Question')
@Controller('game/:gameId/question')
export class QuestionController extends ErrorController {
    constructor(private readonly questionService: QuestionService) {
        super();
    }

    @ApiOkResponse({
        description: 'Get all Questions from a specific game',
        type: Question,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails to find the game',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Get('/')
    async findAllQuestion(@Param('gameId') gameId: string, @Res() response: Response) {
        try {
            const allQuestion = await this.questionService.getAllQuestion(gameId, false);
            response.status(HttpStatus.OK).json(allQuestion);
        } catch (error) {
            const errorCode = this.errorCode(error.message);
            response.status(errorCode).send(new CustomHttpError(errorCode, error.message, HttpStatus[errorCode]));
        }
    }

    @ApiOkResponse({
        description: 'Get all questions of a game with the answer for the admin',
        type: Question,
        isArray: true,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails to find the game',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Get('/admin')
    async findAllQuestionForAdmin(@Param('gameId') gameId: string, @Res() response: Response) {
        try {
            const allQuestion = await this.questionService.getAllQuestion(gameId, true);
            response.status(HttpStatus.OK).json(allQuestion);
        } catch (error) {
            const errorCode = this.errorCode(error.message);
            response.status(errorCode).send(new CustomHttpError(errorCode, error.message, HttpStatus[errorCode]));
        }
    }

    @ApiOkResponse({
        description: 'Get a specific question from a game',
        type: Question,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails to find the game or question',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Get(':questionNumber')
    async findQuestion(@Param('gameId') gameId: string, @Param('questionNumber') qstNb: number, @Res() response: Response) {
        try {
            const question = await this.questionService.getQuestion(gameId, qstNb, false);
            response.status(HttpStatus.OK).json(question);
        } catch (error) {
            const errorCode = this.errorCode(error.message);
            response.status(errorCode).send(new CustomHttpError(errorCode, error.message, HttpStatus[errorCode]));
        }
    }

    @ApiOkResponse({
        description: 'Get a questions of a game with the answers for the administrator',
        type: Question,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails to find the game or question',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Get(':questionNumber/admin')
    async findQuestionForAdmin(@Param('gameId') gameId: string, @Param('questionNumber') qstNb: number, @Res() response: Response) {
        try {
            const question = await this.questionService.getQuestion(gameId, qstNb, true);
            response.status(HttpStatus.OK).json(question);
        } catch (error) {
            const errorCode = this.errorCode(error.message);
            response.status(errorCode).send(new CustomHttpError(errorCode, error.message, HttpStatus[errorCode]));
        }
    }

    @ApiCreatedResponse({
        description: 'Add a new question',
    })
    @ApiBadRequestResponse({
        description: 'Return  http status when request try to add a question that does not respect the conditions',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails to find the game',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Post('/')
    async createQuestion(@Param('gameId') gameId: string, @Body() createQuestion: CreateQuestionDto, @Res() response: Response) {
        try {
            await this.questionService.addQuestion(gameId, createQuestion);
            response.status(HttpStatus.CREATED).send();
        } catch (error) {
            const errorCode = this.errorCode(error.message);
            response.status(errorCode).send(new CustomHttpError(errorCode, error.message, HttpStatus[errorCode]));
        }
    }
    // Tout les paramètre sont nécessaire pour cette fonction
    // eslint-disable-next-line max-params
    @ApiOkResponse({
        description: 'Update a question from the game',
        type: Question,
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails to find the game or question',
    })
    @ApiBadRequestResponse({
        description: 'Return  http status when request try to modify a question that does not respect the conditions',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Patch('/:questionNumber')
    async modifyQuestion(
        @Param('gameId') gameId: string,
        @Body() updateQuestionDto: UpdateQuestionDto,
        @Param('questionNumber') qstNb: number,
        @Res() response: Response,
    ) {
        try {
            await this.questionService.modifyQuestion(gameId, qstNb, updateQuestionDto);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            const errorCode = this.errorCode(error.message);
            response.status(errorCode).send(new CustomHttpError(errorCode, error.message, HttpStatus[errorCode]));
        }
    }

    @ApiOkResponse({
        description: 'Delete a question from the game ',
    })
    @ApiNotFoundResponse({
        description: 'Return NOT_FOUND http status when request fails to find the game or question',
    })
    @ApiInternalServerErrorResponse({
        description: 'Return INTERNAL_SERVER_ERROR http status when an error occurred in the server',
    })
    @Delete('/:questionNumber')
    async deleteQuestion(@Param('gameId') gameId: string, @Param('questionNumber') qstNb: number, @Res() response: Response) {
        try {
            await this.questionService.deleteQuestion(gameId, qstNb);
            response.status(HttpStatus.OK).send();
        } catch (error) {
            const errorCode = this.errorCode(error.message);
            response.status(errorCode).send(new CustomHttpError(errorCode, error.message, HttpStatus[errorCode]));
        }
    }
}
