"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const ai_module_1 = require("./ai/ai.module");
const evaluations_module_1 = require("./evaluations/evaluations.module");
const documents_module_1 = require("./documents/documents.module");
const tasks_module_1 = require("./tasks/tasks.module");
const employeeonboardings_module_1 = require("./employeeonboardings/employeeonboardings.module");
const onboardingtemplates_module_1 = require("./onboardingtemplates/onboardingtemplates.module");
const employees_module_1 = require("./employees/employees.module");
const positions_module_1 = require("./positions/positions.module");
const departments_module_1 = require("./departments/departments.module");
const notifications_module_1 = require("./notifications/notifications.module");
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const apollo_1 = require("@nestjs/apollo");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./prisma/prisma.module");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const mailer_1 = require("@nestjs-modules/mailer");
const path_1 = require("path");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            ai_module_1.AiModule,
            evaluations_module_1.EvaluationsModule,
            documents_module_1.DocumentsModule,
            tasks_module_1.TasksModule,
            employeeonboardings_module_1.EmployeeOnboardingsModule,
            onboardingtemplates_module_1.OnboardingTemplatesModule,
            employees_module_1.EmployeesModule,
            positions_module_1.PositionsModule,
            departments_module_1.DepartmentsModule,
            notifications_module_1.NotificationsModule,
            prisma_module_1.PrismaModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            mailer_1.MailerModule.forRoot({
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
            graphql_1.GraphQLModule.forRoot({
                driver: apollo_1.ApolloDriver,
                autoSchemaFile: (0, path_1.join)(process.cwd(), 'src/schema.gql'),
                sortSchema: true,
                playground: true,
            }),
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map