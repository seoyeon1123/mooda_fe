'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Bell, BellOff } from 'lucide-react';
import {
  loadNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  getNotificationPermission,
  isWebView,
} from '@/lib/notification-service';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSettingsModal({
  isOpen,
  onClose,
}: NotificationSettingsModalProps) {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [dailyReminder, setDailyReminder] = useState(false);
  const [emotionAnalysis, setEmotionAnalysis] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermission | null>(null);

  // 설정 로드
  useEffect(() => {
    if (isOpen) {
      const settings = loadNotificationSettings();
      setPushEnabled(settings.pushEnabled);
      setDailyReminder(settings.dailyReminder);
      setEmotionAnalysis(settings.emotionAnalysis);
      checkPermission();
    }
  }, [isOpen]);

  const checkPermission = async () => {
    const permission = await getNotificationPermission();
    setPermissionStatus(permission);
  };

  const handlePushToggle = async () => {
    if (!pushEnabled) {
      // 알림 켜기: 권한 요청
      setIsLoading(true);
      try {
        const granted = await requestNotificationPermission();
        if (granted) {
          setPushEnabled(true);
          await checkPermission();
        } else {
          alert('알림 권한이 필요합니다. 설정에서 알림 권한을 허용해주세요.');
        }
      } catch (error) {
        console.error('알림 권한 요청 실패:', error);
        alert('알림 권한 요청에 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // 알림 끄기
      setPushEnabled(false);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await saveNotificationSettings({
        pushEnabled,
        dailyReminder,
        emotionAnalysis,
      });
      onClose();
    } catch (error) {
      console.error('설정 저장 실패:', error);
      alert('설정 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell size={20} className="text-green-700" />
            알림 설정
          </DialogTitle>
          <DialogDescription>
            원하는 알림을 선택하여 설정하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 푸시 알림 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {pushEnabled ? (
                <Bell size={20} className="text-green-600" />
              ) : (
                <BellOff size={20} className="text-gray-400" />
              )}
              <div>
                <p className="font-medium text-gray-800">푸시 알림</p>
                <p className="text-sm text-gray-500">
                  새로운 메시지와 업데이트 알림
                </p>
              </div>
            </div>
            <button
              onClick={handlePushToggle}
              disabled={isLoading}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                pushEnabled ? 'bg-green-600' : 'bg-gray-300'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  pushEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 일일 리마인더 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">일일 리마인더</p>
                <p className="text-sm text-gray-500">
                  매일 대화하도록 알림 받기
                </p>
              </div>
            </div>
            <button
              onClick={() => setDailyReminder(!dailyReminder)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                dailyReminder ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  dailyReminder ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 감정 분석 알림 */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-gray-600" />
              <div>
                <p className="font-medium text-gray-800">감정 분석 알림</p>
                <p className="text-sm text-gray-500">
                  일일 감정 분석 결과 알림
                </p>
              </div>
            </div>
            <button
              onClick={() => setEmotionAnalysis(!emotionAnalysis)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                emotionAnalysis ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  emotionAnalysis ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {isWebView() && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700">
              💡 앱 환경에서는 플러터를 통해 알림이 처리됩니다.
            </p>
          </div>
        )}

        {permissionStatus === 'denied' && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-700">
              ⚠️ 알림 권한이 거부되었습니다. 설정에서 알림 권한을 허용해주세요.
            </p>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? '저장 중...' : '저장'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
