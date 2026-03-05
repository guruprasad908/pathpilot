require('dotenv').config({ path: '.env.local' });
const { OpenAI } = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function testOpenAI() {
    console.log('Testing connection to OpenAI...');
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Say "API connection works perfectly!"' }],
            max_tokens: 20,
        });
        console.log('✅ OpenAI Response:', response.choices[0].message.content);
    } catch (error) {
        console.error('❌ OpenAI Connection failed:', error.message);
    }
}

testOpenAI();
