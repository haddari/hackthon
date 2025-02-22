import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Put,
} from '@nestjs/common';
import { MentorshipService } from './mentorship.service';
import { MentorshipStatus } from './schemas/mentorship.schema';
import { AuthGuard } from '@nestjs/passport';

@Controller('mentorship')
@UseGuards(AuthGuard)
export class MentorshipController {
  constructor(private readonly mentorshipService: MentorshipService) {}

  @Post('request')
  createMentorshipRequest(
    @Body() data: { studentId: string; alumniId: string; goals: string }
  ) {
    return this.mentorshipService.createMentorshipRequest(
      data.studentId,
      data.alumniId,
      data.goals
    );
  }

  @Get('matches/:studentId')
  findMentorMatches(@Param('studentId') studentId: string) {
    return this.mentorshipService.findMentorMatches(studentId);
  }

  @Post('career-advice')
  createCareerAdvice(
    @Body() data: { alumniId: string; title: string; content: string }
  ) {
    return this.mentorshipService.createCareerAdvice(data.alumniId, {
      title: data.title,
      content: data.content,
    });
  }

  @Get('career-advice')
  getCareerAdvice(
    @Query('tags') tags?: string[],
    @Query('alumniId') alumniId?: string,
    @Query('search') search?: string
  ) {
    return this.mentorshipService.getCareerAdvice({ tags, alumniId, search });
  }

  @Put('status/:mentorshipId')
  updateMentorshipStatus(
    @Param('mentorshipId') mentorshipId: string,
    @Body() data: { status: MentorshipStatus; userId: string }
  ) {
    return this.mentorshipService.updateMentorshipStatus(
      mentorshipId,
      data.status,
      data.userId
    );
  }
}