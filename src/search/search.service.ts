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

interface SearchCursor {
  similarity: number;
  propertyId: string;
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
    
    let cursor: SearchCursor | null = null;
    if (after) {
      cursor = this.decodeCursor(after);
    } else if (before) {
      cursor = this.decodeCursor(before);
    }

    const results = await this.propertyRepository.query(
      'SELECT * FROM search_properties($1, $2, $3, $4, $5)',
      [
        term, 
        cursor?.similarity ?? 1.0,
        cursor?.propertyId ?? null,
        limit, 
        isBackward
      ]
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
      cursor: this.encodeCursor({
        similarity: result.similarity,
        propertyId: result.property_id
      }),
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

  private encodeCursor(cursor: SearchCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString('base64');
  }

  private decodeCursor(cursor: string): SearchCursor {
    return JSON.parse(Buffer.from(cursor, 'base64').toString());
  }
} 