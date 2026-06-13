#!/usr/bin/env node

// ============================================================================
// Follow Builders — Format Digest (HTML Email, no AI needed)
// ============================================================================
// Reads prepare-digest.js output and formats it into a beautiful HTML email.
// No LLM API required.

import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(lang) {
  const now = new Date();
  if (lang === 'zh') {
    return `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日`;
  }
  return now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function buildEmail(data, lang) {
  const dateStr = formatDate(lang);
  const isZh = lang === 'zh';

  // Stats
  const totalTweets = data.x ? data.x.reduce((sum, b) => sum + (b.tweets?.length || 0), 0) : 0;
  const totalBuilders = data.x ? data.x.filter(b => b.tweets && b.tweets.length > 0).length : 0;
  const totalPodcasts = data.podcasts?.length || 0;
  const totalBlogs = data.blogs?.length || 0;

  let html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<center style="width:100%;background:#f5f5f5;padding:20px 0;">

<!-- Main Container -->
<table width="600" cellpadding="0" cellspacing="0" style="margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

<!-- Header -->
<tr>
<td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);padding:30px 40px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">
${isZh ? '🤖 AI Builders 动态' : '🤖 AI Builders Digest'}
</h1>
<p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${dateStr}</p>
</td>
</tr>

<!-- Stats Bar -->
<tr>
<td style="background:#fafafa;padding:16px 40px;border-bottom:1px solid #eee;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="text-align:center;width:25%;">
<span style="font-size:20px;">🐦</span><br>
<span style="font-size:22px;font-weight:700;color:#333;">${totalBuilders}</span><br>
<span style="font-size:11px;color:#888;">${isZh ? '构建者' : 'Builders'}</span>
</td>
<td style="text-align:center;width:25%;">
<span style="font-size:20px;">💬</span><br>
<span style="font-size:22px;font-weight:700;color:#333;">${totalTweets}</span><br>
<span style="font-size:11px;color:#888;">${isZh ? '推文' : 'Tweets'}</span>
</td>
<td style="text-align:center;width:25%;">
<span style="font-size:20px;">🎙️</span><br>
<span style="font-size:22px;font-weight:700;color:#333;">${totalPodcasts}</span><br>
<span style="font-size:11px;color:#888;">${isZh ? '播客' : 'Podcasts'}</span>
</td>
<td style="text-align:center;width:25%;">
<span style="font-size:20px;">📝</span><br>
<span style="font-size:22px;font-weight:700;color:#333;">${totalBlogs}</span><br>
<span style="font-size:11px;color:#888;">${isZh ? '博客' : 'Blogs'}</span>
</td>
</tr>
</table>
</td>
</tr>

<!-- Content -->
<tr>
<td style="padding:30px 40px;">
`;

  // ---- X/Twitter Section ----
  if (data.x && data.x.length > 0) {
    const activeBuilders = data.x.filter(b => b.tweets && b.tweets.length > 0);
    if (activeBuilders.length > 0) {
      html += `
<!-- X/Twitter Section -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="padding-bottom:6px;">
<h2 style="margin:0;font-size:18px;color:#333;">🐦 ${isZh ? '推特动态' : 'X / Twitter'}</h2>
</td>
</tr>
`;
      for (const builder of activeBuilders) {
        html += `
<tr>
<td style="padding:16px 0;border-top:1px solid #f0f0f0;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td style="width:100%;">
<span style="font-size:15px;font-weight:600;color:#667eea;">${escapeHtml(builder.name)}</span>
<span style="font-size:12px;color:#999;">@${escapeHtml(builder.handle)}</span>
</td>
</tr>
`;
        for (const tweet of builder.tweets) {
          const tweetText = tweet.text.replace(/\n/g, ' ').substring(0, 200);
          const isLong = tweet.text.length > 200;
          html += `
<tr>
<td style="padding:6px 0 2px;">
<p style="margin:0;font-size:14px;color:#444;line-height:1.5;">${escapeHtml(tweetText)}${isLong ? '...' : ''}</p>
<a href="${escapeHtml(tweet.url)}" style="font-size:12px;color:#667eea;text-decoration:none;">${isZh ? '查看原文 →' : 'Read more →'}</a>
</td>
</tr>
`;
        }
        html += `</table></td></tr>`;
      }
      html += `</table>`;
    }
  }

  // ---- Blogs Section ----
  if (data.blogs && data.blogs.length > 0) {
    html += `
<!-- Blogs Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
<tr>
<td style="padding-bottom:6px;">
<h2 style="margin:0;font-size:18px;color:#333;">📝 ${isZh ? '官方博客' : 'Blogs'}</h2>
</td>
</tr>
`;
    for (const blog of data.blogs) {
      const preview = blog.content ? blog.content.replace(/\n+/g, ' ').substring(0, 250) : '';
      html += `
<tr>
<td style="padding:16px 0;border-top:1px solid #f0f0f0;">
<a href="${escapeHtml(blog.url)}" style="font-size:15px;font-weight:600;color:#667eea;text-decoration:none;">${escapeHtml(blog.title)}</a>
${preview ? `<p style="margin:6px 0 2px;font-size:13px;color:#666;line-height:1.5;">${escapeHtml(preview)}...</p>` : ''}
<a href="${escapeHtml(blog.url)}" style="font-size:12px;color:#667eea;text-decoration:none;">${isZh ? '阅读全文 →' : 'Read more →'}</a>
</td>
</tr>
`;
    }
    html += `</table>`;
  }

  // ---- Podcasts Section ----
  if (data.podcasts && data.podcasts.length > 0) {
    html += `
<!-- Podcasts Section -->
<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
<tr>
<td style="padding-bottom:6px;">
<h2 style="margin:0;font-size:18px;color:#333;">🎙️ ${isZh ? '播客' : 'Podcasts'}</h2>
</td>
</tr>
`;
    for (const pod of data.podcasts) {
      const preview = pod.transcript ? pod.transcript.replace(/\n+/g, ' ').substring(0, 250) : '';
      html += `
<tr>
<td style="padding:16px 0;border-top:1px solid #f0f0f0;">
<span style="font-size:12px;color:#999;background:#f0f0f0;padding:2px 8px;border-radius:4px;">${escapeHtml(pod.name)}</span>
<a href="${escapeHtml(pod.url)}" style="display:block;margin-top:6px;font-size:15px;font-weight:600;color:#667eea;text-decoration:none;">${escapeHtml(pod.title || '')}</a>
${preview ? `<p style="margin:6px 0 2px;font-size:13px;color:#666;line-height:1.5;">${escapeHtml(preview)}...</p>` : ''}
<a href="${escapeHtml(pod.url)}" style="font-size:12px;color:#667eea;text-decoration:none;">${isZh ? '收听 →' : 'Listen →'}</a>
</td>
</tr>
`;
    }
    html += `</table>`;
  }

  // ---- Footer ----
  html += `
<!-- Footer -->
</td>
</tr>
<tr>
<td style="background:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
<p style="margin:0;font-size:12px;color:#999;">
${isZh ? '由' : 'Generated by'} <a href="https://github.com/zarazhangrui/follow-builders" style="color:#667eea;text-decoration:none;">Follow Builders</a> ${isZh ? '生成' : ''}
</p>
<p style="margin:4px 0 0;font-size:11px;color:#bbb;">
${isZh ? '追踪 26 位 AI 构建者 · 每日自动推送' : 'Tracking 26 AI builders · Daily digest'}
</p>
</td>
</tr>

</table>
</center>
</body>
</html>`;

  return html;
}

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath || !existsSync(inputPath)) {
    console.error('Usage: node format-digest.js <input.json>');
    process.exit(1);
  }

  const data = JSON.parse(await readFile(inputPath, 'utf-8'));
  const lang = process.env.DIGEST_LANGUAGE || data.config?.language || 'zh';

  const html = buildEmail(data, lang);
  console.log(html);
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
