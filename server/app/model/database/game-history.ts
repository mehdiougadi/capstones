import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type GameHistoryDocument = GameHistory & Document;

@Schema({ timestamps: true })
export class GameHistory extends Document {
    @ApiProperty()
    @Prop({ required: true })
    quizName: string;

    @ApiProperty()
    @Prop({ required: true })
    startTime: Date;

    @ApiProperty()
    @Prop({ required: true })
    playerCount: number;

    @ApiProperty()
    @Prop({ required: true })
    topScore: number;
}

export const gameHistorySchema = SchemaFactory.createForClass(GameHistory);
