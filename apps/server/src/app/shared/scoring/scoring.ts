import { I_Answer } from "../../services/local-answer-data/models";

export function calculateScore(answer: Omit<I_Answer, "_id">) {
  const { upVotes, downVotes } = answer;
  return upVotes - downVotes;
}

export function calculateTotalVotes(answer: Omit<I_Answer, "_id">) {
  const { upVotes, downVotes } = answer;
  return upVotes + downVotes;
}

export function calculateShowChance(answer: Omit<I_Answer, "_id">) {
  const score = calculateScore(answer);
  if (score < 0) {
    if (score > -3) return 0.2;
    if (score > -7) return 0.15;
    if (score > -10) return 0.1;
    return 0;
  } else {
    const { upVotes, downVotes } = answer;
    const totalvotes = downVotes + upVotes;
    let outputVotes = totalvotes;
    if (totalvotes <= 10) {
      const bonus = (upVotes / downVotes) / 2;
      outputVotes -= bonus;
    }

    const score = (upVotes - downVotes) + 0.25;
    const unadjustedOutput = Number((score / totalvotes).toFixed(2));
    let output = Number((score / outputVotes).toFixed(2));

    const overAdd = (1 - unadjustedOutput) / 2;
    output = output > 1 ? overAdd + unadjustedOutput : output;
    output = Number(output.toFixed(2));
    if(downVotes === 0 && upVotes > 0) return 1;
    return Number.isNaN(output) ? 0.9 : output;
  }
}
