import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiAIService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    this.genAI = new GoogleGenerativeAI(this.configService.get('GEMINI_API_KEY'));
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async analyzeMentorshipMatch(student: any, alumni: any, goals: string) {
    const prompt = `
      Analyze the compatibility between a student and an alumni mentor:
      
      Student Information:
      - Name: ${student.name}
      - Goals: ${goals}
      
      Alumni Information:
      - Name: ${alumni.name}
      - Experience: ${alumni.experience || 'Not specified'}
      
      Provide:
      1. A compatibility score (0-100)
      2. A brief explanation of why they would be a good match
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the response
    const [scoreText, reason] = text.split('\n');
    const score = parseInt(scoreText.match(/\d+/)[0]);

    return { score, reason };
  }

  async analyzeCareerAdvice(content: string) {
    const prompt = `
      Analyze the following career advice and provide:
      1. A concise summary
      2. Relevant tags (maximum 5)
      3. Key takeaways

      Career Advice:
      "${content}"
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();

    const [summary, tagsSection, takeaways] = analysis.split('\n\n');
    const tags = tagsSection.split(',').map(tag => tag.trim());

    return {
      summary,
      tags: tags.slice(0, 5),
      takeaways
    };
  }
}