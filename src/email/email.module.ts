import { Global, Module } from '@nestjs/common';

import { EmailController } from './email.controller';
import { EmailService } from './email.service';

@Global()
@Module({
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
