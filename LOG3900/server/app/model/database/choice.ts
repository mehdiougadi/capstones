import { SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

export class Choice {
    @ApiProperty()
    text: string;

    @ApiProperty()
    isCorrect: boolean;
}

export const choiceSchema = SchemaFactory.createForClass(Choice);
