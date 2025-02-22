import { UserType } from '../entities/user.schema';
import mongoose from 'mongoose';

export interface UserResponse {
  _id: string;
  name: string;
  email: string;
  userType?: UserType;
  roleId?: mongoose.Types.ObjectId;
  graduationYear?: number;
  field?: string;
  expertiseAreas?: string[];
  currentPosition?: string;
  company?: string;
  experience?: string;
  createdAt?: Date;
  updatedAt?: Date;
}