import fs from 'fs/promises';
import path from 'path';

export async function saveDailyLog(content: string) {
  const today = new Date().toISOString().split('T')[0];
  const obsidianPath = process.env.OBSIDIAN_VAULT_PATH || ''; // .env.local에 설정
  const filePath = path.join(obsidianPath, 'Mooda', '기록', `${today}.md`);

  try {
    // 디렉토리 확인/생성
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    // 파일 존재 확인
    let existingContent = '';
    try {
      existingContent = await fs.readFile(filePath, 'utf8');
    } catch {
      // 파일이 없으면 새로 생성
    }

    const newContent = existingContent
      ? `${existingContent}\n\n## ${new Date().toLocaleTimeString()}\n${content}`
      : `# ${today}\n\n${content}`;

    await fs.writeFile(filePath, newContent);
    return { success: true, path: filePath };
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error' };
  }
}
