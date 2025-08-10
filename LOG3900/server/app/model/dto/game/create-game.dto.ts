import { MAXIMUM_TIME, MINIMUM_TIME } from '@app/app.constants';
import { Question } from '@app/model/database/question';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
export class CreateGameDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    id?: string;

    @ApiProperty({ required: true })
    @IsString()
    title: string;

    @ApiProperty({ required: true })
    @IsString()
    description: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    lastModification?: string;

    @ApiProperty({ required: true, minimum: MINIMUM_TIME, maximum: MAXIMUM_TIME })
    @IsNumber()
    @Min(MINIMUM_TIME)
    @Max(MAXIMUM_TIME)
    duration: number;

    @ApiProperty({ required: true, type: [Question] })
    questions: Question[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isVisible: boolean;
}
