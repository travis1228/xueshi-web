const COZE_API_TOKEN = process.env.COZE_API_TOKEN;
const COZE_BOT_ID = process.env.COZE_BOT_ID;
const COZE_BASE_URL = 'https://api.coze.cn/v3/chat';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!COZE_API_TOKEN) return res.status(500).json({ error: 'API token not configured' });

    const { message, lesson, session } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    try {
        const systemContext = `你是"学识"AI伴学导师。用户正在学习第${lesson || 1}课。请根据课程内容回答用户的问题，保持专业、友善、简洁。`;
        const response = await fetch(COZE_BASE_URL, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${COZE_API_TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ bot_id: COZE_BOT_ID || 'default', user_id_message: session || 'web-user', additional_messages: [{ role: 'user', content: message, content_type: 'text' }] })
        });
        if (!response.ok) { const errorData = await response.text(); console.error('Coze API error:', response.status, errorData); return res.status(response.status).json({ error: 'Failed to call Coze API', detail: errorData }); }
        const data = await response.json();
        let reply = '';
        if (data.data && data.data.messages) { const m = data.data.messages.find(m => m.role === 'assistant'); if (m) reply = m.content || ''; }
        else if (data.messages) { const m = data.messages.find(m => m.role === 'assistant'); if (m) reply = m.content || ''; }
        if (!reply) reply = '我理解了你的问题，但暂时无法给出完整回答。请稍后再试。';
        return res.status(200).json({ reply });
    } catch (error) { console.error('Server error:', error); return res.status(500).json({ error: 'Internal server error', reply: '服务器出错了，请稍后再试。' }); }
}
