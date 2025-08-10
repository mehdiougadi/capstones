import { Question } from '@app/model/database/question';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateQuizDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    title: string;

    @ApiProperty({ required: false })
    @IsArray()
    @IsOptional()
    questionsArray: Question[];

    @ApiProperty()
    lastModification: Date;

    @ApiProperty()
    _id: string;
}
