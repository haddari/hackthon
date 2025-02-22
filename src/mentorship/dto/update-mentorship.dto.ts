import { PartialType } from '@nestjs/mapped-types';
import { CreateMentorshipDto } from './create-mentorship.dto';

export class UpdateMentorshipDto extends PartialType(CreateMentorshipDto) {}
