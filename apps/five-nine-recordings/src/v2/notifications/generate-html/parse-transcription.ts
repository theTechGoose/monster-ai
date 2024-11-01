interface ParsedTranscript {
  speaker: string;
  text: string;
}

export function parseTranscription(transcription: string): ParsedTranscript[] {
  const lines = transcription.split('\n');
  const parsed: ParsedTranscript[] = [];
  let currentSpeaker = '';
  let currentText = '';

  for (const line of lines) {
    // Skip lines with timestamps, numbering, or trailing numbers
    if (/^\d+\s|\d{2}:\d{2}:\d{2},\d{3}\s-->\s\d{2}:\d{2}:\d{2},\d{3}|\d+$/.test(line)) {
      continue;
    }

    const speakerMatch = line.match(/\[SPEAKER_(\d+)\]:/);
    if (speakerMatch) {
      // If we have current speaker and text, add it to parsed before switching speakers
      if (currentSpeaker && currentText) {
        parsed.push({
          speaker: currentSpeaker === '01' ? 'Assistant' : 'User',
          text: currentText.trim(),
        });
      }

      currentSpeaker = speakerMatch[1];
      currentText = line.replace(/\[SPEAKER_\d+\]:/, '').trim();
    } else {
      // Otherwise, continue accumulating text for the current speaker
      currentText += ` ${line.trim()}`;
    }
  }

  // Add any remaining text
  if (currentSpeaker && currentText) {
    parsed.push({
      speaker: currentSpeaker === '01' ? 'Assistant' : 'User',
      text: currentText.trim(),
    });
  }

  return parsed;
}
