import { Test, TestingModule } from '@nestjs/testing';
import { MentorshipController } from './mentorship.controller';
import { MentorshipService } from './mentorship.service';

describe('MentorshipController', () => {
  let controller: MentorshipController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MentorshipController],
      providers: [MentorshipService],
    }).compile();

    controller = module.get<MentorshipController>(MentorshipController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
