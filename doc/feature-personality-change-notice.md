# 기능 구현 및 문제 해결 기록: 페르소나 변경 안내 시스템 메시지

- **날짜**: 2023년 10월 27일
- **기능**: 채팅 상대방 AI 페르소나 변경 시, 채팅 화면에 이를 알려주는 시스템 메시지 표시
- **파일**: `doc/feature-personality-change-notice.md`

---

## 1. 요구사항

사용자가 설정 페이지에서 AI 페르소나(예: 무니 → 무지)를 변경한 후 채팅 페이지로 돌아오면, 페르소나가 변경되었음을 명확히 인지할 수 있도록 채팅창에 "--- 무지와 대화를 시작합니다 ---"와 같은 안내 메시지를 시스템 메시지 형태로 표시한다.

## 2. 구현 과정 및 문제 해결

이 기능은 간단해 보였지만, 상태 관리의 생명주기와 React `useEffect`의 동작 방식에 대한 깊은 이해가 필요한 문제였으며, 여러 단계의 문제 해결 과정을 거쳤다.

### 1차 시도: `useRef`를 이용한 변경 감지

- **접근법**: `chat/page.tsx` 컴포넌트 내에서 `useRef`를 사용하여 이전 `personalityId`를 저장하고, 현재 ID와 비교하여 변경 여부를 감지하고자 했다.
- **문제점**: 이 접근법은 치명적인 결함이 있었다. 설정 페이지로 이동하는 순간 `chat/page.tsx` 컴포넌트는 **unmount**되고, 채팅 페이지로 다시 돌아오면 **remount**된다. 이 과정에서 `useRef`를 포함한 모든 컴포넌트 내부 상태가 초기화되므로, 이전 ID를 기억할 수 없어 변경을 감지하는 것이 불가능했다.

### 2차 시도: Zustand 스토어를 이용한 상태 유지

- **접근법**: 컴포넌트의 생명주기와 무관하게 상태를 유지하기 위해, 전역 상태 관리 라이브러리인 Zustand 스토어(`userStore.ts`)에 `personalityChanged: boolean` 플래그를 추가했다.
  1.  **설정 페이지**: 페르소나 변경 시, `setSelectedPersonalityId` 액션이 `personalityChanged` 플래그를 `true`로 설정한다.
  2.  **채팅 페이지**: `useEffect`를 사용해 `personalityChanged`가 `true`이면 시스템 메시지를 `messages` 상태에 추가하고, 즉시 `ackPersonalityChange` 액션으로 플래그를 `false`로 리셋한다.
- **문제점**: 기능이 동작하지 않았다. 두 개의 `useEffect` (대화 기록 로딩, 플래그 감지) 사이의 **경쟁 상태(Race Condition)**가 문제였다. 플래그를 감지한 `useEffect`가 시스템 메시지를 추가하더라도, 거의 동시에 실행된 대화 기록 로딩 `useEffect`가 DB에서 가져온 데이터로 `messages` 상태를 **덮어써버려** 시스템 메시지가 사라졌다.

### 3차 시도: `useEffect` 통합과 새로운 버그

- **접근법**: 두 `useEffect`를 하나로 통합하여 실행 순서를 보장하고자 했다.
  1.  DB에서 대화 기록을 불러온다.
  2.  `personalityChanged`가 `true`이면, 불러온 대화 기록 **뒤에** 시스템 메시지를 붙여 `setMessages`를 호출한다.
- **문제점**: 이 과정에서 또 다른 버그가 발생했다. `ackPersonalityChange()`로 플래그를 `false`로 만드는 순간, `useEffect`의 의존성 배열에 있던 `personalityChanged`가 변경을 감지하여 `useEffect`가 **불필요하게 재실행**되었다. 두 번째 실행에서는 플래그가 `false`이므로 `else` 분기를 타게 되어, 결국 시스템 메시지가 포함되지 않은 순수 대화 기록으로 다시 한 번 덮어쓰기가 발생했다.

### 4차 시도: 최종 해결책

- **핵심 원인**: `useEffect` 의존성 배열에 상태 변경의 원인이자 결과인 `personalityChanged`가 포함되어, 스스로 상태를 변경하고 그 변경에 의해 재실행되는 순환 로직이 문제의 근원이었다.
- **해결책**: 의존성 문제를 회피하기 위해 `useEffect`의 로직을 다음과 같이 수정했다.
  1.  `useEffect`의 **의존성 배열에서 `personalityChanged`와 `ackPersonalityChange`를 제거**했다. 이로써 플래그가 리셋되어도 `useEffect`가 재실행되지 않도록 했다.
  2.  `useEffect` **내부에서 `useUserStore.getState().personalityChanged`를 호출**하여, 렌더링 시점의 값이 아닌 항상 최신 상태의 플래그 값을 직접 스토어에서 조회하도록 변경했다.

이 방법을 통해, `useEffect`는 `selectedPersonalityId`가 바뀔 때 단 한 번만 올바르게 실행되며, 내부에서는 항상 최신 플래그 값을 참조하여 정확한 조건 분기를 실행할 수 있게 되었다.

## 3. 최종 구현 코드

#### `store/userStore.ts`

`personalityChanged` 플래그와 관련 액션을 추가하고, `partialize` 옵션을 통해 이 플래그가 localStorage에 저장되지 않도록 설정했다.

```typescript
// ...
interface UserState {
  // ...
  selectedPersonalityId: string;
  personalityChanged: boolean;
  setSelectedPersonalityId: (id: string) => void;
  ackPersonalityChange: () => void;
}

const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // ...
      selectedPersonalityId: 'MUNI',
      personalityChanged: false,
      setSelectedPersonalityId: (id) => {
        if (get().selectedPersonalityId !== id) {
          set({ selectedPersonalityId: id, personalityChanged: true });
        }
      },
      ackPersonalityChange: () => set({ personalityChanged: false }),
    }),
    {
      name: 'user-settings-storage',
      partialize: (state) => ({
        user: state.user,
        selectedPersonalityId: state.selectedPersonalityId,
      }),
    }
  )
);
// ...
```

#### `app/(layout)/chat/page.tsx`

핵심 로직이 담긴 `useEffect` 부분. 의존성 배열을 정리하고, `getState()`를 사용해 문제를 해결했다.

```tsx
// ...
export default function ChatTab() {
  // ...
  const selectedPersonalityId = useUserStore(
    (state) => state.selectedPersonalityId
  );
  const ackPersonalityChange = useUserStore(
    (state) => state.ackPersonalityChange
  );
  // ...
  const currentPersonality = getPersonalityById(selectedPersonalityId);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    const initializeChat = async () => {
      setIsLoading(true);
      try {
        const conversations = await loadConversationHistory(
          session.user.id,
          selectedPersonalityId
        );

        // 스토어에서 직접 최신 상태를 조회하여 의존성 문제를 회피
        const personalityChanged = useUserStore.getState().personalityChanged;

        if (personalityChanged && currentPersonality) {
          const systemMessage: Message = {
            id: `system_${Date.now()}`,
            role: 'system',
            content: `--- 이제부터 ${currentPersonality.name}와 대화를 시작합니다 ---`,
            createdAt: new Date(),
          };
          setMessages([...conversations, systemMessage]);
          ackPersonalityChange(); // 플래그 리셋
        } else if (conversations.length === 0 && currentPersonality) {
          // ... 환영 메시지 로직
        } else {
          setMessages(conversations);
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initializeChat();
  }, [status, session, selectedPersonalityId, ackPersonalityChange]); // 의존성 배열에서 personalityChanged 제거
  // ...
}
```

## 4. 결론

단순한 기능이었지만, React의 렌더링 및 `useEffect` 생명주기와 전역 상태 관리가 복합적으로 얽히면서 예상치 못한 디버깅 과정을 거쳤다. 이 경험을 통해 `useEffect`의 의존성 배열을 신중하게 관리하고, 필요에 따라 `getState()`와 같은 API를 활용하여 의존성 문제를 회피하는 전략의 중요성을 확인했다.
