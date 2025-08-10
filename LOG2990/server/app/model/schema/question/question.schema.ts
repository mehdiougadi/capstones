import { Answer } from '@app/model/schema/answer/answer.schema';
import { QuestionType } from '@common/constant/state';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

@Schema()
export class Question extends Document {
    @ApiProperty()
    @Prop({ required: false })
    type: QuestionType;

    @ApiProperty()
    @Prop({ required: true })
    text: string;

    @ApiProperty()
    @Prop({ required: false })
    points: number;

    @ApiProperty({ type: [Answer] })
    @Prop({ required: true })
    choices: Answer[];

    @ApiProperty()
    @Prop({ required: false })
    date: Date;

    @ApiProperty()
    @Prop()
    _id: string;
}

export const questionSchema = SchemaFactory.createForClass(Question);
