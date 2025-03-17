import { Field } from "@nestjs/graphql/dist/decorators/field.decorator";
import { ObjectType } from "@nestjs/graphql/dist/decorators/object-type.decorator";
import { ErrorCode } from "./error-codes";

  @ObjectType('Error')
  export class ApiError {
    @Field()
    code: ErrorCode;
  
    @Field()
    message: string;
  
    @Field({ nullable: true })
    details?: string;
  
    constructor(code: ErrorCode, message: string, details?: string) {
      this.code = code;
      this.message = message;
      this.details = details;
    }
  }