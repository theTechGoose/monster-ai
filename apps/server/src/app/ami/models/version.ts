import {I_Answer, I_Question} from "./index"

export interface I_Version {
  id: string
  questions: Array<I_Question>
  answers: Array<I_Answer>
}

