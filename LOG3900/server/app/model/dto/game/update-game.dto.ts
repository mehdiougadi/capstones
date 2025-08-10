import { MAXIMUM_TIME, MINIMUM_TIME } from '@app/app.constants';
import { Question } from '@app/model/database/question';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
export class UpdateGameDto {
    @ApiProperty({ required: true })
    @IsString()
    id: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    lastModification?: string;

    @ApiProperty({ required: false, minimum: MINIMUM_TIME, maximum: MAXIMUM_TIME })
    @IsOptional()
    @IsNumber()
    @Min(MINIMUM_TIME)
    @Max(MAXIMUM_TIME)
    duration?: number;

    @ApiProperty({ required: false, type: [Question] })
    @IsOptional()
    @IsArray()
    questions?: Question[];

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    isVisible?: boolean;
}
