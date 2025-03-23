import { Injectable, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

@Injectable()
export class KafkaService {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
  ) {}

  async publish(topic: string, message: any) {
    return this.kafkaClient.emit(topic, message);
  }

  async subscribe(topic: string, callback: (message: any) => Promise<void>) {
    return this.kafkaClient.subscribeToResponseOf(topic);
  }
}