import { BaseMessage, HumanMessage, ToolMessage } from '@langchain/core/messages';
import { ChatDeepSeek } from '@langchain/deepseek';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import chalk from 'chalk';
import 'dotenv/config';

const model = new ChatDeepSeek({
  model: 'deepseek-chat',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    'amap-maps-streamableHTTP': {
      url: 'https://mcp.amap.com/mcp?key=' + process.env.AMAP_MAPS_API_KEY,
    },
    filesystem: {
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-filesystem',
        ...(process.env.ALLOWED_PATH?.split(',') || ''),
      ],
    },
  },
});

const tools = await mcpClient.getTools();
const modelWithTools = model.bindTools(tools);

async function runAgentWithTools(query: string, maxIterations = 30) {
  const messages: BaseMessage[] = [new HumanMessage(query)];

  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen(`⏳ 正在等待 AI 思考...`));
    const response = await modelWithTools.invoke(messages);
    messages.push(response);

    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log(`\n✨ AI 最终回复:\n${response.content}\n`);
      return response.content;
    }

    console.log(chalk.bgBlue(`🔍 检测到 ${response.tool_calls.length} 个工具调用`));
    console.log(chalk.bgBlue(`🔍 工具调用: ${response.tool_calls.map((t) => t.name).join(', ')}`));

    for (const toolCall of response.tool_calls) {
      const foundTool = tools.find((t) => t.name === toolCall.name);
      if (foundTool) {
        const toolResult = await foundTool.invoke(toolCall.args);

        messages.push(
          new ToolMessage({
            content: toolResult,
            tool_call_id: toolCall.id as string,
          })
        );
      }
    }
  }

  return messages[messages.length - 1].content;
}

await runAgentWithTools(
  '北京南站附近的酒店，以及去的路线，，路线规划生成文档保存到 /Users/caiyanhu/Documents/code/frontend-ai-agent/ 的一个 md 文件'
);
await mcpClient.close();
