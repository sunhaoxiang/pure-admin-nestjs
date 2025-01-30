import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common'
import { FastifyReply, FastifyRequest } from 'fastify'
import { WINSTON_MODULE_PROVIDER } from 'nest-winston'
import { Logger } from 'winston'

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const httpContext = host.switchToHttp()

    const request = httpContext.getRequest<FastifyRequest>()
    const response = httpContext.getResponse<FastifyReply>()

    const userAgent = request.headers['user-agent']
    const { ip, method, url } = request

    const statusCode
      = exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR

    const message = exception instanceof Error
      ? exception.message
      : 'Internal server error'

    const data = {
      code: statusCode,
      status: 'error',
      data: {
        message,
        path: request.url,
        stack: exception instanceof Error ? exception.stack : null,
      },
    }

    const userInfo = request.user?.id ? `USER:${request.user?.username}(${request.user?.id})` : 'USER:guest'

    this.logger.error(
      `[${method} › ${url}] ${userInfo} IP:${ip} UA:${userAgent} CODE:${response.statusCode} ERR:${JSON.stringify(data)}`,
    )

    response.status(statusCode).send(data)
  }
}
