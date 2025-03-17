import { ApiError } from "common/errors/api-error";
import { ErrorCode } from "common/errors/error-codes";
import { Injectable } from "@nestjs/common";
import { CallHandler, ExecutionContext, NestInterceptor } from "@nestjs/common";
import { Observable, of } from "rxjs";
import { catchError } from "rxjs/operators";
import { HttpException } from "@nestjs/common";

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(error => {
        if (error instanceof HttpException) {
          const response = error.getResponse() as { code: ErrorCode; message: string; details?: string };
          return of(new ApiError(
            response.code,
            response.message,
            response.details
          ));
        }
        return of(new ApiError(
          ErrorCode.INTERNAL_ERROR,
          'An unexpected error occurred'
        ));
      })
    );
  }
}