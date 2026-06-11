import { MailerService } from '@nestjs-modules/mailer';
export declare class MailService {
    private mailerService;
    constructor(mailerService: MailerService);
    sendWelcomeEmail(email: string, firstName: string, password: string): Promise<void>;
}
