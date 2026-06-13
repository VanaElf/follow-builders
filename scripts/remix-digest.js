#!/usr/bin/env node

// ============================================================================
// Follow Builders — Remix Digest with Gemini
// ============================================================================

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent';

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath || !existsSync(inputPath)) {
    console.error('Usage: node remix-digest.js <input.json>');
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY environment variable is required');
    process.exit(1);
  }

  const data = JSON.parse(await readFile(inputPath, 'utf-8'));
  const language = process.env.DIGEST_LANGUAGE || data.config?.language || 'zh';

  const systemPrompt = `你是一个 AI 行业内容策展人。你的任务是将 AI 构建者的原始动态数据重混为一份精简的中文摘要。

核心规则：
- 每个 builder 只用一句话概括，30秒内能扫完
- 只保留有实质内容的信息：观点、产品发布、技术讨论
- 跳过：日常闲聊、纯转发、宣传口水话
- 每条内容必须附带原文链接
- 不编造任何内容，只写数据里有的
- 格式：名字（公司/角色）：一句话概括 | 链接

博客和播客：100-150字概括核心要点。

输出格式：
AI Builders 摘要 — ${new Date().toLocaleDateString('zh-CN')}

🐦 推特动态
（每个builder一行）

📝 官方博客
（每篇一行）

🎙️ 播客
（每集一段）

结尾加一行：由 Follow Builders 生成: https://github.com/zarazhangrui/follow-builders`;

  const contentForGemini = {
    config: data.config,
    stats: data.stats,
    x: data.x.map(builder => ({
      name: builder.name,
      handle: builder.handle,
      bio: builder.bio,
      tweets: builder.tweets.map(t => ({
        text: t.text,
        url: t.url
      }))
    })),
    podcasts: data.podcasts.map(p => ({
      name: p.name,
      title: p.title,
      url: p.url,
      publishedAt: p.publishedAt,
      transcript: p.transcript ? p.transcript.substring(0, 8000) : undefined
    })),
    blogs: data.blogs.map(b => ({
      title: b.title,
      url: b.url,
      content: b.content ? b.content.substring(0, 8000) : undefined
    }))
  };

  const userMessage = JSON.stringify(contentForGemini, null, 2);

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: systemPrompt },
          { text: `以下是今日的 AI Builders 数据，请按上述规则生成摘要：\n\n${userMessage}` }
        ]
      }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 4096
      }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`Gemini API error: ${response.status} ${err}`);
    process.exit(1);
  }

  const result = await response.json();
  const digestText = result.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!digestText) {
    console.error('Gemini returned empty response');
    process.exit(1);
  }

  console.log(digestText);
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
