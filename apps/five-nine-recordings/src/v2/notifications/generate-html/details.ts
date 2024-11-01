interface CardData {
  [key: string]: string;
}

interface TranscriptLine {
  speaker: string;
  text: string;
}

interface GeneratedDetails {
  detailsSections: string;
  additionalStyles: string;
}

function generateDetailsSections(cardData: CardData, transcript: TranscriptLine[], title: string = 'Transferred Call Details'): GeneratedDetails {
  const detailsGrid = createDetailsGrid(cardData);
  const detailsSectionsContent = createCallCard(detailsGrid, transcript);

  return {
    detailsSections: wrapInSection(detailsSectionsContent, title),
    additionalStyles: getAdditionalStyles(),
  };
}

function createDetailsGrid(cardData: CardData): string {
  return `
    <div class="details-grid">
      ${Object.entries(cardData)
        .map(([label, value]) => createDetailItem(label, value, getIconForLabel(label)))
        .join('')}
    </div>
  `;
}

function wrapInSection(content: string, title: string): string {
  return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      ${content}
    </div>
  `;
}

function createCallCard(detailsGrid: string, transcript: TranscriptLine[]): string {
  return `
    <div class="call-card">
      ${detailsGrid}
      ${createTranscript(transcript)}
    </div>
  `;
}

function createDetailItem(label: string, value: string, icon: string, additionalClass: string = ''): string {
  return `
    <div class="detail-item">
      <i class="${additionalClass}" data-feather="${icon}"></i>
      <div class="detail-text">
        <span>${label}:</span>
        <strong>${value}</strong>
      </div>
    </div>
  `;
}

function getIconForLabel(label: string): string {
  switch (label) {
    case 'Was Bot Fault':
    case 'Confirmed':
      return label === 'Was Bot Fault' || label === 'Confirmed' ? 'alert-triangle' : 'check-circle';
    case 'Leg ID':
      return 'link';
    case 'Latest Disposition':
      return 'info';
    default:
      return 'info';
  }
}

function createTranscript(transcript: TranscriptLine[]): string {
  return `
    <h4 class="transcript-title"><i data-feather="message-circle"></i> Transcript</h4>
    <div class="transcript">
      ${formatTranscript(transcript)}
    </div>
  `;
}

function formatTranscript(transcript: TranscriptLine[]): string {
  return transcript
    .filter(({ speaker }) => speaker.trim())
    .map((line) => {
      const sanitizedSpeaker = sanitizeSpeaker(line.speaker);
      return `
        <p class="speaker-${sanitizedSpeaker}"><strong>${sanitizedSpeaker}:</strong> ${line.text}</p>
      `;
    })
    .join('');
}

function sanitizeSpeaker(speaker: string): string {
  return speaker.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

function getAdditionalStyles(): string {
  return `
    .section {
      padding: 20px;
      background: #f4f7fa;
      border-radius: 12px;
      margin: 20px 0;
    }
    .marked {
      color: #F39C12;
    }
    .section-title {
      font-size: 2rem;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 20px;
    }
    .call-card {
      background: linear-gradient(to bottom right, #ecf5fc, #ffffff);
      padding: 25px;
      margin-bottom: 30px;
      border-radius: 15px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      transform: translateY(-5px);
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .details-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 25px;
    }
    .detail-item {
      flex: 1 1 220px;
      display: flex;
      align-items: center;
      background: #e6f0f9;
      padding: 15px 20px;
      border-radius: 12px;
      border: 1px solid #d1e4f1;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transition: background 0.3s, box-shadow 0.3s;
    }
    .detail-item i {
      margin-right: 10px;
      color: #3498db;
      width: 28px;
      height: 28px;
    }
    .detail-text {
      margin-left: 10px;
      flex-direction: column;
      color: #34495e;
      font-size: 1rem;
    }
    .transcript-title {
      font-size: 1.4rem;
      color: #2980b9;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
    }
    .transcript {
      background: #f7f9fc;
      padding: 20px;
      border-radius: 10px;
      border: 1px solid #e1e8ed;
    }
    .transcript p {
      margin: 10px 0;
      padding: 12px 15px;
      border-radius: 8px;
      font-size: 1rem;
      line-height: 1.5;
      border-left: 4px solid #bdc3c7;
    }
    .transcript .speaker-ASSISTANT {
      background: #eaf5fc;
      border-left-color: #3498db;
    }
    .transcript .speaker-USER {
      background: #e8f7e9;
      border-left-color: #2ecc71;
    }
  `;
}

// Test function to populate the DOM
export function run(_cardData?: CardData, _transcript?: TranscriptLine[], _title: string = 'Transferred Call Details'): {html: string, append: Function} {
  const DcardData: CardData = {
    'Call ID': '12345',
    'Was Bot Fault': 'No',
    'Leg ID': '67890',
    'Latest Disposition': 'Completed',
    'Confirmed': 'Yes'
  };

  const Dtranscript: TranscriptLine[] = [
    { speaker: 'User', text: 'Hello, I need help with my account.' },
    { speaker: 'Assistant', text: 'Sure, I can help you with that.' }
  ];

  const cardData = _cardData ? _cardData : DcardData;
  const transcript = _transcript ? _transcript : Dtranscript;

  const { detailsSections, additionalStyles } = generateDetailsSections(cardData, transcript, _title);

const output = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated HTML</title>
  <style>
    ${additionalStyles}
  </style>
  <script src="https://unpkg.com/feather-icons"></script>
</head>
<body>
<script>
    const featherScript = document.createElement('script');
    featherScript.src = 'https://unpkg.com/feather-icons';
    featherScript.onload = () => feather.replace();
    document.head.appendChild(featherScript);
</script>
${detailsSections}
</body>
</html>`

return {
  html: output,
  append: () => {
    document.open()
    document.write(output)
    document.close()
  }
}
}

