import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Answer extends Document {
    @Prop({ required: true })
    text: string;

    @Prop({ required: true })
    isCorrect: boolean;
}

export const answerSchema = SchemaFactory.createForClass(Answer);
