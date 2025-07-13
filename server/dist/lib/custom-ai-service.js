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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomAIs = getCustomAIs;
exports.createCustomAI = createCustomAI;
const prisma_1 = __importDefault(require("./prisma"));
function getCustomAIs(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('🔍 커스텀 AI 조회 시작:', userId);
            const customAIs = yield prisma_1.default.customAIPersonality.findMany({
                where: {
                    userId,
                    isActive: true,
                },
            });
            console.log(`✅ 커스텀 AI ${customAIs.length}개 찾음`);
            return customAIs;
        }
        catch (error) {
            console.error('커스텀 AI 조회 오류:', error);
            throw error;
        }
    });
}
function createCustomAI(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const customAI = yield prisma_1.default.customAIPersonality.create({
                data: {
                    id: `custom_${Date.now()}`,
                    userId: data.userId,
                    name: data.name,
                    description: data.description,
                    mbtiTypes: JSON.stringify(data.mbtiTypes),
                    systemPrompt: data.systemPrompt,
                    updatedAt: new Date(),
                },
            });
            return customAI;
        }
        catch (error) {
            console.error('커스텀 AI 생성 오류:', error);
            throw error;
        }
    });
}
