import { Args, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { SearchService, ISearchResult } from './search.service';
import { PaginationInput, Property, SearchResult, SearchResultConnection } from '../graphql';
import { DataLoaderService } from '../data-loader/data-loader.service';

@Resolver(() => SearchResult)
export class SearchResolver {
  constructor(
    private readonly searchService: SearchService,
    private readonly dataLoader: DataLoaderService
  ) {}

  @ResolveField(() => Property)
  async property(@Parent() searchResult: ISearchResult) {
    return this.dataLoader.propertiesLoader.load(searchResult.propertyId);
  }

  @Query(() => SearchResultConnection)
  async search(
    @Args('term') term: string,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    const connection = await this.searchService.search(term, pagination);
    return {
      ...connection,
      edges: connection.edges.map(edge => ({
        ...edge,
        node: this.searchService.toGraphQL(edge.node)
      }))
    };
  }
} 