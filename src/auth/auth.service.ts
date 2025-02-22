import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { SignupDto } from './dtos/signup.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserType } from '../user/entities/user.schema';
import { Role } from '../roles/schemas/role.schema';
import mongoose, { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from './schemas/refresh-token.schema';
import { v4 as uuidv4 } from 'uuid';
import { nanoid } from 'nanoid';
import { ResetToken } from './schemas/reset-token.schema';
import { MailService } from 'src/services/mail.service';
import { RolesService } from 'src/roles/roles.service';
import { UserResponse } from '../user/interfaces/user-response.interface';
import { Permission } from 'src/roles/dtos/role.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(RefreshToken.name)
    private RefreshTokenModel: Model<RefreshToken>,
    @InjectModel(ResetToken.name)
    private ResetTokenModel: Model<ResetToken>,
    @InjectModel(Role.name)
    private RoleModel: Model<Role>,
    private jwtService: JwtService,
    private mailService: MailService,
    private rolesService: RolesService,
  ) {}

  async signup(signupData: SignupDto) {
    const { email, password, name, roleId } = signupData;

    // Check if email is in use
    const emailInUse = await this.UserModel.findOne({ email });
    if (emailInUse) {
      throw new BadRequestException('Email already in use');
    }

    // Validate roleId
    const roleIdStr: string = roleId.toString();
    if (!mongoose.Types.ObjectId.isValid(roleIdStr)) {
      throw new BadRequestException('Invalid roleId');
    }

    const role = await this.RoleModel.findById(roleIdStr);
    if (!role) {
      throw new BadRequestException('Role not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user document and save in MongoDB
    const createdUser = await this.UserModel.create({
      roleId: roleIdStr,
      name,
      email,
      password: hashedPassword,
    });

    // Return the response with statusCode and user information
    return {
      statusCode: HttpStatus.OK,
      data: createdUser,
    };
  }
  
  async login(credentials: LoginDto) {
    const { email, password } = credentials;
  
    // Find if user exists by email
    const user = await this.UserModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Wrong credentials');
    }
  
    // Compare entered password with existing password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong credentials');
    }
  
    // Generate JWT tokens
    const tokens = await this.generateUserTokens(user._id);
  
    // Return response with statusCode and user information
    return {
      statusCode: HttpStatus.OK,
      userId: user._id,
      ...tokens,
    };
  }



  async changePassword(userId, oldPassword: string, newPassword: string) {
    //Find the user
    const user = await this.UserModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found...');
    }

    //Compare the old password with the password in DB
    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Wrong credentials');
    }

    //Change user's password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = newHashedPassword;
    await user.save();
  }

  async forgotPassword(email: string) {
    //Check that user exists
    const user = await this.UserModel.findOne({ email });

    if (user) {
      //If user exists, generate password reset link
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 1);

      const resetToken = nanoid(64);
      await this.ResetTokenModel.create({
        token: resetToken,
        userId: user._id,
        expiryDate,
      });
      //Send the link to the user by email
      this.mailService.sendPasswordResetEmail(email, resetToken);
    }

    return { message: 'If this user exists, they will receive an email' };
  }

  async resetPassword(newPassword: string, resetToken: string) {
    //Find a valid reset token document
    const token = await this.ResetTokenModel.findOneAndDelete({
      token: resetToken,
      expiryDate: { $gte: new Date() },
    });

    if (!token) {
      throw new UnauthorizedException('Invalid link');
    }

    //Change user password (MAKE SURE TO HASH!!)
    const user = await this.UserModel.findById(token.userId);
    if (!user) {
      throw new InternalServerErrorException();
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
  }

  async refreshTokens(refreshToken: string) {
    const token = await this.RefreshTokenModel.findOne({
      token: refreshToken,
      expiryDate: { $gte: new Date() },
    });

    if (!token) {
      throw new UnauthorizedException('Refresh Token is invalid');
    }
    return this.generateUserTokens(token.userId);
  }

  async generateUserTokens(userId) {
    const accessToken = this.jwtService.sign({ userId }, { expiresIn: '10h' });
    const refreshToken = uuidv4();

    await this.storeRefreshToken(refreshToken, userId);
    return {
      accessToken,
      refreshToken,
    };
  }

  async storeRefreshToken(token: string, userId: string) {
    // Calculate expiry date 3 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);

    await this.RefreshTokenModel.updateOne(
      { userId },
      { $set: { expiryDate, token } },
      {
        upsert: true,
      },
    );
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = await this.UserModel.findById(userId).populate('roleId').exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const role = await this.RoleModel.findById(user.roleId).exec();
    if (!role) {
      throw new ForbiddenException('Role not found');
    }

    return role.permissions;
  }
  async findById(userId: string): Promise<UserResponse> {
    try {
      const user = await this.UserModel.findById(userId)
        .select('-password')
        .lean<UserResponse>();
  
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
  
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof mongoose.Error.CastError) {
        throw new BadRequestException('Invalid user ID format');
      }
      throw new InternalServerErrorException('Error finding user');
    }
  }
  

  async findAlumni(options: {
    field?: string;
    expertiseAreas?: string[];
    graduationYear?: number;
    limit?: number;
    skip?: number;
  } = {}): Promise<User[]> {
    try {
      const query = this.UserModel.find({ userType: UserType.ALUMNI })
        .select('-password') // Exclude password from results
        .lean();

      // Add filters if provided
      if (options.field) {
        query.where('field').equals(options.field);
      }

      if (options.expertiseAreas && options.expertiseAreas.length > 0) {
        query.where('expertiseAreas').in(options.expertiseAreas);
      }

      if (options.graduationYear) {
        query.where('graduationYear').equals(options.graduationYear);
      }

      // Add pagination
      if (options.skip) {
        query.skip(options.skip);
      }

      if (options.limit) {
        query.limit(options.limit);
      }

      // Sort by most recent graduates first
      query.sort({ graduationYear: -1 });

      const alumni = await query.exec();

      return alumni;
    } catch (error) {
      throw new InternalServerErrorException('Error finding alumni');
    }
  }

  async countAlumni(filters: {
    field?: string;
    expertiseAreas?: string[];
    graduationYear?: number;
  } = {}): Promise<number> {
    try {
      const query: any = { userType: UserType.ALUMNI };

      if (filters.field) {
        query.field = filters.field;
      }

      if (filters.expertiseAreas && filters.expertiseAreas.length > 0) {
        query.expertiseAreas = { $in: filters.expertiseAreas };
      }

      if (filters.graduationYear) {
        query.graduationYear = filters.graduationYear;
      }

      return await this.UserModel.countDocuments(query);
    } catch (error) {
      throw new InternalServerErrorException('Error counting alumni');
    }
  }

  // Helper method to update user type to alumni
  async promoteToAlumni(userId: string, alumniData: {
    graduationYear: number;
    field: string;
    expertiseAreas: string[];
    currentPosition: string;
    company: string;
    experience: string;
  }): Promise<UserResponse> {
    try {
      const user = await this.UserModel.findById(userId);
  
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
  
      user.userType = UserType.ALUMNI;
      user.graduationYear = alumniData.graduationYear;
      user.field = alumniData.field;
      user.expertiseAreas = alumniData.expertiseAreas;
      user.currentPosition = alumniData.currentPosition;
      user.company = alumniData.company;
      user.experience = alumniData.experience;
  
      await user.save();
  
      const userObject = user.toObject();
      const { password, ...result } = userObject;
      return result as UserResponse;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error promoting user to alumni');
    }
  }
}
