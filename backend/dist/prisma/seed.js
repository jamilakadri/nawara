"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = __importDefault(require("pg"));
const pool = new pg_1.default.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Début du seeding de la base de données avec des données tunisiennes...');
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.feedback.deleteMany();
    await prisma.evaluation.deleteMany();
    await prisma.documentValidation.deleteMany();
    await prisma.aIAnalysisResult.deleteMany();
    await prisma.document.deleteMany();
    await prisma.task.deleteMany();
    await prisma.employeeOnboarding.deleteMany();
    await prisma.taskTemplate.deleteMany();
    await prisma.onboardingStep.deleteMany();
    await prisma.onboardingTemplate.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.position.deleteMany();
    await prisma.department.deleteMany();
    await prisma.user.deleteMany();
    const password = await bcrypt.hash('password123', 10);
    const admin = await prisma.user.create({
        data: { email: 'fatma.benali@smarthr.tn', password, firstName: 'Fatma', lastName: 'Ben Ali', role: client_1.Role.ADMINRH },
    });
    const manager = await prisma.user.create({
        data: { email: 'sami.trabelsi@smarthr.tn', password, firstName: 'Sami', lastName: 'Trabelsi', role: client_1.Role.MANAGER },
    });
    const employeeUser = await prisma.user.create({
        data: { email: 'aymen.khlifi@smarthr.tn', password, firstName: 'Aymen', lastName: 'Khlifi', role: client_1.Role.SALARIE },
    });
    const commercialUser = await prisma.user.create({
        data: { email: 'nour.mansouri@smarthr.tn', password, firstName: 'Nour', lastName: 'Mansouri', role: client_1.Role.SALARIE },
    });
    const designUser = await prisma.user.create({
        data: { email: 'kais.saidi@smarthr.tn', password, firstName: 'Kais', lastName: 'Saidi', role: client_1.Role.SALARIE },
    });
    const itDept = await prisma.department.create({
        data: { name: 'Ingénierie & Tech', description: 'Département technique tunisien', managerId: manager.id },
    });
    const salesDept = await prisma.department.create({
        data: { name: 'Commercial & Ventes', description: 'Développement commercial tunisien', managerId: manager.id },
    });
    await prisma.department.create({
        data: { name: 'Ressources Humaines', description: 'Gestion du personnel et paie', managerId: admin.id },
    });
    const devPosition = await prisma.position.create({
        data: {
            title: 'Développeur Fullstack',
            description: 'Développement d\'applications Web & Mobile',
            requiredSkills: ['React', 'NestJS', 'PostgreSQL'],
            mandatoryDocuments: ['CIN', 'RIB', 'Diplôme', 'Contrat Signé'],
            requiredEquipment: ['PC portable professionnel', 'Écran externe'],
            mandatoryTrainings: ['Sécurité des données', 'Architecture Microservices'],
            standardDurationDays: 180,
            department: { connect: { id: itDept.id } },
        },
    });
    const commercialPosition = await prisma.position.create({
        data: {
            title: 'Commercial',
            description: 'Développement du portefeuille clients en Tunisie et à l\'étranger',
            requiredSkills: ['Négociation', 'CRM', 'Prospection', 'Closing'],
            mandatoryDocuments: ['CIN', 'RIB', 'Diplôme', 'Contrat Signé'],
            requiredEquipment: ['Téléphone professionnel', 'Laptop de fonction'],
            mandatoryTrainings: ['Présentation produit', 'Formation CRM Salesforce'],
            standardDurationDays: 180,
            department: { connect: { id: salesDept.id } },
        },
    });
    const techTemplate = await prisma.onboardingTemplate.create({
        data: { name: 'Onboarding Tech Standard', description: 'Parcours d\'intégration technique', positionId: devPosition.id, isActive: true },
    });
    const ts1 = await prisma.onboardingStep.create({ data: { title: 'Semaine 1 : Administratif', order: 1, templateId: techTemplate.id } });
    const ts2 = await prisma.onboardingStep.create({ data: { title: 'Semaine 2 : Immersion Technique', order: 2, templateId: techTemplate.id } });
    await prisma.taskTemplate.createMany({
        data: [
            { title: 'Signer et uploader le contrat', stepId: ts1.id, defaultAssigneeRole: client_1.Role.SALARIE, priority: client_1.Priority.CRITICAL, daysToComplete: 2 },
            { title: 'Configurer le poste et les accès', stepId: ts1.id, defaultAssigneeRole: client_1.Role.SALARIE, priority: client_1.Priority.HIGH, daysToComplete: 3 },
            { title: "Présentation de l'architecture du projet", stepId: ts2.id, defaultAssigneeRole: client_1.Role.MANAGER, priority: client_1.Priority.HIGH, daysToComplete: 10 },
            { title: 'Premier commit sur le dépôt Git', stepId: ts2.id, defaultAssigneeRole: client_1.Role.SALARIE, priority: client_1.Priority.MEDIUM, daysToComplete: 14 },
        ],
    });
    const commTemplate = await prisma.onboardingTemplate.create({
        data: {
            name: 'Onboarding Commercial 30 jours',
            description: 'Onboarding de départ pour les commerciaux.',
            positionId: commercialPosition.id,
            isActive: true,
        },
    });
    const cp1 = await prisma.onboardingStep.create({ data: { title: 'Phase 1 – Pré-onboarding', order: 1, templateId: commTemplate.id } });
    const cp2 = await prisma.onboardingStep.create({ data: { title: 'Phase 2 – Intégration (J à J+7)', order: 2, templateId: commTemplate.id } });
    const cp3 = await prisma.onboardingStep.create({ data: { title: 'Phase 3 – Montée en compétence', order: 3, templateId: commTemplate.id } });
    const cp4 = await prisma.onboardingStep.create({ data: { title: 'Phase 4 – Validation', order: 4, templateId: commTemplate.id } });
    await prisma.taskTemplate.createMany({
        data: [
            { title: 'Préparer le matériel', stepId: cp1.id, defaultAssigneeRole: client_1.Role.ADMINRH, priority: client_1.Priority.HIGH, daysToComplete: -3 },
            { title: 'Créer les accès (email + CRM)', stepId: cp1.id, defaultAssigneeRole: client_1.Role.ADMINRH, priority: client_1.Priority.CRITICAL, daysToComplete: -2 },
            { title: 'Prendre connaissance de son parcours', stepId: cp1.id, defaultAssigneeRole: client_1.Role.SALARIE, priority: client_1.Priority.MEDIUM, daysToComplete: -1 },
            { title: 'Regarder vidéo de présentation entreprise', stepId: cp2.id, defaultAssigneeRole: client_1.Role.SALARIE, priority: client_1.Priority.HIGH, daysToComplete: 1 },
            { title: 'Formation CRM', stepId: cp2.id, defaultAssigneeRole: client_1.Role.SALARIE, priority: client_1.Priority.CRITICAL, daysToComplete: 2 },
            { title: "Quiz – Compréhension de l'offre", stepId: cp2.id, defaultAssigneeRole: client_1.Role.SALARIE, priority: client_1.Priority.HIGH, daysToComplete: 3 },
            { title: 'Présentation équipe', stepId: cp2.id, defaultAssigneeRole: client_1.Role.MANAGER, priority: client_1.Priority.MEDIUM, daysToComplete: 1 },
            { title: 'Shadowing commercial senior', stepId: cp3.id, defaultAssigneeRole: client_1.Role.MANAGER, priority: client_1.Priority.HIGH, daysToComplete: 5 },
            { title: 'Simulation de pitch', stepId: cp3.id, defaultAssigneeRole: client_1.Role.MANAGER, priority: client_1.Priority.HIGH, daysToComplete: 7 },
            { title: 'Entretien de validation', stepId: cp4.id, defaultAssigneeRole: client_1.Role.MANAGER, priority: client_1.Priority.CRITICAL, daysToComplete: 10 },
        ],
    });
    const empTech = await prisma.employee.create({
        data: { userId: employeeUser.id, departmentId: itDept.id, positionId: devPosition.id, startDate: new Date(Date.now() - 14 * 86400000) },
    });
    const empComm = await prisma.employee.create({
        data: { userId: commercialUser.id, departmentId: salesDept.id, positionId: commercialPosition.id, startDate: new Date() },
    });
    const d = (n) => new Date(Date.now() + n * 86400000);
    const onboardingTech = await prisma.employeeOnboarding.create({
        data: {
            employeeId: empTech.id,
            status: client_1.OnboardingStatus.IN_PROGRESS,
            progress: 40,
            startDate: empTech.startDate,
            trialEndDate: new Date(empTech.startDate.getTime() + 180 * 24 * 60 * 60 * 1000),
        },
    });
    const onboardingComm = await prisma.employeeOnboarding.create({
        data: {
            employeeId: empComm.id,
            status: client_1.OnboardingStatus.NOT_STARTED,
            progress: 0,
            startDate: empComm.startDate,
            trialEndDate: new Date(empComm.startDate.getTime() + 180 * 24 * 60 * 60 * 1000),
        },
    });
    await prisma.task.createMany({
        data: [
            { title: 'Signer et uploader le contrat', onboardingId: onboardingTech.id, assigneeId: employeeUser.id, status: client_1.TaskStatus.VALIDATED, priority: client_1.Priority.CRITICAL, category: client_1.TaskCategory.ADMINISTRATIF, dueDate: d(-12) },
            { title: 'Configurer le poste et les accès', onboardingId: onboardingTech.id, assigneeId: employeeUser.id, status: client_1.TaskStatus.VALIDATED, priority: client_1.Priority.HIGH, category: client_1.TaskCategory.ONBOARDING, dueDate: d(-11) },
            { title: "Présentation de l'architecture du projet", onboardingId: onboardingTech.id, assigneeId: manager.id, status: client_1.TaskStatus.DONE, priority: client_1.Priority.HIGH, category: client_1.TaskCategory.ONBOARDING, dueDate: d(-4) },
            { title: 'Premier commit sur le dépôt Git', onboardingId: onboardingTech.id, assigneeId: employeeUser.id, status: client_1.TaskStatus.IN_PROGRESS, priority: client_1.Priority.MEDIUM, category: client_1.TaskCategory.METIER, dueDate: d(2) },
            { title: 'Valider le module de connexion JWT', onboardingId: onboardingTech.id, assigneeId: employeeUser.id, status: client_1.TaskStatus.TODO, priority: client_1.Priority.CRITICAL, category: client_1.TaskCategory.METIER, dueDate: d(7), createdById: manager.id },
        ],
    });
    await prisma.task.createMany({
        data: [
            { title: 'Préparer le matériel', onboardingId: onboardingComm.id, assigneeId: admin.id, status: client_1.TaskStatus.TODO, priority: client_1.Priority.HIGH, category: client_1.TaskCategory.ADMINISTRATIF, dueDate: d(-3) },
            { title: 'Créer les accès (email + CRM)', onboardingId: onboardingComm.id, assigneeId: admin.id, status: client_1.TaskStatus.TODO, priority: client_1.Priority.CRITICAL, category: client_1.TaskCategory.ADMINISTRATIF, dueDate: d(-2) },
            { title: 'Regarder vidéo de présentation entreprise', onboardingId: onboardingComm.id, assigneeId: commercialUser.id, status: client_1.TaskStatus.TODO, priority: client_1.Priority.HIGH, category: client_1.TaskCategory.ONBOARDING, dueDate: d(1) },
        ],
    });
    await prisma.document.create({
        data: { name: 'Contrat Signé Aymen', type: 'Légal', url: '/uploads/contrat_aymen.pdf', onboardingId: onboardingTech.id, status: client_1.DocumentStatus.VALIDATED },
    });
    console.log('✅ Base de données initialisée avec succès avec des données tunisiennes.');
    console.log('Email admin : fatma.benali@smarthr.tn');
    console.log('Email manager : sami.trabelsi@smarthr.tn');
    console.log('Email employé tech : aymen.khlifi@smarthr.tn');
    console.log('Email commercial : nour.mansouri@smarthr.tn');
    console.log('Mot de passe universel : password123');
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=seed.js.map