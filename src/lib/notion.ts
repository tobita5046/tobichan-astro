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

// ===========================
// YouTube URL → 埋め込みiframe変換
// ===========================

/** YouTube URLから動画IDを抽出 */
function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/** YouTube埋め込みHTMLを生成 */
function makeYouTubeEmbed(videoId: string): string {
  return `\n\n<div class="video-embed"><iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>\n\n`;
}

// ===========================
// Notion ブロック → Markdown カスタム変換
// ===========================

// video ブロック（/video コマンドで挿入）
n2m.setCustomTransformer('video', async (block: any) => {
  const v = block.video;
  let url = '';
  if (v?.type === 'external') {
    url = v.external?.url || '';
  } else if (v?.type === 'file') {
    url = v.file?.url || '';
  }
  const videoId = extractYouTubeVideoId(url);
  if (videoId) return makeYouTubeEmbed(videoId);
  return url ? `[動画を見る](${url})` : '';
});

// embed ブロック（/embed コマンドで挿入）
n2m.setCustomTransformer('embed', async (block: any) => {
  const url = block.embed?.url || '';
  const videoId = extractYouTubeVideoId(url);
  if (videoId) return makeYouTubeEmbed(videoId);
  return url ? `[${url}](${url})` : '';
});

// bookmark ブロック（URLをブックマーク形式で貼った場合）
n2m.setCustomTransformer('bookmark', async (block: any) => {
  const url = block.bookmark?.url || '';
  const videoId = extractYouTubeVideoId(url);
  if (videoId) return makeYouTubeEmbed(videoId);
  return url ? `[${url}](${url})` : '';
});

// link_preview ブロック（リンクプレビュー）
n2m.setCustomTransformer('link_preview', async (block: any) => {
  const url = block.link_preview?.url || '';
  const videoId = extractYouTubeVideoId(url);
  if (videoId) return makeYouTubeEmbed(videoId);
  return url ? `[${url}](${url})` : '';
});

// ===========================
// 型定義
// ===========================

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

// ===========================
// Notion DB 取得関数
// ===========================

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

  // marked: HTMLタグはそのまま通す（sanitize無効）
  const html = await marked.parse(markdown, {
    breaks: false,
    gfm: true,
  });

  return { post, html };
}

/**
 * Notionページのプロパティを BlogPost 型に変換
 */
function parsePostMetadata(page: any): BlogPost {
  const props = page.properties || {};

  const titleProp = props['タイトル'] || props['Title'] || props['Name'];

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
