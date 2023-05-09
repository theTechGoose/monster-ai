import {getService} from "../../../testing/get-service"
import {BrittanicaService} from "./brittanica.service"


(async () => {
  const docs = await runVectorQuery('how many people can go to punta cana?', 3)
  console.log({len:  docs.length, content: docs.map(d => d.pageContent)});
})()


async function saveVectorStore() {
  console.log('ntfy: starting scrape');
  const docs = await testPuppet()
  console.log('ntfy: scrape complete');
  const service = await getService<BrittanicaService>(BrittanicaService);
  service.saveVectorStore(docs)
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
