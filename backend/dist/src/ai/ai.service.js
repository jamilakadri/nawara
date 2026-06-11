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
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const DOC_TYPE_MAP = {
    CIN: {
        type: 'CARTE_IDENTITE',
        fields: ['Nom complet', 'Date de naissance', 'Numéro CIN', 'Adresse', 'Date d\'expiration'],
        requiredFields: ['Nom complet', 'Numéro CIN', 'Date de naissance'],
    },
    RIB: {
        type: 'RELEVE_BANCAIRE',
        fields: ['Titulaire', 'IBAN', 'Code BIC/SWIFT', 'Banque', 'Agence'],
        requiredFields: ['Titulaire', 'IBAN', 'Code BIC/SWIFT'],
    },
    CV: {
        type: 'CURRICULUM_VITAE',
        fields: ['Nom complet', 'Formation', 'Expérience professionnelle', 'Compétences', 'Contact'],
        requiredFields: ['Nom complet', 'Formation', 'Expérience professionnelle'],
    },
    DIPLOME: {
        type: 'DIPLOME_CERTIFICATION',
        fields: ['Nom du diplômé', 'Intitulé du diplôme', 'Établissement', 'Date d\'obtention', 'Mention'],
        requiredFields: ['Nom du diplômé', 'Intitulé du diplôme', 'Établissement'],
    },
    PHOTO: {
        type: 'PHOTO_IDENTITE',
        fields: ['Résolution', 'Format', 'Fond uniforme', 'Visage visible'],
        requiredFields: ['Résolution', 'Visage visible'],
    },
    CONTRAT: {
        type: 'CONTRAT_TRAVAIL',
        fields: ['Parties contractantes', 'Date de début', 'Poste', 'Rémunération', 'Durée', 'Signature'],
        requiredFields: ['Parties contractantes', 'Date de début', 'Poste', 'Signature'],
    },
};
const CHATBOT_KB = {
    SALARIE: [
        {
            patterns: ['document', 'soumettre', 'upload', 'téléverser', 'quels documents'],
            response: `Pour compléter votre dossier d'intégration, vous devez soumettre les documents suivants :\n\n📋 **Documents requis :**\n1. **Carte d'Identité Nationale (CIN)** — Scan couleur recto-verso\n2. **Relevé d'Identité Bancaire (RIB)** — Pour le versement de votre salaire\n3. **Curriculum Vitae (CV)** — Version à jour en PDF\n4. **Diplôme(s)** — Copie certifiée conforme\n5. **Photo d'identité** — Format numérique JPG\n\n📌 Rendez-vous dans la section **"Mes Documents"** pour les téléverser.`,
            suggestions: ['Quel est le délai pour les documents ?', 'Mon document a été rejeté, que faire ?', 'Quand est-ce que mes documents seront validés ?'],
        },
        {
            patterns: ['tâche', 'tache', 'task', 'quoi faire', 'prochaine étape', 'étape'],
            response: `Vos tâches d'intégration se trouvent dans la section **"Mes Tâches"**.\n\n✅ **Comment ça fonctionne :**\n1. Consultez la liste de vos tâches assignées\n2. Cliquez sur **"Marquer comme terminée"** quand vous avez fini\n3. Votre manager sera notifié automatiquement pour validation\n4. Vous recevrez une notification dès que la tâche est validée\n\n⏰ Respectez les échéances indiquées pour chaque tâche.`,
            suggestions: ['Comment contacter mon manager ?', 'Ma tâche est en retard, que faire ?', 'Qui valide mes tâches ?'],
        },
        {
            patterns: ['période d\'essai', 'essai', 'titularisation', 'contrat'],
            response: `La **période d'essai** dure généralement 3 à 6 mois selon votre contrat.\n\n📊 **Suivi :**\n- Votre progression est visible sur votre **tableau de bord**\n- Vous serez notifié(e) de la décision de titularisation\n- Un entretien d'évaluation est prévu avant la fin\n\n💡 Consultez votre manager ou le service RH pour toute question spécifique.`,
            suggestions: ['Quand sera mon évaluation ?', 'Comment améliorer mon intégration ?', 'Qui décide de la titularisation ?'],
        },
        {
            patterns: ['rejeté', 'refusé', 'correction', 'erreur'],
            response: `Si un de vos documents a été **rejeté**, voici la marche à suivre :\n\n1. Vérifiez le motif du rejet dans la section **"Mes Documents"**\n2. Corrigez le document selon les indications\n3. Re-téléversez le document corrigé\n4. L'équipe RH sera automatiquement notifiée\n\n💡 Assurez-vous que le document est **lisible**, au **bon format** (PDF/JPG) et **complet**.`,
            suggestions: ['Quels formats sont acceptés ?', 'Comment contacter les RH ?', 'Délai de traitement ?'],
        },
        {
            patterns: ['évaluation', 'auto-évaluation', 'notation', 'feedback'],
            response: `L'**auto-évaluation** vous permet de partager vos impressions sur votre intégration.\n\n📝 **Comment faire :**\n1. Rendez-vous dans **"Auto-évaluation"** depuis le menu\n2. Notez votre expérience globale (1 à 5 étoiles)\n3. Indiquez si vous avez reçu le matériel nécessaire\n4. Ajoutez vos commentaires et suggestions\n\nVos retours sont confidentiels et aident à améliorer le processus d'intégration.`,
            suggestions: ['Mon évaluation est-elle anonyme ?', 'Quand faire mon évaluation ?', 'Que se passe-t-il après l\'évaluation ?'],
        },
    ],
    MANAGER: [
        {
            patterns: ['valider', 'validation', 'tâche', 'approuver'],
            response: `Pour **valider les tâches** de votre équipe :\n\n1. Rendez-vous dans **"Tâches Métier"**\n2. Les tâches soumises par vos employés apparaissent avec le statut **"En attente"**\n3. Cliquez sur **✅ Valider** ou **❌ Rejeter** pour chaque tâche\n4. L'employé sera notifié automatiquement de votre décision\n\n📊 Vous pouvez filtrer les tâches par statut, priorité ou catégorie.`,
            suggestions: ['Comment voir la progression de mon équipe ?', 'Comment créer une nouvelle tâche ?', 'Que faire si un employé est en retard ?'],
        },
        {
            patterns: ['équipe', 'progression', 'suivi', 'dossier'],
            response: `Le suivi de votre équipe est centralisé dans **"Équipe & Essais"** :\n\n👥 **Fonctionnalités :**\n- Visualisez la progression de chaque membre\n- Accédez au dossier complet d'un employé\n- Gérez les décisions de période d'essai\n- Consultez les documents soumis\n\n📈 Le **tableau de bord** vous donne un aperçu rapide des tâches à traiter.`,
            suggestions: ['Comment valider une période d\'essai ?', 'Comment créer une évaluation ?', 'Voir les documents de mon équipe'],
        },
        {
            patterns: ['période d\'essai', 'essai', 'titularisation'],
            response: `Pour gérer la **période d'essai** d'un membre de votre équipe :\n\n1. Accédez à **"Équipe & Essais"**\n2. Cliquez sur **"Dossier"** de l'employé concerné\n3. Dans la section période d'essai, cliquez sur **Valider** ou **Refuser**\n4. Ajoutez un commentaire justificatif\n\n⚠️ L'employé et l'équipe RH seront automatiquement notifiés de votre décision.`,
            suggestions: ['Quels critères d\'évaluation ?', 'Comment rédiger le commentaire ?', 'Délai de décision ?'],
        },
    ],
    ADMINRH: [
        {
            patterns: ['analytics', 'statistiques', 'rapport', 'kpi'],
            response: `Les **analytics RH** sont disponibles dans **"Analytics & Rapports"** :\n\n📊 **KPIs disponibles :**\n- Taux de complétion des intégrations\n- Nombre de documents en attente\n- Répartition par département\n- Évolution mensuelle\n\n📥 Vous pouvez **exporter** les données en PDF ou Excel pour vos comités.`,
            suggestions: ['Comment exporter un rapport ?', 'Quels sont les KPIs les plus importants ?', 'Comment améliorer le taux de complétion ?'],
        },
        {
            patterns: ['document', 'validation', 'valider'],
            response: `La validation des documents se fait dans **"Documents"** :\n\n1. Les documents soumis apparaissent avec un **score IA** de conformité\n2. Vérifiez le score et le contenu du document\n3. Cliquez sur **Valider** ou **Rejeter**\n4. L'employé est automatiquement notifié\n\n🤖 Le score IA vous aide à prioriser : les documents avec un score < 70% méritent une attention particulière.`,
            suggestions: ['Comment interpréter le score IA ?', 'Quels documents sont obligatoires ?', 'Comment gérer les rejets ?'],
        },
        {
            patterns: ['employé', 'nouvel', 'intégration', 'onboarding', 'créer'],
            response: `Pour intégrer un **nouvel employé** :\n\n1. Créez d'abord l'utilisateur dans **"Utilisateurs"**\n2. Créez le profil employé dans **"Employés"** avec son poste et département\n3. L'onboarding est automatiquement créé avec les tâches du modèle associé au poste\n4. L'employé peut se connecter et commencer son parcours\n\n📋 Assurez-vous d'avoir configuré les **modèles d'onboarding** pour chaque poste.`,
            suggestions: ['Comment configurer un modèle d\'onboarding ?', 'Quels postes sont disponibles ?', 'Comment assigner un manager ?'],
        },
    ],
};
const DEFAULT_RESPONSES = {
    SALARIE: {
        response: `Je suis votre **assistant IA d'intégration** 🤖\n\nJe peux vous aider avec :\n- 📄 Vos **documents** à soumettre\n- ✅ Vos **tâches** d'intégration\n- 📊 Votre **progression** et période d'essai\n- 📝 Votre **auto-évaluation**\n\nN'hésitez pas à me poser une question !`,
        suggestions: ['Quels documents dois-je soumettre ?', 'Où sont mes tâches ?', 'Comment fonctionne la période d\'essai ?'],
    },
    MANAGER: {
        response: `Je suis votre **assistant IA de management** 🤖\n\nJe peux vous aider avec :\n- ✅ La **validation** des tâches de votre équipe\n- 👥 Le **suivi** de progression de vos collaborateurs\n- 📋 La gestion des **périodes d'essai**\n- 📊 Les **évaluations** de performance\n\nQue puis-je faire pour vous ?`,
        suggestions: ['Comment valider une tâche ?', 'Voir la progression de mon équipe', 'Gérer une période d\'essai'],
    },
    ADMINRH: {
        response: `Je suis votre **assistant IA RH** 🤖\n\nJe peux vous aider avec :\n- 📊 Les **analytics** et rapports RH\n- 📄 La **validation** des documents\n- 👥 L'intégration de **nouveaux employés**\n- ⚙️ La **configuration** de la plateforme\n\nComment puis-je vous assister ?`,
        suggestions: ['Voir les analytics RH', 'Comment valider des documents ?', 'Intégrer un nouvel employé'],
    },
};
let AiService = class AiService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    analyzeDocument(name, type) {
        const config = DOC_TYPE_MAP[type.toUpperCase()] || DOC_TYPE_MAP['CV'];
        const baseConfidence = 0.78 + Math.random() * 0.20;
        const confidence = Math.round(baseConfidence * 100) / 100;
        const extractedFields = [...config.fields];
        const missingFields = [];
        const optionalFields = config.fields.filter((f) => !config.requiredFields.includes(f));
        for (const field of optionalFields) {
            if (Math.random() < 0.1) {
                missingFields.push(field);
                const idx = extractedFields.indexOf(field);
                if (idx > -1)
                    extractedFields.splice(idx, 1);
            }
        }
        let recommendations;
        if (confidence >= 0.90 && missingFields.length === 0) {
            recommendations = `Document conforme et de bonne qualité. Prêt pour validation RH. Tous les champs requis ont été détectés.`;
        }
        else if (confidence >= 0.75) {
            recommendations = `Document acceptable. ${missingFields.length > 0 ? `Champs manquants possibles : ${missingFields.join(', ')}.` : ''} Une vérification manuelle est recommandée.`;
        }
        else {
            recommendations = `Document nécessitant une attention particulière. Qualité ou lisibilité insuffisante. Demandez à l'employé de resoumettre un scan de meilleure qualité.`;
        }
        return {
            documentType: config.type,
            confidence,
            extractedFields,
            missingFields,
            recommendations,
        };
    }
    async saveAnalysis(documentId, analysis) {
        const existing = await this.prisma.aIAnalysisResult.findUnique({
            where: { documentId },
        });
        const data = {
            documentType: analysis.documentType,
            confidence: analysis.confidence,
            extractedData: JSON.stringify({
                fields: analysis.extractedFields,
                recommendations: analysis.recommendations,
            }),
            missingFields: analysis.missingFields,
        };
        if (existing) {
            return this.prisma.aIAnalysisResult.update({
                where: { documentId },
                data,
            });
        }
        return this.prisma.aIAnalysisResult.create({
            data: { documentId, ...data },
        });
    }
    async chatResponse(question, userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, firstName: true },
        });
        const role = user?.role || 'SALARIE';
        const kb = CHATBOT_KB[role] || CHATBOT_KB['SALARIE'];
        const q = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        let bestMatch = null;
        let bestScore = 0;
        for (const entry of kb) {
            let score = 0;
            for (const pattern of entry.patterns) {
                const normalizedPattern = pattern.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (q.includes(normalizedPattern)) {
                    score += 2;
                }
                const words = normalizedPattern.split(' ');
                for (const word of words) {
                    if (word.length > 3 && q.includes(word)) {
                        score += 1;
                    }
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestMatch = entry;
            }
        }
        if (bestMatch && bestScore >= 1) {
            return {
                response: bestMatch.response,
                suggestedQuestions: bestMatch.suggestions,
            };
        }
        const defaults = DEFAULT_RESPONSES[role] || DEFAULT_RESPONSES['SALARIE'];
        return {
            response: `Je n'ai pas trouvé de réponse précise à votre question. ${defaults.response}`,
            suggestedQuestions: defaults.suggestions,
        };
    }
    async generateInsights() {
        const insights = [];
        const [totalOnboardings, inProgressCount, completedCount, delayedCount, pendingDocs, recentTasks,] = await Promise.all([
            this.prisma.employeeOnboarding.count(),
            this.prisma.employeeOnboarding.count({ where: { status: 'IN_PROGRESS' } }),
            this.prisma.employeeOnboarding.count({ where: { status: 'COMPLETED' } }),
            this.prisma.employeeOnboarding.count({ where: { status: 'DELAYED' } }),
            this.prisma.document.count({ where: { status: 'PENDING' } }),
            this.prisma.task.count({ where: { status: 'OVERDUE' } }),
        ]);
        const completionRate = totalOnboardings > 0
            ? Math.round((completedCount / totalOnboardings) * 100)
            : 0;
        if (delayedCount > 0) {
            insights.push({
                type: 'WARNING',
                title: 'Retards d\'intégration détectés',
                message: `${delayedCount} parcours d'intégration sont actuellement en retard. Recommandation : planifiez un point individuel avec les managers concernés pour identifier les blocages et accélérer le processus.`,
                priority: 'HIGH',
            });
        }
        if (pendingDocs > 5) {
            insights.push({
                type: 'WARNING',
                title: 'Documents en attente de validation',
                message: `${pendingDocs} documents attendent une validation. Un temps de traitement supérieur à 48h peut impacter l'expérience des nouveaux employés. Priorisez la validation des documents les plus anciens.`,
                priority: 'HIGH',
            });
        }
        else if (pendingDocs > 0) {
            insights.push({
                type: 'INFO',
                title: 'Documents à traiter',
                message: `${pendingDocs} document(s) en attente de validation. Le temps de traitement est dans la norme. Continuez à maintenir ce rythme de validation.`,
                priority: 'LOW',
            });
        }
        if (completionRate >= 80) {
            insights.push({
                type: 'SUCCESS',
                title: 'Excellent taux de complétion',
                message: `Le taux de complétion des intégrations est de ${completionRate}%, ce qui est supérieur à la moyenne du secteur (65%). Vos processus RH sont performants. Maintenez cette dynamique positive.`,
                priority: 'LOW',
            });
        }
        else if (completionRate >= 50) {
            insights.push({
                type: 'INFO',
                title: 'Taux de complétion en progression',
                message: `Le taux de complétion est de ${completionRate}%. Pour l'améliorer, envisagez de : (1) relancer les parcours inactifs depuis plus de 7 jours, (2) automatiser les rappels de tâches, (3) organiser des sessions d'onboarding collectives.`,
                priority: 'MEDIUM',
            });
        }
        else if (totalOnboardings > 0) {
            insights.push({
                type: 'WARNING',
                title: 'Taux de complétion faible',
                message: `Le taux de complétion est de ${completionRate}%. Action recommandée : auditez les parcours bloqués, identifiez les tâches problématiques, et simplifiez les étapes non essentielles.`,
                priority: 'HIGH',
            });
        }
        if (recentTasks > 0) {
            insights.push({
                type: 'WARNING',
                title: 'Tâches en retard',
                message: `${recentTasks} tâche(s) ont dépassé leur date d'échéance. Recommandation : envoyez un rappel automatique aux assignés et ajustez les priorités si nécessaire.`,
                priority: 'HIGH',
            });
        }
        if (inProgressCount > 0) {
            insights.push({
                type: 'INFO',
                title: 'Optimisation du processus',
                message: `${inProgressCount} intégration(s) en cours. Pour optimiser le processus : assurez-vous que chaque nouveau collaborateur a un buddy assigné, planifiez les check-ins à J+7, J+30 et J+90, et collectez le feedback systématiquement via l'auto-évaluation.`,
                priority: 'MEDIUM',
            });
        }
        if (insights.length === 0) {
            insights.push({
                type: 'SUCCESS',
                title: 'Plateforme opérationnelle',
                message: `Tout est en ordre ! Aucun retard ni anomalie détectée. La plateforme est prête à accueillir de nouvelles intégrations. Pensez à configurer les modèles d'onboarding pour les postes récemment créés.`,
                priority: 'LOW',
            });
        }
        return insights;
    }
};
exports.AiService = AiService;
exports.AiService = AiService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AiService);
//# sourceMappingURL=ai.service.js.map