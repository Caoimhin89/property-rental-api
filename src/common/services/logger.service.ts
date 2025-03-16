import { Injectable, ConsoleLogger } from '@nestjs/common';

@Injectable()
export class LoggerService extends ConsoleLogger {
  debug(message: string, context?: string, data?: any) {
    if (data) {
      super.debug(`${message} ${JSON.stringify(data, null, 2)}`, context);
    } else {
      super.debug(message, context);
    }
  }

  log(message: string, context?: string, data?: any) {
    if (data) {
      super.log(`${message} ${JSON.stringify(data, null, 2)}`, context);
    } else {
      super.log(message, context);
    }
  }

  error(message: string, trace?: string, context?: string, data?: any) {
    if (data) {
      super.error(`${message} ${JSON.stringify(data, null, 2)}`, trace, context);
    } else {
      super.error(message, trace, context);
    }
  }
} 