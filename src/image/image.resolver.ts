import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { ImageService } from './image.service';
import { CreateImageInput, Image, ImageConnection, PaginationInput } from '../graphql';

@Resolver(() => Image)
export class ImageResolver {
  constructor(private readonly imageService: ImageService) {}

  @Query(() => Image)
  async image(@Args('id') id: string): Promise<Image | null> {
    const image = await this.imageService.findById(id);
    return image ? this.imageService.toGraphQL(image) : null;
  }

  @Query(() => ImageConnection)
  async propertyImages(
    @Args('propertyId') propertyId: string,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<ImageConnection> {
    const connection = await this.imageService.findByPropertyId(propertyId, pagination);
    return {
      edges: connection.edges.map(edge => ({
        cursor: edge.cursor,
        node: this.imageService.toGraphQL(edge.node),
      })),
      pageInfo: connection.pageInfo,
      totalCount: connection.totalCount,
    };
  }

  // MUTATIONS
  @Mutation(() => Image)
  async createImage(@Args('input') input: CreateImageInput): Promise<Image> {
    const image = await this.imageService.create(input.propertyId, {
      url: input.url,
      ...(input.caption && { caption: input.caption }),
    });
    return this.imageService.toGraphQL(image);
  }
} 