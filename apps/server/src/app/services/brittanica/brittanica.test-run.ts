import {getService} from "../../../testing/get-service"
import {BrittanicaService} from "./brittanica.service"
// @ts-ignore
import similarity from "compute-cosine-similarity"
import {Document} from "langchain/document"

(async () => {
  await checkEmbeddings()
  // const docs = await runVectorQuery('where can I go in punta cana', 2)
  // console.log(docs);
  // await saveVectorStore()

})()


async function saveVectorStore() {
  console.log('ntfy: starting scrape');
  const docs = await testPuppet()
  console.log('ntfy: scrape complete');
  const service = await getService<BrittanicaService>(BrittanicaService);
  service.saveVectorStore(docs)
}


async function checkEmbeddings() {
  const service = await getService<BrittanicaService>(BrittanicaService);
  const store = await service.loadVectorStore()
  const doc = store.docstore._docs.get('0')
  const index = store._index.getPoint(0)
  const control = await store.embeddings.embedDocuments([doc.pageContent])
  const testDoc = new Document({pageContent: 'the quick brown fox jumped over the lazy dog'})
  const control2 = await store.embeddings.embedDocuments([testDoc.pageContent])
  const score = similarity(index, control2[0])
  console.log(score);
}


async function runVectorQuery(query: string, k: number) {
  const service = await getService<BrittanicaService>(BrittanicaService);
  const store = await service.loadVectorStore()
  const results = store.similaritySearch(query, k)
  return results
}


async function testPuppet() {
  const service = await getService<BrittanicaService>(BrittanicaService);
  const result = await service.getAll();
  return result
}
