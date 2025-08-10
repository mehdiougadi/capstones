import { Question } from '@app/model/database/question';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateQuizDto {
    @ApiProperty()
    @IsString()
    title: string;

    @ApiProperty()
    @IsString()
    description: string;

    @ApiProperty()
    @IsArray()
    questions: Question[];

    @ApiProperty()
    @IsNumber()
    duration: number;

    @ApiProperty()
    @IsString()
    _id: string;

    @ApiProperty()
    lastModification: Date;

    @ApiProperty()
    @IsBoolean()
    visible: boolean;
}
