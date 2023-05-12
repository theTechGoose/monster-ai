import {getService} from "../../../testing/get-service"
import {LocalAnswerDataService} from "./local-answer-data.service"

(async () => {
  await case1()
})()



async function case1() {
  const service = await getService<LocalAnswerDataService>(LocalAnswerDataService)
  await service.set('123', '345')
}
