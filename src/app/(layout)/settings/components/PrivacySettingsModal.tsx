"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Shield, Lock, Eye, Trash2 } from "lucide-react";

interface PrivacySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PrivacySettingsModal({
  isOpen,
  onClose,
}: PrivacySettingsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield size={20} className="text-green-700" />
            개인정보 보호
          </DialogTitle>
          <DialogDescription>
            개인정보 보호 및 데이터 관리 설정
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 데이터 수집 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3 mb-2">
              <Eye size={20} className="text-gray-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-800 mb-1">데이터 수집</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  무디는 대화 내용과 감정 분석을 위해 최소한의 데이터만
                  수집합니다. 모든 데이터는 암호화되어 안전하게 보관됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 데이터 보안 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3 mb-2">
              <Lock size={20} className="text-gray-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-800 mb-1">데이터 보안</p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  모든 대화 내용은 암호화되어 저장되며, 제3자와 공유되지
                  않습니다. 서버는 보안 프로토콜을 준수하여 운영됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 데이터 삭제 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3 mb-3">
              <Trash2 size={20} className="text-gray-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-gray-800 mb-1">데이터 삭제</p>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  계정을 삭제하면 모든 대화 기록과 개인정보가 영구적으로
                  삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                </p>
                <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium">
                  계정 삭제하기
                </button>
              </div>
            </div>
          </div>

          {/* 개인정보 처리방침 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-800 mb-2">
              개인정보 처리방침
            </p>
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              자세한 개인정보 처리방침을 확인하시려면 아래 링크를 참고하세요.
            </p>
            <a
              href="#"
              className="text-sm text-green-600 hover:text-green-700 underline"
              onClick={(e) => {
                e.preventDefault();
                // TODO: 개인정보 처리방침 페이지로 이동
              }}
            >
              개인정보 처리방침 보기
            </a>
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

