"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const mailer_1 = require("@nestjs-modules/mailer");
let MailService = class MailService {
    mailerService;
    constructor(mailerService) {
        this.mailerService = mailerService;
    }
    async sendWelcomeEmail(email, firstName, password) {
        await this.mailerService.sendMail({
            to: email,
            subject: 'Bienvenue sur HR Nawara - Vos identifiants de connexion',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4f46e5, #2563eb); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Bienvenue sur HR Nawara 🚀</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
            <p style="color: #374151; font-size: 16px;">Bonjour <strong>${firstName}</strong>,</p>
            <p style="color: #374151;">Votre compte a été créé sur la plateforme HR Nawara. Voici vos identifiants de connexion :</p>
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong style="color: #6b7280;">Email :</strong> <span style="color: #4f46e5;">${email}</span></p>
              <p style="margin: 0;"><strong style="color: #6b7280;">Mot de passe temporaire :</strong> <span style="color: #4f46e5; font-size: 18px; font-weight: bold;">${password}</span></p>
            </div>
            <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">⚠️ Pour des raisons de sécurité, veuillez changer votre mot de passe lors de votre première connexion.</p>
            </div>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000/login'}" style="background: linear-gradient(135deg, #4f46e5, #2563eb); color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Se connecter
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
              Cet email a été envoyé automatiquement par la plateforme HR Nawara.<br/>
              Si vous n'êtes pas concerné, veuillez ignorer ce message.
            </p>
          </div>
        </div>
      `,
        });
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService])
], MailService);
//# sourceMappingURL=mail.service.js.map