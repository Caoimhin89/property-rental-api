import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from '../property/entities/property.entity';
import { Connection } from '../common/types/types';
import { PaginationInput, SearchResult as SearchResultType } from '../graphql';
import { LoggerService } from '../common/services/logger.service';

export interface ISearchResult {
  propertyId: string;
  similarity: number;
  highlights: string[];
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Property)
    private propertyRepository: Repository<Property>,
    private readonly logger: LoggerService
  ) {}

  async search(
    term: string,
    { first, after, last, before }: PaginationInput = {}
  ): Promise<Connection<ISearchResult>> {
    this.logger.log(`Searching for ${term}`);
    const limit = (first ?? last ?? 10) + 1;
    const isBackward = !!last;
    
    let cursorSimilarity = 1.0;
    if (after) {
      cursorSimilarity = this.decodeCursor(after);
    } else if (before) {
      cursorSimilarity = this.decodeCursor(before);
    }

    const results = await this.propertyRepository.query(
      'SELECT * FROM search_properties($1, $2, $3, $4)',
      [term, cursorSimilarity, limit, isBackward]
    );

    let hasNextPage = false;
    let hasPreviousPage = false;
    const totalCount = results[0]?.total_count ?? 0;

    if (results.length > (first ?? last ?? 10)) {
      if (first) {
        hasNextPage = true;
        results.pop();
      } else if (last) {
        hasPreviousPage = true;
        results.pop();
      }
    }

    const orderedResults = last ? results.reverse() : results;

    const edges = orderedResults.map(result => ({
      cursor: this.encodeCursor(result.similarity),
      node: {
        propertyId: result.property_id,
        similarity: result.similarity,
        highlights: result.highlights
      }
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        startCursor: edges[0]?.cursor,
        endCursor: edges[edges.length - 1]?.cursor
      },
      totalCount
    };
  }

  toGraphQL(searchResult: ISearchResult): SearchResultType {
    return searchResult as unknown as SearchResultType;
  }

  private encodeCursor(similarity: number): string {
    return Buffer.from(similarity.toString()).toString('base64');
  }

  private decodeCursor(cursor: string): number {
    return parseFloat(Buffer.from(cursor, 'base64').toString());
  }
} 