import * as postmark from 'postmark';
import axios from 'axios'
import { parseTranscription } from './generate-html/parse-transcription';
import { run } from './generate-html/details';
import { renderHtmlAndCaptureScreenshot } from './generate-html/renderer';

export class KeywordChecker {
  constructor(private keywords: Array<string>) {}
  callbacks = []

  on(event: 'found', cb: (transcript: string, metadata: any) => void) {
    if(event === 'found') {
      this.callbacks.push(cb)
    }
  }

  check(transcript: string, _metadata: any) {
    const transcriptArr = transcript.split(' ')
    const words = transcriptArr.filter((w: any) => {
      return this.keywords.map(k => k.toLowerCase().trim()).includes(w.toLowerCase().trim())
    })

    const metadata = {..._metadata, trigger: words.join(' ')}

    const isFound = !!words.join(',').trim()
    if(isFound) this.callbacks.forEach(c => c(transcript, metadata))
  }
}

abstract class Client {
   abstract send(transcription:  string, metadata: any): Promise<boolean>

 }

class SpreadsheetClient {
  send(transcripton) {
    const url = ''
    const body = {}
    const headers = {}
    return axios.post(url, body, {headers})
  }
}

export class EmailClient {
  constructor(private distributionList: Array<string>) {}
  client: postmark.ServerClient | null = null;

  private async buildHtml(t: string, metadata: any) {
    const parsed = parseTranscription(t)
    const payload = {
      'Call Id': metadata.callId,
      'Reservation Id': metadata.reservationId,
      'trigger': metadata.trigger
    }

    const title = 'Warning'
    const {html} = run(payload,parsed,title)
    return await renderHtmlAndCaptureScreenshot(html)
  }


  async send(t: string, m: any) {
   const client = this.getClient()
   const users = this.distributionList.join(',')
   const HtmlBody = await this.buildHtml(t,m)

   client.sendEmail({
     To:users,
     Subject: 'Resolution Required!',
     From: 'notifications@monsterrg.com',
     HtmlBody
   })
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


