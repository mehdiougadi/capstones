import { Question, questionSchema } from '@app/model/database/question';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

export type GameDocument = Game & Document;

@Schema()
export class Game {
    @ApiProperty()
    @Prop({
        default() {
            // Retrait du lint pour le underscore car il est obligatoire dans la base de donnée
            // eslint-disable-next-line no-underscore-dangle
            return this._id.toHexString();
        },
    })
    id: string;

    @ApiProperty()
    @Prop({ required: true })
    description: string;

    @ApiProperty()
    @Prop({ required: true })
    title: string;

    @ApiProperty({ required: false })
    @Prop({ required: false })
    lastModification?: string;

    @ApiProperty()
    @Prop({ required: true })
    duration: number;

    @ApiProperty({ type: [Question] })
    @Prop({ required: true, type: () => [questionSchema] })
    questions: Question[];

    @ApiProperty()
    @Prop()
    isVisible: boolean;
}

export const gameSchema = SchemaFactory.createForClass(Game);
