import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Permission } from '../dtos/role.dto';

export type RoleDocument = Role & Document;

@Schema()
export class Role {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: [{ resource: String, actions: [String] }] })
  permissions: Permission[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);