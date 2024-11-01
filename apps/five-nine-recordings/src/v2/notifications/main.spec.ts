// jest-setup.ts
import path from 'path';
import fs from 'fs';
import {KeywordChecker, NotifierFactory, EmailClient, SpreadsheetClient} from './main'

// Override the working directory to the directory of the current test file
jest.setTimeout(300_000)
beforeEach(() => {
  const testPath = expect.getState().testPath;
  if (testPath && fs.existsSync(testPath)) {
    const testDir = path.dirname(testPath);
    process.chdir(testDir);
  }
});


//it('should work', () => {
//  console.log( 'hello')
//})


it('should get the file', async () => {

  const file = fs.readFileSync('./sample.txt', 'utf8')
const emails = [
  "rafac@monsterrg.com",
  //"amcgill@monsterrg.com",
  //"brittanyl@monsterrg.com",
  //"garrettc@monsterrg.com",
  //"juliaa@monsterrg.com",
  //"bertt@monsterrg.com",
  //"jeremyc@monsterrg.com",
  //"support@monsterrg.com"
]

  const keywords = [
 "attorney",
 "lawyer",
 "dispute",
 "bureau ",
 "fuck",
 "scam",
 "liar",
  ]

  const emailClient = new EmailClient(emails)
  const sheetClient = new SpreadsheetClient()
  const notifier = new NotifierFactory([sheetClient, emailClient])
  const checker = new KeywordChecker(keywords)
  checker.on('found', notifier.manufacture())
  await checker.check(file,{callId: 'five-9::123443', 'reservationId': '278223' })
})
