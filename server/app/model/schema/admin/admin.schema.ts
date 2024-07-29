import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AdminDocument = Admin & Document;

@Schema({ collection: 'admin' })
export class Admin {
    @Prop()
    password: string;
}

export const adminSchema = SchemaFactory.createForClass(Admin);
