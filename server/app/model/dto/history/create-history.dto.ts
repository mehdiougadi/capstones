import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, Min } from 'class-validator';

export class CreateHistoryDto {
    @ApiProperty({ required: true })
    @IsString()
    gameTitle: string;

    @ApiProperty({ required: true })
    @IsString()
    date: string;

    @ApiProperty({ required: true, minimum: 0 })
    @IsNumber()
    @Min(0)
    numberOfPlayers: number;

    @ApiProperty({ required: true, minimum: 0 })
    @IsNumber()
    @Min(0)
    bestScore: number;
}
