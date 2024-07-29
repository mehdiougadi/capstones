import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAnswerDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    text: string;

    @ApiProperty({ required: false })
    @IsBoolean()
    @IsOptional()
    isCorrect: boolean;

    @ApiProperty()
    @IsString()
    _id?: string;
}
