import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  providers: [UsersResolver, UsersService],
  exports: [UsersService],
})
export class UsersModule {}