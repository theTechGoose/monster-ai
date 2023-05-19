import {getService} from "../../../testing/get-service"
import {SupportingDocumentsService} from "./supporting-documents.service"
import {LocalAnswerDataService} from "../local-answer-data/local-answer-data.service"
import {QuestionVectorDbService} from "../question-vector-db/question-vector-db.service"
import {LocalQuestionDataService} from "../local-question-data/local-question-data.service"
import { Answer } from "../local-answer-data/models"


(async () => {
  const service = await getService<SupportingDocumentsService>(SupportingDocumentsService)

  const localAnswer = await getService<LocalAnswerDataService>(LocalAnswerDataService)
  // const questionVector = await getService<QuestionVectorDbService>(QuestionVectorDbService)
  const localQuestion = await getService<LocalQuestionDataService>(LocalQuestionDataService)


   const result = await service.query("Where can I stay in punta cana?")
   console.log(result.answers);

   const m = result.answers.map(async (a: Answer) => {
     const randomUpOrDown = function() {
       return Math.random() > 0.5 ? 'up' : 'down'
     }
     console.log('running1');
     const r1 = await localAnswer.vote(randomUpOrDown(), a.id)
     console.log('running2');
     const r2 = await localAnswer.vote(randomUpOrDown(), a.id)
     console.log('running3');
     const r3 = await localAnswer.vote(randomUpOrDown(), a.id)
     return [r1, r2, r3]
   })


   const res = await Promise.all(m)
   console.log({result});
   console.log(res);

})()
