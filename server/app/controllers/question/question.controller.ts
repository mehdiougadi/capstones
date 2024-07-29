import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Question } from '@app/model/database/question';
import { CreateQuestionDto } from '@app/model/dto/question/create-question.dto';
import { UpdateQuestionDto } from '@app/model/dto/question/update-question.dto';
import { QuestionDbService } from '@app/services/question-service/question.service';

@ApiTags('question')
@Controller('question')
export class QuestionController {
    constructor(private questionDbService: QuestionDbService) {}

    @Get('/')
    @ApiOkResponse({
        description: 'RETOURNE LA LISTE DE TOUTES LES QUESTIONS DANS LA BANQUE DE QUESTIONS',
        type: [Question],
    })
    async getAllQuestions() {
        return this.questionDbService.findAllQuestions();
    }

    @Get('/:id')
    @ApiOkResponse({
        description: 'RETOURNE UNE QUESTION SPÉCIFIQUE À UN ID IDENTIQUE',
        type: Question,
    })
    async getQuestion(@Param('id') id: string) {
        return this.questionDbService.findQuestionById(id);
    }

    @Post('/')
    @ApiCreatedResponse({
        description: "AJOUT D'UNE QUESTION DANS LA BANQUE DE QUESTIONS",
        type: Question,
    })
    async createQuestion(@Body() createQuestionDto: CreateQuestionDto) {
        await this.questionDbService.createQuestion(createQuestionDto);
        return this.getAllQuestions();
    }

    @Put('/:id')
    @ApiOkResponse({
        description: "MISE À JOUR D'UNE QUESTION SPÉCIFIQUE",
        type: Question,
    })
    async updateQuestion(@Param('id') id: string, @Body() updateQuestionDto: UpdateQuestionDto) {
        return this.questionDbService.updateQuestion(id, updateQuestionDto);
    }

    @Delete('/:id')
    @ApiOkResponse({
        description: "SUPPRESSION D'UNE QUESTION SPÉCIFIQUE À UN ID DANS LA BANQUE DE QUESTION",
    })
    async deleteQuestion(@Param('id') id: string) {
        return this.questionDbService.deleteQuestion(id);
    }
}
