import { answerSchema } from '@app/model/schema/answer/answer.schema';
import { QuestionType } from '@common/constant/state';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { Answer } from './answer';

export type QuestionDocument = Question & Document;

@Schema()
export class Question {
    @ApiProperty()
    @Prop({ required: true })
    type: QuestionType;

    @ApiProperty()
    @Prop({ required: true })
    text: string;

    @ApiProperty()
    @Prop({ required: true })
    points: number;

    @ApiProperty({ type: [Answer] })
    @Prop({ type: [answerSchema], required: true, default: [] })
    choices: Answer[];

    @ApiProperty({ required: true })
    @Prop({ required: true })
    date: Date;

    @ApiProperty()
    @Prop()
    _id: string;
}

export const questionSchema = SchemaFactory.createForClass(Question);
