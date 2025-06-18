import { getDefaultPersonality } from "./ai-personalities";

const SETTINGS_KEY = "mooda_ai_settings";

export interface UserSettings {
  selectedPersonalityId: string;
  lastUpdated: number;
}

export const getDefaultSettings = (): UserSettings => {
  return {
    selectedPersonalityId: getDefaultPersonality().id,
    lastUpdated: Date.now(),
  };
};

export const saveSettings = (settings: UserSettings): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};

export const loadSettings = (): UserSettings => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...getDefaultSettings(),
          ...parsed,
        };
      }
    } catch (error) {
      console.error("설정 로드 오류:", error);
    }
  }
  return getDefaultSettings();
};

export const updatePersonality = (personalityId: string): void => {
  const currentSettings = loadSettings();
  const newSettings: UserSettings = {
    ...currentSettings,
    selectedPersonalityId: personalityId,
    lastUpdated: Date.now(),
  };
  saveSettings(newSettings);
};
