import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PropertyDescriptionInput } from '../graphql';
import { LlmService } from './llm.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Resolver()
export class LlmResolver {
  constructor(private readonly llmService: LlmService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Mutation(() => String)
  async generatePropertyDescription(
    @Args('propertyId') propertyId: string,
    @Args('details') details: PropertyDescriptionInput
  ): Promise<string> {
    console.log('Generating property description');
    return this.llmService.generatePropertyDescription({
        ...details,
        nearbyPlaces: details.nearbyPlaces || [],
    });
  }
} 