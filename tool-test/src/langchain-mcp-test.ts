import { ChatDeepSeek } from '@langchain/deepseek';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import 'dotenv/config';
import { BaseMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import chalk from 'chalk';

const model = new ChatDeepSeek({
  model: 'deepseek-chat',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const mcpClient = new MultiServerMCPClient({
  mcpServers: {
    'my-mcp-server': {
      command: 'npx',
      args: ['tsx', '/Users/caiyanhu/Documents/code/front-ai-agent/tool-test/src/my-mcp-server.ts'],
    },
  },
});

const tools = await mcpClient.getTools();
const modelWithTools = model.bindTools(tools);

let resourceContent = '';
const res = await mcpClient.listResources();
for (const [serverName, resources] of Object.entries(res)) {
  for (const resource of resources) {
    const content = await mcpClient.readResource(serverName, resource.uri);
    resourceContent += content[0].text;
  }
}

async function runAgentWithTools(query: string, maxIterations = 30) {
  const messages: BaseMessage[] = [new SystemMessage(resourceContent), new HumanMessage(query)];

  for (let i = 0; i < maxIterations; i++) {
    console.log(chalk.bgGreen(`⏳ 正在等待 AI 思考...`));

    const response = await modelWithTools.invoke(messages);
    messages.push(response);

    // 检查是否有工具调用
    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log(`\n✨ AI 最终回复:\n${response.content}\n`);
      return response.content;
    }

    console.log(chalk.bgBlue(`🔍 检测到 ${response.tool_calls.length} 个工具调用`));
    console.log(chalk.bgBlue(`🔍 工具调用: ${response.tool_calls.map((t) => t.name).join(', ')}`));

    // 执行工具调用
    for (const toolCall of response.tool_calls) {
      const foundTool = tools.find((t) => t.name === toolCall.name);
      if (foundTool) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const toolResult = await (foundTool as any).invoke(toolCall.args);
        messages.push(
          new ToolMessage({
            content: toolResult,
            tool_call_id: toolCall.id ?? '',
          })
        );
      }
    }
  }

  return messages[messages.length - 1].content;
}

await runAgentWithTools('MCP Server的使用指南是什么？');

await mcpClient.close();
