import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, of } from 'rxjs'

@Injectable()
export class ExampleInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()

    // GET 请求或登录请求正常处理
    if (request.method === 'GET' || request.url?.includes('/user/login')) {
      return next.handle()
    }

    // 其他请求返回模拟的成功响应
    return of({
      code: 200,
      data: null,
      status: 'success',
    })
  }
}
