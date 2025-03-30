import { Injectable } from '@nestjs/common';
import { LoggerService } from '../common/services/logger.service';
import OpenAI from 'openai';

@Injectable()
export class LlmService {
  private openai: OpenAI;

  constructor(private readonly logger: LoggerService) {
    this.openai = new OpenAI({
      baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL,
        "X-Title": process.env.SITE_NAME,
      },
    });
  }

  async generatePropertyDescription(propertyDetails: {
    type: string;
    bedrooms: number;
    bathrooms: number;
    amenities: string[];
    location: string;
    nearbyPlaces?: string[];
  }): Promise<string> {
    try {
      const prompt = this.buildPropertyPrompt(propertyDetails);
      
      const completion = await this.openai.chat.completions.create({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          {
            role: "system",
            content: "You are a professional real estate copywriter for a medium to long-term rental company. Create engaging, accurate, and professional property descriptions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
      });

      const description = completion.choices[0].message.content;
      this.logger.debug('Generated property description', 'LlmService', { propertyDetails });

      if (!description) {
        throw new Error('No description generated');
      }
      
      return description;
    } catch (error) {
      this.logger.error('Failed to generate property description', error.stack, 'LlmService');
      throw error;
    }
  }

  private buildPropertyPrompt(propertyDetails: any): string {
    return `Create an engaging property description for a ${propertyDetails.type} with the following details:
    - ${propertyDetails.bedrooms} bedrooms
    - ${propertyDetails.bathrooms} bathrooms
    - Amenities: ${propertyDetails.amenities.join(', ')}
    - Location: ${propertyDetails.location}
    ${propertyDetails.nearbyPlaces ? `- Nearby: ${propertyDetails.nearbyPlaces.join(', ')}` : ''}
    
    Make it professional, engaging, and highlight the key features. Focus on the unique selling points.`;
  }
} 