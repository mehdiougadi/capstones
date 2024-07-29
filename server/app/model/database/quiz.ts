import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';
import { Question } from './question';

export type QuizDocument = Quiz & Document;

@Schema()
export class Quiz {
    @ApiProperty()
    @Prop({ required: true })
    title: string;

    @ApiProperty()
    @Prop()
    description: string;

    @ApiProperty()
    @Prop()
    visible: boolean;

    @ApiProperty({ type: [Question] })
    @Prop({ required: true })
    questions: Question[];

    @ApiProperty()
    @Prop()
    duration: number;

    @ApiProperty()
    @Prop()
    lastModification: Date;

    @ApiProperty()
    @Prop()
    _id: string;
}

export const courseSchema = SchemaFactory.createForClass(Quiz);
