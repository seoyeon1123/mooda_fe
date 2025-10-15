export interface DiaryEntry {
  id: string;
  date: Date;
  emotion: string;
  title: string;
  content: string;
  userId: string;
}

export class DiaryService {
  static async getEntries(userId: string): Promise<DiaryEntry[]> {
    const response = await fetch(`/api/diary-entries?userId=${userId}`);

    if (!response.ok) {
      throw new Error('일기 목록 조회 실패');
    }
    const data = await response.json();
    return data.entries.map((entry: DiaryEntry) => ({
      ...entry,
      date: new Date(entry.date),
    }));
  }

  static async createEntry(entry: Omit<DiaryEntry, 'id'>): Promise<DiaryEntry> {
    const response = await fetch('/api/diary-entries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    });

    if (!response.ok) {
      throw new Error('일기 생성 실패');
    }
    const data = await response.json();
    return {
      ...data,
      date: new Date(data.date),
    };
  }
  static async updateEntry(
    id: string,
    updates: Partial<DiaryEntry>
  ): Promise<DiaryEntry> {
    const response = await fetch(`/api/diary-entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('일기 수정 실패');
    const data = await response.json();
    return {
      ...data,
      date: new Date(data.date),
    };
  }

  static async deleteEntry(id: string): Promise<void> {
    const response = await fetch(`/api/diary-entries/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('일기 삭제 실패');
  }
}
