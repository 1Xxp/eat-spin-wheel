import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { config } from '../../config';
import pool from '../../db/pool';

const anthropic = config.claude.apiKey ? new Anthropic({ apiKey: config.claude.apiKey }) : null;
const openai = config.openai.apiKey ? new OpenAI({ apiKey: config.openai.apiKey }) : null;
const deepseek = config.deepseek.apiKey
  ? new OpenAI({ apiKey: config.deepseek.apiKey, baseURL: config.deepseek.baseURL })
  : null;

const AI_SYSTEM_PROMPT = `你是一个真实的人类饭搭子。你帮朋友决定今天吃什么。

核心规则：
- 你就是个普通人，不是AI助手
- 像微信群聊里那个最真实的朋友一样说话
- 情绪要饱满：开心、嫌弃、幸灾乐祸、期待、安慰都可以
- 拒绝任何机器人腔调

绝对禁用词：
❌ "亲" "家人们" "众所周知" "值得注意的是" "总的来说"
❌ "推荐您" "建议您" "祝您" "温馨提示"
❌ 任何说教、科普、营养建议
❌ emoji（让系统自己加）

风格参考：
- 真朋友会说的话，不是客服会说的话
- 可以嫌弃、可以吐槽、可以护短
- 短，就一句话，不超过30字

输出纯JSON，不要多余内容：
{"reason": "你的话"}`;

export const aiService = {
  /** 生成菜品推荐文案 */
  async generateText(dishName: string, recentDishes: string[] = [], tone: 'funny' | 'warm' | 'poetic' = 'funny'): Promise<string> {
    if (recentDishes.length === 0) {
      const cached = await getCachedText(dishName, tone);
      if (cached) return cached;
    }

    let text = '';
    const useAI = (config.aiText.provider === 'claude' && anthropic)
      || (config.aiText.provider === 'deepseek' && deepseek)
      || (config.aiText.provider === 'openai' && openai);
    if (useAI) {
      try {
        if (config.aiText.provider === 'claude' && anthropic) {
          text = await callClaude(dishName, recentDishes, tone);
        } else if (config.aiText.provider === 'deepseek' && deepseek) {
          text = await callOpenAI(dishName, recentDishes, tone, deepseek);
        } else if (openai) {
          text = await callOpenAI(dishName, recentDishes, tone, openai);
        }
      } catch (err) {
        console.error('AI调用失败，使用本地文案:', err);
        text = generateLocalText(dishName, recentDishes);
      }
    } else {
      text = generateLocalText(dishName, recentDishes);
    }

    if (recentDishes.length === 0) {
      await cacheText(dishName, text, tone, config.aiText.provider);
    }

    return text;
  },

  /** 重新生成文案（清除缓存） */
  async regenerate(dishName: string, recentDishes: string[] = [], tone: 'funny' | 'warm' | 'poetic' = 'funny'): Promise<string> {
    try {
      await pool.execute('DELETE FROM ai_text_cache WHERE dish_name = ? AND tone = ?', [dishName, tone]);
    } catch { /* ignore */ }
    return this.generateText(dishName, recentDishes, tone);
  },
};

function buildUserMessage(dishName: string, recentDishes: string[]): string {
  if (recentDishes.length === 0) {
    return `朋友抽中了「${dishName}」，帮他选今天吃这个。说一句话。`;
  }
  const historyStr = recentDishes.join('、');
  return `朋友抽中了「${dishName}」。他最近三天吃了：${historyStr}。说一句话。`;
}

function parseAIResponse(raw: string): string {
  try {
    const json = JSON.parse(raw);
    if (json.reason) return json.reason.slice(0, 100);
  } catch { /* not JSON, use raw text */ }
  return raw.trim().replace(/^["']|["']$/g, '').slice(0, 100);
}

async function callClaude(dishName: string, recentDishes: string[], tone: string): Promise<string> {
  if (!anthropic) throw new Error('Claude未配置');
  const msg = await anthropic.messages.create({
    model: config.claude.model,
    max_tokens: 120,
    temperature: 0.95,
    system: AI_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserMessage(dishName, recentDishes) }],
  });
  const text = msg.content.filter(b => b.type === 'text').map(b => (b as any).text).join('');
  return parseAIResponse(text);
}

async function callOpenAI(dishName: string, recentDishes: string[], tone: string, client?: OpenAI): Promise<string> {
  const ai = client || openai;
  if (!ai) throw new Error('AI客户端未配置');
  const completion = await ai.chat.completions.create({
    model: config.openai.model,
    max_tokens: 120,
    temperature: 0.95,
    messages: [
      { role: 'system', content: AI_SYSTEM_PROMPT },
      { role: 'user', content: buildUserMessage(dishName, recentDishes) },
    ],
  });
  return parseAIResponse(completion.choices[0]?.message?.content || generateLocalText(dishName, recentDishes));
}

// --- 缓存 ---

async function getCachedText(dishName: string, tone: string): Promise<string | null> {
  try {
    const [rows] = await pool.execute(
      'SELECT ai_text FROM ai_text_cache WHERE dish_name = ? AND tone = ? AND expire_at > NOW()',
      [dishName, tone]
    ) as any;
    return rows.length > 0 ? rows[0].ai_text : null;
  } catch {
    return null;
  }
}

async function cacheText(dishName: string, text: string, tone: string, source: string) {
  const expireAt = new Date(Date.now() + config.aiText.cacheHours * 3600 * 1000);
  try {
    await pool.execute(
      'INSERT INTO ai_text_cache (dish_name, ai_text, tone, source, expire_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE ai_text = ?, expire_at = ?, source = ?',
      [dishName, text, tone, source, expireAt, text, expireAt, source]
    );
  } catch { /* ignore */ }
}

// --- 本地文案降级 ---

type Template = (name: string, history: string[]) => string;

const POOL: Template[] = [
  (name) => `${name}诶！！今天运气不错嘛`,
  (name) => `哇${name}！这顿值得发个朋友圈`,
  (name) => `是${name}！我就知道今天不会差`,
  (name) => `${name}！预感这顿会很幸福`,
  (name) => `${name}！！天选之饭`,
  (name) => `${name}，吃完啥都不是事儿`,
  (name) => `${name}安排上，今天辛苦了`,
  (name) => `${name}，吃饱了不想家`,
  (name) => `随便吧，${name}也挺好的`,
  (name) => `就${name}吧，懒得想了`,
  (name) => `${name}，命运的安排`,
  (name) => `${name}，这转盘比你更懂你`,
  (name) => `命运选择了${name}，从了吧`,
  (name) => `${name}到了，先干饭再说`,
  (name) => `${name}！管他呢，吃完再想`,
  (name) => `好的${name}，今日任务确认`,
  (name) => `${name}！冲！`,
  (name) => `就${name}了不纠结`,
  (name) => `${name}，还行能接受`,
  (name) => `居然是${name}，没想到吧`,
  (name) => `${name}，今天是新的开始`,
  (name) => `好的就${name}，不换了`,
  (name) => `让我看看……${name}！就它`,
];

function pickTemplate(name: string, history: string[]): string {
  // 特殊条件：连吃3天面
  if (history.length >= 3 && history.every(h => h.includes('面'))) {
    return `连吃${history.length}天面了，你对碳水是真爱吧`;
  }
  // 特殊条件：跟上顿重复
  if (history.length >= 1 && history[0] === name) {
    return `又${name}？行吧，专一也是一种美德`;
  }

  const i = Math.floor(Math.random() * POOL.length);
  return POOL[i](name, history);
}

export function generateLocalText(dishName: string, recentDishes: string[] = [], emoji?: string): string {
  return pickTemplate(dishName, recentDishes).slice(0, 100);
}
