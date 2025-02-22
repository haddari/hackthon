import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mentorship, MentorshipStatus } from './schemas/mentorship.schema';
import { CareerAdvice } from './schemas/career-advice.schema';
import { AuthService } from '../auth/auth.service';
import { GeminiAIService } from '../ai/gemini.service';
import * as mongoose from 'mongoose';

@Injectable()
export class MentorshipService {
  constructor(
    @InjectModel(Mentorship.name) private mentorshipModel: Model<Mentorship>,
    @InjectModel(CareerAdvice.name) private careerAdviceModel: Model<CareerAdvice>,
    private authService: AuthService,
    private geminiAIService: GeminiAIService,
  ) {}

  async createMentorshipRequest(studentId: string, alumniId: string, goals: string) {
    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(alumniId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const student = await this.authService.findById(studentId);
    const alumni = await this.authService.findById(alumniId);

    if (!student || !alumni) {
      throw new NotFoundException('Student or Alumni not found');
    }

    const existingRequest = await this.mentorshipModel.findOne({
      studentId,
      alumniId,
      status: { $in: [MentorshipStatus.PENDING, MentorshipStatus.ACTIVE] }
    });

    if (existingRequest) {
      throw new BadRequestException('Mentorship request already exists');
    }

    const matchAnalysis = await this.geminiAIService.analyzeMentorshipMatch(
      student,
      alumni,
      goals
    );

    const mentorship = new this.mentorshipModel({
      studentId,
      alumniId,
      studentGoals: goals,
      matchScore: matchAnalysis.score,
      matchReason: matchAnalysis.reason,
      status: MentorshipStatus.PENDING
    });

    await mentorship.save();
    return mentorship;
  }

  async findMentorMatches(studentId: string) {
    const student = await this.authService.findById(studentId);
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get all alumni users
    const alumni = await this.authService.findAlumni();

    // Use Gemini AI to analyze matches
    const matches = await Promise.all(
      alumni.map(async (alumnus) => {
        const analysis = await this.geminiAIService.analyzeMentorshipMatch(
          student,
          alumnus,
          ''
        );

        return {
          alumni: alumnus,
          matchScore: analysis.score,
          matchReason: analysis.reason
        };
      })
    );

    // Sort by match score and return top matches
    return matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);
  }

  async createCareerAdvice(alumniId: string, adviceData: {
    title: string;
    content: string;
  }) {
    const alumni = await this.authService.findById(alumniId);
    if (!alumni) {
      throw new NotFoundException('Alumni not found');
    }

    const aiAnalysis = await this.geminiAIService.analyzeCareerAdvice(
      adviceData.content
    );

    const careerAdvice = new this.careerAdviceModel({
      alumniId,
      title: adviceData.title,
      content: adviceData.content,
      aiGeneratedSummary: aiAnalysis.summary,
      tags: aiAnalysis.tags
    });

    await careerAdvice.save();
    return careerAdvice;
  }

  async getCareerAdvice(filters: {
    tags?: string[];
    alumniId?: string;
    search?: string;
  }) {
    const query: any = {};

    if (filters.tags?.length) {
      query.tags = { $in: filters.tags };
    }

    if (filters.alumniId) {
      query.alumniId = filters.alumniId;
    }

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { content: { $regex: filters.search, $options: 'i' } }
      ];
    }

    return this.careerAdviceModel
      .find(query)
      .populate('alumniId', 'name email')
      .sort({ createdAt: -1 });
  }

  async updateMentorshipStatus(
    mentorshipId: string,
    newStatus: MentorshipStatus,
    userId: string
  ) {
    const mentorship = await this.mentorshipModel.findById(mentorshipId);
    if (!mentorship) {
      throw new NotFoundException('Mentorship not found');
    }

    // Verify that the user is either the student or alumni
    if (
      mentorship.studentId.toString() !== userId &&
      mentorship.alumniId.toString() !== userId
    ) {
      throw new BadRequestException('Unauthorized to update this mentorship');
    }

    mentorship.status = newStatus;
    await mentorship.save();
    return mentorship;
  }
}