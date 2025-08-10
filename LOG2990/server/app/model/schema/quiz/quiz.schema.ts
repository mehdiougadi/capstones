import { Question } from '@app/model/schema/question/question.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

@Schema()
export class Quiz extends Document {
    @Prop({ required: true })
    title: string;

    @Prop()
    description: string;

    @Prop()
    lastModification: Date;

    @Prop()
    visible: boolean;

    @Prop({ required: true })
    duration: number;

    @ApiProperty({ type: [Question] })
    @Prop({ required: true })
    questions: Question[];

    @Prop()
    _id: string;
}

export const quizSchema = SchemaFactory.createForClass(Quiz);
