import { QuestionType } from '@app/app.constants';
import { Choice, choiceSchema } from '@app/model/database/choice';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { ValidateIf } from 'class-validator';
import { Document } from 'mongoose';

export type QuestionDocument = Question & Document;
@Schema()
export class Question {
    @ApiProperty({ type: () => [Choice] })
    @Prop({ required: (question: Question) => question.type === QuestionType.QCM, type: () => [choiceSchema] })
    @ValidateIf((question: Question) => question.type === QuestionType.QCM)
    choices?: Choice[];

    @ApiProperty()
    @Prop({ required: true })
    points: number;

    @ApiProperty()
    @Prop({ required: true })
    text: string;

    @ApiProperty()
    @Prop({ required: true, type: () => QuestionType })
    type: QuestionType;
}

export const questionSchema = SchemaFactory.createForClass(Question);
