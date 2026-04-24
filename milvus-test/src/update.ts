import { OllamaEmbeddings } from '@langchain/ollama';
import { MilvusClient } from '@zilliz/milvus2-sdk-node';

const COLLECTION_NAME = 'ai_diary';

const embeddings = new OllamaEmbeddings({
  model: 'bge-m3',
});

const client = new MilvusClient({
  address: 'localhost:19530',
});

async function getEmbedding(text: string) {
  return await embeddings.embedQuery(text);
}

async function main() {
  try {
    console.log('Connecting to Milvus...');
    await client.connectPromise;
    console.log('✓ Connected\n');

    // 更新数据（Milvus 通过 upsert 实现更新）
    console.log('Updating diary entry...');
    const updateId = 'diary_001';
    const updatedContent = {
      id: updateId,
      content:
        '今天下了一整天的雨，心情很糟糕。工作上遇到了很多困难，感觉压力很大。一个人在家，感觉特别孤独。',
      date: '2026-01-10',
      mood: 'sad',
      tags: ['生活', '散步', '朋友'],
    };

    console.log('Generating new embedding...');
    const vector = await getEmbedding(updatedContent.content);
    const updatedData = { ...updatedContent, vector };

    await client.upsert({
      collection_name: COLLECTION_NAME,
      data: [updatedData],
    });

    console.log(`✓ Updated diary entry: ${updateId}`);
    console.log(`  New content: ${updatedContent.content}`);
    console.log(`  New mood: ${updatedContent.mood}`);
    console.log(`  New tags: ${updatedContent.tags.join(', ')}\n`);
  } catch (error: unknown) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  }
}

main();
