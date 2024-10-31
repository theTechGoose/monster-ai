import { promisify } from 'util';
import { exec } from 'child_process';
import { readFile } from 'fs';
import os from 'os';

const MODELS = {
  tiny: 'tiny',
  base: 'base',
  medium: 'medium',
  large: 'large-v2'
}

const execAsync = promisify(exec);
const readFileAsync = promisify(readFile);

async function transcribeRecording(recordingPath: string) {
const transcriptionPath = `${os.homedir()}/transcriptions`;
const command = `PATH=/home/raphael/whisper_edit/bin:$PATH && whisperx "${recordingPath}" --output_dir "${transcriptionPath}" --model ${MODELS.large} --output_format srt --language en  --threads 5 --hf_token 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 --diarize --min_speakers 1 --max_speakers 2`;
await execAsync(command);
await execAsync('rm -rf ' + recordingPath);
  readFileAsync(${})


}
