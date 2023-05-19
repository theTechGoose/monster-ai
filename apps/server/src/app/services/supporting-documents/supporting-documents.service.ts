import { BrittanicaService } from "../brittanica/brittanica.service";
import { LocalQuestionDataService } from "../local-question-data/local-question-data.service";
import { QuestionVectorDbService } from "../question-vector-db/question-vector-db.service";
import { LocalAnswerDataService } from "../local-answer-data/local-answer-data.service";
import { Injectable } from "@nestjs/common";
import { OpenAI } from "langchain/llms/openai";
import { I_Question, Question } from "../local-question-data/models";
import { Answer } from "../local-answer-data/models";

const initPayload = {
  openAIApiKey: process.env.OPEN_AI_KEY,
  modelName: "gpt-3.5-turbo",
};

@Injectable()
export class SupportingDocumentsService {
  constructor(
    private brittanica: BrittanicaService,
    private localQuestions: LocalQuestionDataService,
    private localAnswers: LocalAnswerDataService,
    private questionVector: QuestionVectorDbService,
  ) { }

  async query(query: string) {
    const llm = new OpenAI(initPayload);
    const supportingAnswers = await this.getSupportingAnswers(query);
    const brittanicaSupportingInfo = await this.getBrittanicaSupportingInfo(
      query,
    );
    const prompt =
      `Synthesize an in-depth and concise response to the input question, ${query}. Your answer should leverage the critical insights from the knowledge base bullet points (${brittanicaSupportingInfo}), and also take into consideration the quality and content of previously provided answers (${supportingAnswers.prompt}). These prior responses have been evaluated on a scale of 0 to 1, with 1 indicating the most effective responses. Use these ratings to inform the quality and structure of your new response to the query, ensuring it is as informative and helpful as possible.`;
    const response = await llm.call(prompt);
    const answerCursor = await this.localAnswers.set(query, response)
    await this.localQuestions.set(query, answerCursor.id)
    return {
      answers: supportingAnswers.answers,
      response,
    };
  }

  private async getSupportingAnswers(query: string) {
    try {
      const store = await this.questionVector.loadQuestionVector();
      const _results: Array<I_Question> = await store.similaritySearch(
        query,
        3,
      ) as any;
      const results = _results.map((r) => new Question(r));
      const answerIds = results.map((r) => r.metadata.relatedAnswers).flat();
      const answers = await this.localAnswers.getByIds(answerIds);
      const filtered = answers.filter((a) => {
        return a.score;
      });
      return filtered.map((a) => {
        return {
          promptChunk: `Score: ${a.score} \n\n Answer: ${a.content}`,
          answer: a,
        };
      }).reduce((acc, curr) => {
        acc.prompt += curr.promptChunk;
        acc.answers.push(curr.answer);
        return acc;
      }, { answers: [], prompt: "" });
    } catch(e) {
      console.log(e);
      return {
        answers: [],
        prompt: "",
      };
    }
  }

  private async getBrittanicaSupportingInfo(query: string) {
    const llm = new OpenAI(initPayload);
    const store = await this.brittanica.loadVectorStore();
    const results = await store.similaritySearch(query, 3);
    const summaries = results.map(async (r) => {
      const { pageContent } = r;
      const summary = await llm.call(
        `You are an EvidenceExtractionBot, assigned with the task of identifying relevant information from a provided document. Your task details are as follows:

1. Your query is: ${query}
2. The document you have for analysis is: ${pageContent}

Based on this, please generate a bulleted list of evidence from the document that could contribute to answering the query. Please adhere to the following guidelines:

- Limit your output to a maximum of three bullet points.
- Ensure that all evidence you list is directly sourced from the document and pertinent to the query.
- Do not extrapolate or infer. Your task is to identify and list direct evidence only.
- If no relevant evidence is found in the document to answer the query, provide no bullet points.`,
      );
      return {
        debug: r.pageContent,
        summary,
      };
    });
    const outputSummaries = await Promise.all(summaries);
    const evidenceLists = outputSummaries.map((s) => s.summary).join("\n\n");
    const outputPrompt =
      `You are a ConsolidationBot, and you are provided with multiple bulleted lists of potential evidence from different documents. These lists, indicated as ${evidenceLists}, were generated by other bots to help answer the query: ${query}.

Your task is to review these ${evidenceLists} and synthesize a final, concise list of the top three pieces of evidence that will most effectively answer the query. Please follow these guidelines:

- Your final list should contain a maximum of four bullet points.
- Choose evidence that directly addresses the query, and is most relevant and compelling based on your assessment.
- In the event of overlapping or redundant evidence, consolidate such points into a single, more effective bullet point.
- If the provided lists do not contain enough relevant evidence to fill three bullet points, it is acceptable to provide fewer.
- The goal is not to fill the list, but to ensure that every piece of evidence included is of high value and relevance to the query."

Remember, the key is to make the final list as impactful and helpful as possible for answering ${query}.`;
    return llm.call(outputPrompt);
  }
}
