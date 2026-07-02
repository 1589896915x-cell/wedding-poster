// /api/keepalive.js
// 作用：被 Vercel Cron 每天调用一次，向 Supabase 发一个轻量读请求，
// 防止免费版项目因“7 天无请求”自动休眠。
// 部署后可直接浏览器访问 https://你的域名/api/keepalive 验证，应返回 JSON。

const SB_URL = 'https://kyemjxgdmkupfkntflzh.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5ZW1qeGdkbWt1cGZrbnRmbHpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNDI1OTcsImV4cCI6MjA5MTYxODU5N30.rJ-dxDkaxI5-aM_FAew9p1aD33I1H7h_HK9NGboUjvo';

export default async function handler(req, res) {
  try {
    const r = await fetch(`${SB_URL}/rest/v1/templates?select=id&limit=1`, {
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY }
    });
    res.status(200).json({
      alive: true,
      supabase: r.ok ? 'ok' : 'http ' + r.status,
      at: new Date().toISOString()
    });
  } catch (e) {
    // 即使 Supabase 没连上也返回 200，避免 Cron 记为失败；错误信息留在响应里便于排查
    res.status(200).json({ alive: true, supabase: 'error', detail: String(e), at: new Date().toISOString() });
  }
}
