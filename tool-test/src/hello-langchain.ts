import { ChatDeepSeek } from '@langchain/deepseek';
import 'dotenv/config';

const model = new ChatDeepSeek({
  model: 'deepseek-chat',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const response = await model.invoke('介绍下自己');
console.log(response.content);
