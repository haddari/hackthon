import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { MentorshipService } from './mentorship.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('mentorship')
export class MentorshipController {
  constructor(private readonly mentorshipService: MentorshipService) {}

  @UseGuards(JwtAuthGuard)
  @Post('request')
  createMentorshipRequest(@Body() createMentorshipRequestDto: any) {
    const { studentId, alumniId, goals } = createMentorshipRequestDto;
    return this.mentorshipService.createMentorshipRequest(studentId, alumniId, goals);
  }

  @UseGuards(JwtAuthGuard)
  @Get('career-advice')
  getCareerAdvice(@Body() filters: any) {
    return this.mentorshipService.getCareerAdvice(filters);
  }
}