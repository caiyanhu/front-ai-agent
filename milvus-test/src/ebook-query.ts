import { OllamaEmbeddings } from '@langchain/ollama';
import { MetricType, MilvusClient } from '@zilliz/milvus2-sdk-node';

const COLLECTION_NAME = 'ebook_collection';

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
    console.log('✓ Connected\n'); // 确保集合已加载

    try {
      await client.loadCollection({ collection_name: COLLECTION_NAME });
      console.log('✓ 集合已加载\n');
    } catch (error: unknown) {
      if (!(error instanceof Error && error.message.includes('already loaded'))) {
        throw error;
      }
      console.log('✓ 集合已处于加载状态\n');
    } // 向量搜索

    console.log('Searching for similar ebook content...');
    const query = '乔峰会什么武功？';
    console.log(`Query: "${query}"\n`);

    const queryVector = await getEmbedding(query);
    const searchResult = await client.search({
      collection_name: COLLECTION_NAME,
      vector: queryVector,
      limit: 3,
      metric_type: MetricType.COSINE,
      output_fields: ['id', 'book_id', 'chapter_num', 'index', 'content'],
    });

    console.log(`Found ${searchResult.results.length} results:\n`);
    searchResult.results.forEach((item, index) => {
      console.log(`${index + 1}. [Score: ${item.score.toFixed(4)}]`);
      console.log(`   ID: ${item.id}`);
      console.log(`   Book ID: ${item.book_id}`);
      console.log(`   Chapter: 第 ${item.chapter_num} 章`);
      console.log(`   Index: ${item.index}`);
      console.log(`   Content: ${item.content}\n`);
    });
  } catch (error: unknown) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
  }
}

main();
