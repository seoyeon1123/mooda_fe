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
const uuid_1 = require("uuid");
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
            console.log('[createCustomAI] 입력 데이터:', {
                userId: data.userId,
                name: data.name,
                mbtiTypes: data.mbtiTypes,
                mbtiTypesType: typeof data.mbtiTypes,
            });
            // mbtiTypes를 JSON 객체로 저장 (Prisma Json 타입)
            let mbtiTypesObj;
            if (typeof data.mbtiTypes === 'string') {
                console.log('[createCustomAI] 문자열 파싱 시도:', data.mbtiTypes);
                try {
                    mbtiTypesObj = JSON.parse(data.mbtiTypes);
                }
                catch (parseError) {
                    console.error('[createCustomAI] JSON 파싱 실패:', parseError);
                    // 파싱 실패 시 기본값
                    mbtiTypesObj = {
                        energy: 'I',
                        information: 'N',
                        decisions: 'F',
                        lifestyle: 'P',
                    };
                }
            }
            else {
                console.log('[createCustomAI] 객체로 받음:', data.mbtiTypes);
                mbtiTypesObj = data.mbtiTypes;
            }
            console.log('[createCustomAI] 최종 mbtiTypesObj:', mbtiTypesObj);
            // JSON 객체를 문자열로 안전하게 저장
            const safeObj = {
                energy: String(mbtiTypesObj.energy || 'I'),
                information: String(mbtiTypesObj.information || 'N'),
                decisions: String(mbtiTypesObj.decisions || 'F'),
                lifestyle: String(mbtiTypesObj.lifestyle || 'P'),
            };
            const mbtiTypesString = JSON.stringify(safeObj);
            console.log('[createCustomAI] 저장할 문자열:', mbtiTypesString);
            const customAI = yield prisma_1.default.customAIPersonality.create({
                data: {
                    id: (0, uuid_1.v4)(),
                    userId: data.userId,
                    name: data.name,
                    description: data.description,
                    mbtiTypes: mbtiTypesString, // JSON 문자열로 저장
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
