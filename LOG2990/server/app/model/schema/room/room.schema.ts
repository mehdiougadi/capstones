import { Quiz } from '@app/model/schema/quiz/quiz.schema';
import { Player } from '@common/classes/player';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

@Schema()
export class Room extends Document {
    @ApiProperty()
    @Prop()
    _id: string;

    @ApiProperty()
    @Prop()
    accessCode: string;

    @ApiProperty()
    @Prop()
    quiz: Quiz;

    @ApiProperty()
    @Prop()
    listPlayers: Player[];
}

export const roomSchema = SchemaFactory.createForClass(Room);
