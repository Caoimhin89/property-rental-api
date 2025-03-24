export class CacheSetEvent {
  constructor(
    public readonly namespace: string,
    public readonly key: string,
    public readonly value: any,
    public readonly ttl?: number,
  ) {}
}

export class CacheInvalidateEvent {
  constructor(
    public readonly namespace: string,
    public readonly pattern: string,
  ) {}
} 