import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsNumber, IsString } from 'class-validator';

export class CreateHistoryDto {
    @ApiProperty()
    @IsString()
    quizName: string;

    @ApiProperty()
    @IsNumber()
    playerCount: number;

    @ApiProperty()
    @IsNumber()
    topScore: number;

    @ApiProperty()
    @IsDate()
    startTime: Date;
}
