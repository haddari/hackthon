import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export enum MentorshipStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}

@Schema({ timestamps: true })
export class Mentorship extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  studentId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  alumniId: mongoose.Types.ObjectId;

  @Prop()
  matchScore: number;

  @Prop()
  matchReason: string;

  @Prop({ enum: MentorshipStatus, default: MentorshipStatus.PENDING })
  status: MentorshipStatus;

  @Prop()
  studentGoals: string;

  @Prop()
  alumniExpertise: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const MentorshipSchema = SchemaFactory.createForClass(Mentorship);