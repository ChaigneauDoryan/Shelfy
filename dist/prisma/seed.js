"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const readingStatuses = [
            { id: 1, status_name: 'to_read' },
            { id: 2, status_name: 'reading' },
            { id: 3, status_name: 'finished' },
        ];
        for (const status of readingStatuses) {
            yield prisma.readingStatus.upsert({
                where: { id: status.id },
                update: {},
                create: status,
            });
            console.log(`Upserted ReadingStatus: ${status.status_name}`);
        }
        // Vous pouvez ajouter des badges par défaut ici si nécessaire
        const defaultBadges = [
            { id: 1, name: 'Premier Pas', description: 'Terminer votre premier livre.', icon_url: null },
            { id: 2, name: 'Apprenti Lecteur', description: 'Terminer 5 livres.', icon_url: null },
            { id: 3, name: 'Rat de Bibliothèque', description: 'Terminer 20 livres.', icon_url: null },
            { id: 5, name: 'Curieux', description: 'Terminer des livres de 3 genres différents.', icon_url: null },
        ];
        for (const badge of defaultBadges) {
            yield prisma.badge.upsert({
                where: { id: badge.id },
                update: {},
                create: badge,
            });
            console.log(`Upserted Badge: ${badge.name}`);
        }
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
