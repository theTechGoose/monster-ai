import {I_Answer, I_Question} from "./index"

export interface I_Version {
  id: string
  digest: string
  questions: Array<I_Question>
  answers: Array<I_Answer>
  brittanica: Array<string>
}

