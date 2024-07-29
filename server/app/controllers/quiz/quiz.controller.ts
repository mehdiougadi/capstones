import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Quiz } from '@app/model/database/quiz';
import { CreateQuizDto } from '@app/model/dto/quiz/create-quiz.dto';
import { UpdateQuizDto } from '@app/model/dto/quiz/update-quiz.dto';
import { QuizDbService } from '@app/services/quiz-service/quiz.service';

@ApiTags('quiz')
@Controller('quiz')
export class QuizController {
    constructor(private quizDbService: QuizDbService) {}

    @Get('/')
    @ApiOkResponse({
        description: 'Retourne la liste des quizs disponibles',
        type: [Quiz],
    })
    async getAllQuiz() {
        return this.quizDbService.getAllQuiz();
    }

    @Get('/:id')
    @ApiOkResponse({
        description: 'Retourne un quiz par ID',
        type: Quiz,
    })
    async getQuiz(@Param('id') id: string) {
        return this.quizDbService.getQuiz(id);
    }

    @Post('/')
    @ApiCreatedResponse({
        description: 'Crée un nouveau quiz',
        type: Quiz,
    })
    async createQuiz(@Body() createQuizDto: CreateQuizDto) {
        return this.quizDbService.addQuiz(createQuizDto);
    }

    @Delete('/:id')
    @ApiOkResponse({
        description: 'Supprime un quiz par ID',
    })
    async deleteQuiz(@Param('id') id: string) {
        return this.quizDbService.deleteQuiz(id);
    }

    @Put('/:id')
    @ApiOkResponse({
        description: 'Met à jour une quiz par ID',
        type: Quiz,
    })
    async updateQuiz(@Param('id') id: string, @Body() updateQuizDto: UpdateQuizDto) {
        return this.quizDbService.updateQuiz(id, updateQuizDto);
    }
}
