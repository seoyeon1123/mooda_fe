"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { HelpCircle, MessageCircle, BookOpen, Mail } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({
  isOpen,
  onClose,
}: HelpModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle size={20} className="text-green-700" />
            도움말
          </DialogTitle>
          <DialogDescription>
            무디 사용 방법과 자주 묻는 질문
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 주요 기능 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <MessageCircle size={18} className="text-green-600" />
              주요 기능
            </h3>
            <div className="space-y-2 pl-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm text-gray-800 mb-1">
                  💬 채팅
                </p>
                <p className="text-xs text-gray-600">
                  AI 캐릭터와 자유롭게 대화하며 하루를 공유하세요.
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm text-gray-800 mb-1">
                  📅 캘린더
                </p>
                <p className="text-xs text-gray-600">
                  날짜별 감정과 대화 내용을 한눈에 확인하세요.
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm text-gray-800 mb-1">
                  📝 일기
                </p>
                <p className="text-xs text-gray-600">
                  감정과 함께 일기를 작성하고 기록하세요.
                </p>
              </div>
            </div>
          </div>

          {/* 자주 묻는 질문 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <BookOpen size={18} className="text-green-600" />
              자주 묻는 질문
            </h3>
            <div className="space-y-2 pl-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm text-gray-800 mb-1">
                  Q. 캐릭터를 변경할 수 있나요?
                </p>
                <p className="text-xs text-gray-600">
                  네, 설정 페이지에서 원하는 AI 캐릭터를 선택하거나 새로운
                  캐릭터를 만들 수 있습니다.
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm text-gray-800 mb-1">
                  Q. 대화 기록은 어디에 저장되나요?
                </p>
                <p className="text-xs text-gray-600">
                  모든 대화 기록은 암호화되어 안전하게 서버에 저장됩니다.
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium text-sm text-gray-800 mb-1">
                  Q. 감정 분석은 어떻게 되나요?
                </p>
                <p className="text-xs text-gray-600">
                  매일 자정에 전날의 대화 내용을 분석하여 감정을 기록합니다.
                </p>
              </div>
            </div>
          </div>

          {/* 문의하기 */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start gap-3">
              <Mail size={20} className="text-green-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-800 mb-1">문의하기</p>
                <p className="text-sm text-gray-600 mb-2">
                  추가 도움이 필요하신가요? 언제든지 문의해주세요.
                </p>
                <a
                  href="mailto:support@mooda.app"
                  className="text-sm text-green-600 hover:text-green-700 underline"
                >
                  support@mooda.app
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            확인
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

