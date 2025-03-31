import { ErrorCode } from "common/errors/error-codes";
import { HttpException, HttpStatus } from "@nestjs/common";

export class PropertyNotFoundException extends HttpException {
    constructor(id: string) {
      super({
        code: ErrorCode.NOT_FOUND,
        message: `Property with ID ${id} not found`,
      }, HttpStatus.NOT_FOUND);
    }
  }
  
  export class PropertyUnauthorizedException extends HttpException {
    constructor() {
      super({
        code: ErrorCode.FORBIDDEN,
        message: 'You are not authorized to modify this property',
      }, HttpStatus.FORBIDDEN);
    }
  }

  export class PropertyUpdateFailedException extends HttpException {
    constructor(id: string) {
      super({
        code: ErrorCode.INTERNAL_ERROR,
        message: `Failed to update property with ID ${id}`,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }