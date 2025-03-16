export type Connection<T> = {
  edges: Edge<T>[];
  pageInfo: PageInfo;
  totalCount: number;
};

export type Edge<T> = {
  cursor: string;
  node: T;
};


export type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string;
  endCursor: string;
};