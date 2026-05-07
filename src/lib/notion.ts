import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { marked } from 'marked';

const NOTION_API_KEY = import.meta.env.NOTION_API_KEY;
const DATABASE_ID = import.meta.env.NOTION_DATABASE_ID;

if (!NOTION_API_KEY) {
  throw new Error('環境変数 NOTION_API_KEY が設定されていません。Netlify の Environment variables を確認してください。');
}
if (!DATABASE_ID) {
  throw new Error('環境変数 NOTION_DATABASE_ID が設定されていません。Netlify の Environment variables を確認してください。');
}

const notion = new Client({ auth: NOTION_API_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  tags: string[];
  date: string;
  description: string;
  youtubeUrl: string;
  correctionVideoUrl: string;
  heroImage: string;
}

/**
 * 公開済み記事をすべて取得
 * @param includeAll true なら下書き等もすべて取得（プレビュー用）
 */
export async function getAllPosts(includeAll = false): Promise<BlogPost[]> {
  const allResults: any[] = [];
  let cursor: string | undefined = undefined;

  do {
    const response: any = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: includeAll
        ? undefined
        : {
            property: 'Status',
            select: { equals: '公開済み' },
          },
      sorts: [{ property: '公開日', direction: 'descending' }],
      start_cursor: cursor,
    });

    allResults.push(...response.results);
    cursor = response.has_more ? response.next_cursor : undefined;
  } while (cursor);

  return allResults
    .map((page: any) => parsePostMetadata(page))
    .filter((p) => p.slug); // slug がない記事は除外
}

/**
 * Slug で記事を1件取得し、本文をHTMLにレンダリング
 */
export async function getPostBySlug(
  slug: string
): Promise<{ post: BlogPost; html: string } | null> {
  const response: any = await notion.databases.query({
    database_id: DATABASE_ID,
    filter: {
      property: 'Slug',
      rich_text: { equals: slug },
    },
  });

  if (response.results.length === 0) return null;

  const page = response.results[0];
  const post = parsePostMetadata(page);

  const mdblocks = await n2m.pageToMarkdown(post.id);
  const mdString = n2m.toMarkdownString(mdblocks);
  const markdown = mdString.parent || '';
  const html = await marked.parse(markdown);

  return { post, html };
}

/**
 * Notionページのプロパティを BlogPost 型に変換
 */
function parsePostMetadata(page: any): BlogPost {
  const props = page.properties || {};

  // タイトルプロパティの名前候補（日本語または英語）
  const titleProp =
    props['タイトル'] || props['Title'] || props['Name'];

  return {
    id: page.id,
    title: titleProp?.title?.[0]?.plain_text || '',
    slug: props['Slug']?.rich_text?.[0]?.plain_text || '',
    status: props['Status']?.select?.name || '',
    category: props['Category']?.select?.name || '',
    tags: props['Tags']?.multi_select?.map((t: any) => t.name) || [],
    date: props['公開日']?.date?.start || '',
    description: props['Description']?.rich_text?.[0]?.plain_text || '',
    youtubeUrl: props['YouTube URL']?.url || '',
    correctionVideoUrl: props['訂正動画 URL']?.url || '',
    heroImage: props['アイキャッチURL']?.url || '',
  };
}
