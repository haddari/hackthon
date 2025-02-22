import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MentorshipController } from './mentorship.controller';
import { MentorshipService } from './mentorship.service';

import { Mentorship, MentorshipSchema } from './schemas/mentorship.schema';
import { CareerAdvice, CareerAdviceSchema } from './schemas/career-advice.schema';
import { AuthModule } from '../auth/auth.module';
import { GeminiAIService } from 'src/ai/gemini.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Mentorship.name, schema: MentorshipSchema },
      { name: CareerAdvice.name, schema: CareerAdviceSchema },
    ]),
    AuthModule,
  ],
  controllers: [MentorshipController],
  providers: [MentorshipService, GeminiAIService],
  exports: [MentorshipService],
})
export class MentorshipModule {}