import {I_Answer, I_Question} from "./index"

export interface I_RefinedDocuments {
  usedQuestions: Array<I_Question>
  usedAnswers: Array<I_Answer>
  currentQuestion: I_Question
  refinedBrittanicaDoc: string
  refinedAnswerDoc: string
}
