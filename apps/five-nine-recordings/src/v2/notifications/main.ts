import * as postmark from 'postmark';
import axios from 'axios'
import { parseTranscription } from './generate-html/parse-transcription';
import { run } from './generate-html/details';
import { renderHtmlAndCaptureScreenshot } from './generate-html/renderer';
import fs from 'fs'

export class KeywordChecker {
  constructor(private keywords: Array<string>) {}
  callbacks = []

  on(event: 'found', cb: (transcript: string, metadata: any) => void) {
    if(event === 'found') {
      this.callbacks.push(cb)
    }
  }

  async check(transcript: string, _metadata: any) {
    const transcriptArr = transcript.split(' ').map(a => this.removeNonAlphabetical(a))
    const words = transcriptArr.filter((w: any) => {
      const fixedWords =  this.keywords.map(k => this.removeNonAlphabetical(k).toLowerCase().trim())
      const isIncluded = fixedWords.includes(w.toLowerCase().trim())
      return isIncluded
    })

    const metadata = {..._metadata, Trigger: words.join(' ').toUpperCase(), keywords: this.keywords}

    const isFound = !!words.join(',').trim()
    fs.writeFileSync('log.txt', JSON.stringify({transcriptArr, words, keywords: this.keywords}, null, 2))
    if(!isFound) return
      for(let cb of this.callbacks) {
        await cb(transcript, metadata)
      }
  }
 removeNonAlphabetical(input: string): string {
  return input.replace(/[^a-zA-Z]/g, '');
}
}

abstract class Client {
   abstract send(transcription:  string, metadata: any): Promise<boolean>

 }

export class SpreadsheetClient extends Client {

  async send(t, m) {
    const parsedTranscript = parseTranscription(t).map(v => {
      return `${v.speaker}:${v.text}`
    }).join(';;;')
    let values = Object.values(m)
    values = values.map(v => {
      try {
        return v.toString()
      } catch {
        ''
      }
    }).filter(v => v)
    values.unshift(new Date().toISOString())
    values.push(parsedTranscript)
    await this.addRow(values)
    return true
  }


  private async addRow(row: Array<any>) {
  const url = 'https://script.google.com/macros/s/AKfycbzLzLz9siavg0gXv3QkpsHCgwbek-n_6btiUcrD7MFvB2l-ZHd5iZUb-he0C67ywufO/exec';

  try {
    const response = await axios.post(url, { row }, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data.status === 'success') {
      console.log('Row appended successfully:', row);
    } else {
      console.error('Failed to append row:', response.data.message);
    }
  } catch (error) {
    console.error('Error appending row:', error);
  }
};
}

export class EmailClient extends Client {
  constructor(private distributionList: Array<string>) {
  super()
  }
  client: postmark.ServerClient | null = null;

  private async buildHtml(t: string, metadata: any) {
    const parsed = await parseTranscription(t)
    fs.writeFileSync('./log.txt', JSON.stringify(parsed, null, 2))

    const payload = {
      'Call ID': metadata.callId,
      'Reservation ID': metadata.reservationId,
      'Trigger': metadata.trigger
    }

    const title = 'Response Needed'
    const {html} = run(payload, parsed, title)
    return await renderHtmlAndCaptureScreenshot(html)
  }

  async send(t: string, m: any) {
   const client = this.getClient()
   const users = this.distributionList.join(',')
   const response = await client.sendEmail({
     To:users,
     Subject: '🚨 Action Required: Reservation Concern 🚨',
     From: 'notifications@monsterrg.com',
     HtmlBody: `<div style="font-family: Arial, sans-serif; color: #333; padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd;">
    <h1 style="color: #3498db; font-size: 24px; margin-bottom: 20px;">Transcript</h1>
    <p><strong>Call ID:</strong> ${m.callId}</p>
    <p><strong>Reservation ID:</strong> ${m.reservationId}</p>
    <p><strong>Trigger:</strong> ${m.Trigger}</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
    ${parseTranscription(t).map(fragment => `
      <p style="margin: 0 0 10px;">
        <b style="color: #2ecc71;">${fragment.speaker}</b>: ${fragment.text}
      </p>
    `).join('')}
  </div>`
   })

   console.log(response)
   return true
  }

   private  getClient() {
    if (this.client) return  this.client;
    this.client = new postmark.ServerClient('2dca4f4c-1887-4a8e-9b63-d9f9ec3d8246');
    return this.client;
  }
}

class RedisClient {}

export class NotifierFactory {
  constructor(private clients: Array<Client>) {}

  manufacture() {
    return this.sendNotification.bind(this)
  }

  private async sendNotification(t: any, metadata: any) {
    for(let client of this.clients) {
      await client.send(t, metadata)
    }
  }

}


