import { AiModule } from './ai/ai.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { DocumentsModule } from './documents/documents.module';
import { TasksModule } from './tasks/tasks.module';
import { EmployeeOnboardingsModule } from './employeeonboardings/employeeonboardings.module';
import { OnboardingTemplatesModule } from './onboardingtemplates/onboardingtemplates.module';
import { EmployeesModule } from './employees/employees.module';
import { PositionsModule } from './positions/positions.module';
import { DepartmentsModule } from './departments/departments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';

@Module({
  imports: [
    AiModule,
    EvaluationsModule,
    DocumentsModule,
    TasksModule,
    EmployeeOnboardingsModule,
    OnboardingTemplatesModule,
    EmployeesModule,
    PositionsModule,
    DepartmentsModule,
    NotificationsModule,
    PrismaModule,
    UsersModule,
    AuthModule,
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
      defaults: {
        from: `"HR Nawara" <${process.env.MAIL_USER}>`,
      },
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}