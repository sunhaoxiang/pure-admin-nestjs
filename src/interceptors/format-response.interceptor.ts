import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { FastifyReply } from 'fastify'
import { map, Observable } from 'rxjs'

@Injectable()
export class FormatResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp()
    const response = httpContext.getResponse<FastifyReply>()

    return next.handle().pipe(
      map((data) => {
        return {
          code: response.statusCode,
          status: 'success',
          data,
        }
      }),
    )
  }
}
