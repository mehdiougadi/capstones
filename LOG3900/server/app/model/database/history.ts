import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type HistoryDocument = History & Document;

@Schema()
export class History {
    @ApiProperty()
    @Prop({ required: true })
    gameTitle: string;

    @ApiProperty()
    @Prop({ required: true })
    date: string;

    @ApiProperty()
    @Prop({ required: true })
    numberOfPlayers: number;

    @ApiProperty()
    @Prop({ required: true })
    bestScore: number;
}

export const historySchema = SchemaFactory.createForClass(History);
