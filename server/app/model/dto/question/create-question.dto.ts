import { Answer } from '@app/model/database/answer';
import { QuestionType } from '@common/constant/state';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CreateQuestionDto {
    @ApiProperty()
    type: QuestionType;

    @ApiProperty()
    @IsString()
    text: string;

    @ApiProperty()
    @IsNumber()
    points: number;

    @ApiProperty({ type: [Answer] })
    @IsArray()
    @ValidateNested({ each: true })
    choices: Answer[];

    @ApiProperty()
    @IsString()
    date: Date;

    @ApiProperty()
    @IsOptional()
    @IsString()
    _id: string;
}
