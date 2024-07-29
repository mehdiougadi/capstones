import { ApiProperty } from '@nestjs/swagger';

export class CreateAnswerDto {
    @ApiProperty()
    text: string;

    @ApiProperty()
    isCorrect: boolean;

    @ApiProperty()
    _id?: string;
}
