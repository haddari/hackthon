import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export enum UserType {
  STUDENT = 'student',
  ALUMNI = 'alumni',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: UserType, default: UserType.STUDENT })
  userType: UserType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Role' })
  roleId: mongoose.Types.ObjectId;

  // Additional fields for alumni
  @Prop()
  graduationYear?: number;

  @Prop()
  field?: string;

  @Prop([String])
  expertiseAreas?: string[];

  @Prop()
  currentPosition?: string;

  @Prop()
  company?: string;

  @Prop()
  experience?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);