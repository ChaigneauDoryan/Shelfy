
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class DebugInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    console.log('--- [DebugInterceptor] Incoming Request ---');
    console.log(`[${request.method}] ${request.url}`);
    console.log('Headers:', JSON.stringify(request.headers, null, 2));
    console.log('------------------------------------------');

    return next
      .handle()
      .pipe(
        tap(() => console.log(`--- [DebugInterceptor] Response Sent ---`)),
      );
  }
}
