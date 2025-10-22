import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unstable_cache } from 'next/cache';

export interface ChangelogSection {
  title: string;
  items: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  sections: ChangelogSection[];
}

export interface ChangelogData {
  title: string;
  description: string;
  links: { label: string; href: string }[];
  entries: ChangelogEntry[];
}

// 解析 Markdown 内容，提取一个或多个版本条目（忽略 frontmatter 元数据）
function parseEntriesFromMarkdown(content: string): ChangelogEntry[] {
  const { content: markdownContent } = matter(content);

  const entries: ChangelogEntry[] = [];

  // 按版本分割内容（以 "## " 作为版本标题的标识）
  const versionBlocks = markdownContent.split(/^## /m).filter(Boolean);

  for (const block of versionBlocks) {
    // 解析版本和日期：第一行格式如 "1.4.3 - October 13, 2025"
    const firstLine = block.split('\n')[0];
    const versionMatch = firstLine.match(/^(.+?)\s+-\s+(.+?)$/);
    if (!versionMatch) continue;

    const [, version, date] = versionMatch;
    const sections: ChangelogSection[] = [];

    // 按分组分割内容（以 "### " 作为分组标题）
    const sectionBlocks = block.split(/^### /m).slice(1);
    for (const sectionBlock of sectionBlocks) {
      const lines = sectionBlock.split('\n').filter(Boolean);
      const title = lines[0];

      // 提取列表项，以 "- " 开头的行
      const items = lines
        .slice(1)
        .filter((line) => line.startsWith('- '))
        .map((line) => line.replace(/^- /, ''));

      if (items.length > 0) {
        sections.push({ title, items });
      }
    }

    entries.push({ version, date, sections });
  }

  return entries;
}

function compareVersionsDesc(a: string, b: string): number {
  const normalize = (v: string) => v.replace(/^v/i, '').trim();
  const pa = normalize(a).split('.').map((n) => parseInt(n, 10) || 0);
  const pb = normalize(b).split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da !== db) return db - da; // desc
  }
  return 0;
}

function parseDateValue(dateStr: string): number | null {
  const t = Date.parse(dateStr);
  return Number.isNaN(t) ? null : t;
}

// 读取目录下所有 .md 文件并聚合为 ChangelogData
async function readChangelogDirectory(): Promise<ChangelogData> {
  const dirPath = path.join(process.cwd(), 'content', 'changelog');
  const files = fs
    .readdirSync(dirPath)
    .filter((f) => f.endsWith('.md'));

  // 优先使用多文件（忽略 index.md），若只有 index.md 则回退到单文件解析
  const versionFiles = files.filter((f) => f.toLowerCase() !== 'index.md');

  const entries: ChangelogEntry[] = [];

  if (versionFiles.length > 0) {
    for (const file of versionFiles) {
      const fileContent = fs.readFileSync(path.join(dirPath, file), 'utf8');
      const parsed = parseEntriesFromMarkdown(fileContent);
      // 每个文件应通常包含一个版本，但解析器支持多个版本标题
      entries.push(...parsed);
    }
  } else if (files.includes('index.md')) {
    const fileContent = fs.readFileSync(path.join(dirPath, 'index.md'), 'utf8');
    entries.push(...parseEntriesFromMarkdown(fileContent));
  }

  // 按版本号倒序排序（例如 1.4.3 > 1.4.2）
  // 现在策略：优先按日期降序，其次按版本降序
  entries.sort((e1, e2) => {
    const d1 = parseDateValue(e1.date);
    const d2 = parseDateValue(e2.date);
    if (d1 !== null && d2 !== null && d1 !== d2) return d2 - d1;
    if (d1 !== null && d2 === null) return -1;
    if (d1 === null && d2 !== null) return 1;
    return compareVersionsDesc(e1.version, e2.version);
  });

  // 页面已经使用了固定标题并移除了链接，这里返回默认元数据即可
  return {
    title: 'CaptainCleanSheet Extension Changelog',
    description: '',
    links: [],
    entries,
  };
}

// 获取 changelog 数据，开发环境不缓存，生产环境缓存1小时
const isDev = process.env.NODE_ENV === 'development';
export const getChangelog: () => Promise<ChangelogData> = isDev
  ? async () => readChangelogDirectory()
  : unstable_cache(
      async () => readChangelogDirectory(),
      ['changelog-data'],
      { revalidate: 3600 }
    );