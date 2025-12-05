// 알림 설정 관리 서비스
// 플러터 웹뷰와 통신하기 위한 브리지

interface NotificationSettings {
  pushEnabled: boolean;
  dailyReminder: boolean;
  emotionAnalysis: boolean;
}

const STORAGE_KEY = 'mooda_notification_settings';

// 플러터 웹뷰와 통신하는 브리지
// 플러터에서 window.flutter_inappwebview.callHandler를 통해 호출할 수 있음
declare global {
  interface Window {
    flutter_inappwebview?: {
      callHandler: (
        handlerName: string,
        ...args: unknown[]
      ) => Promise<unknown>;
    };
    webkit?: {
      messageHandlers?: {
        flutter?: {
          postMessage: (message: Record<string, unknown>) => void;
        };
      };
    };
  }
}

// 웹뷰 환경 감지
export function isWebView(): boolean {
  return (
    typeof window !== 'undefined' &&
    (window.flutter_inappwebview !== undefined ||
      window.webkit?.messageHandlers?.flutter !== undefined)
  );
}

// 플러터로 알림 설정 전송
export async function sendNotificationSettingsToFlutter(
  settings: NotificationSettings
): Promise<void> {
  if (!isWebView()) {
    console.log('웹뷰 환경이 아닙니다. 로컬 스토리지에만 저장합니다.');
    return;
  }

  try {
    // Flutter InAppWebView 방식
    if (window.flutter_inappwebview) {
      await window.flutter_inappwebview.callHandler(
        'updateNotificationSettings',
        settings
      );
    }
    // iOS WKWebView 방식
    else if (window.webkit?.messageHandlers?.flutter) {
      window.webkit.messageHandlers.flutter.postMessage({
        type: 'updateNotificationSettings',
        data: settings,
      });
    }
  } catch (error) {
    console.error('플러터로 알림 설정 전송 실패:', error);
  }
}

// 알림 설정 로드
export function loadNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') {
    return {
      pushEnabled: false,
      dailyReminder: false,
      emotionAnalysis: true,
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('알림 설정 로드 실패:', error);
  }

  return {
    pushEnabled: false,
    dailyReminder: false,
    emotionAnalysis: true,
  };
}

// 알림 설정 저장
export async function saveNotificationSettings(
  settings: NotificationSettings
): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // 로컬 스토리지에 저장
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    // 웹뷰 환경이면 플러터로도 전송
    if (isWebView()) {
      await sendNotificationSettingsToFlutter(settings);
    }
  } catch (error) {
    console.error('알림 설정 저장 실패:', error);
    throw error;
  }
}

// 알림 권한 요청 (웹뷰에서는 플러터를 통해 처리)
export async function requestNotificationPermission(): Promise<boolean> {
  if (isWebView()) {
    try {
      // 플러터에 권한 요청 요청
      if (window.flutter_inappwebview) {
        const result = await window.flutter_inappwebview.callHandler(
          'requestNotificationPermission'
        );
        return result === true || result === 'granted';
      } else if (window.webkit?.messageHandlers?.flutter) {
        window.webkit.messageHandlers.flutter.postMessage({
          type: 'requestNotificationPermission',
        });
        // iOS는 비동기 응답을 받기 어려우므로 일단 true 반환
        return true;
      }
    } catch (error) {
      console.error('알림 권한 요청 실패:', error);
      return false;
    }
  } else {
    // 일반 웹 환경에서는 브라우저 API 사용
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  }

  return false;
}

// 알림 권한 상태 확인
export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (isWebView()) {
    try {
      if (window.flutter_inappwebview) {
        const result = await window.flutter_inappwebview.callHandler(
          'getNotificationPermission'
        );
        return (result as NotificationPermission) || 'default';
      }
    } catch (error) {
      console.error('알림 권한 확인 실패:', error);
    }
    return 'default';
  } else {
    if ('Notification' in window) {
      return Notification.permission;
    }
  }
  return 'default';
}
