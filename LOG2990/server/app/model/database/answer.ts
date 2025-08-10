import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type AnswerDocument = Answer & Document;

@Schema()
export class Answer {
    @ApiProperty()
    @Prop({ required: true })
    text: string;

    @ApiProperty()
    @Prop({ required: true })
    isCorrect: boolean;
}

export const courseSchema = SchemaFactory.createForClass(Answer);
