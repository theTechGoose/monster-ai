export function analyzeText(text: string, removeDedupe = false) {
    // split text into lines
    const lines = text.split(/\r?\n/);

    // object to store unique lines and their count
    let uniqueLines = {};

    // object to store unique characters and their count
    let uniqueChars = {};

    // array to store deduplicated lines
    let dedupedLines = [];

    // iterate over lines
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // add line to uniqueLines object and increment count
        uniqueLines[line] = (uniqueLines[line] || 0) + 1;

        // add line to dedupedLines array if it's not the same as the previous line
        if (i == 0 || line != lines[i - 1].trim()) {
            dedupedLines.push(line);
        }

        // iterate over characters in line
        for (let j = 0; j < line.length; j++) {
            let char = line[j];

            // add char to uniqueChars object and increment count
            uniqueChars[char] = (uniqueChars[char] || 0) + 1;
        }
    }

    // count unique lines and characters
    let uniqueLineCount = Object.keys(uniqueLines).length;
    let uniqueCharCount = Object.keys(uniqueChars).length;

    // count total characters after deduplication
    let dedupedCharCount = 0;
    for (let char in uniqueChars) {
        dedupedCharCount += uniqueChars[char] > 0 ? 1 : 0;
    }

    // Convert dedupedLines array back to string
    let dedupedText = dedupedLines.join("\n");

    // return results

    const output = {
        uniqueLineCount: uniqueLineCount,
        uniqueCharCount: uniqueCharCount,
        dedupedText: dedupedText
    };
  if(removeDedupe) delete output.dedupedText
  return output
}
