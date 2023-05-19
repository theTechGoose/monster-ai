import { Injectable } from "@nestjs/common";
import puppeteer, { Browser, Page } from "puppeteer";
import { chunk } from "lodash";
import * as config from "./urls.json";
import cheerio from "cheerio";
import {findPackageJsonDir} from "../../shared/find-root/find-root"
import {Document} from "langchain/document"
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";

 const embeddings = new OpenAIEmbeddings({openAIApiKey: process.env.OPEN_AI_KEY})

 let loggedIn = false;
@Injectable()
export class BrittanicaService {
  root = null as any

  constructor() {
    this.root = findPackageJsonDir()
  }


  // async testPuppet2() {
  //   const browser = await puppeteer.launch({
  //     headless: false,
  //   });
  //
  //   loggedIn = false;
  //   const page = await browser.newPage();
  //   await page.goto('http://spt.mx/minivac/src/index.php')
  //   const str1 = 'name="user"'
  //   const str2 = 'type="password"'
  //   const str3 = 'name="submit"'
  //   const userElement = await page.$(`[name="user"]`);
  //   const passwordElement = await page.$(`[type="password"]`);
  //   const submitElement = await page.$(`[name="submit"]`);
  //   await userElement.type('MRGLLCFB99C')
  //   await passwordElement.type('MRGLLC')
  //   await submitElement.click()
  //   await page.waitForNetworkIdle()
  //   const result = await page.$$eval('#mailboxlist > *', children => {
  //       return children.map(child => child.outerHTML);
  //   });
  //
  //   // Check if there are enough children
  //   if (result.length >= 4) {
  //       console.log('Found the element!');
  //       // Click the fourth child
  //       const elementHandler = await page.$(`#mailboxlist > :nth-child(4)`);
  //       if (elementHandler) {
  //           await elementHandler.click();
  //       } else {
  //           console.log('Could not find the element');
  //       }
  //   } else {
  //       console.log('Not enough children');
  //   }
  //
  // }
  //
  async saveVectorStore(content: Array<string>) {
    const docs = content.map((c) => {
      return new Document({pageContent: c})
    })
    const store =  await HNSWLib.fromDocuments(docs, embeddings)
    const finalPath = `${this.root}/stores/brittanica`
    await store.save(finalPath)
  }

  async loadVectorStore() {
    const finalPath = `${this.root}/stores/brittanica`
    const store = await HNSWLib.load(finalPath, embeddings)
    return store
  }

  async getAll(): Promise<Array<string>> {
    let output = [];
    const chunks = chunk(config.urls, 10);

    const browser = await puppeteer.launch({
      headless: true,
    });

    loggedIn = false;
    const page = await browser.newPage();
    await page.goto(config.urls[0])
    await login(page)
    await page.close()

    for (const chunk of chunks) {
      const $docs = chunk.map((url: string) => {
        return this.getPage(url, browser);
      });
      const _docs = await Promise.all($docs);
      const docs = _docs.flat().map((d) => d);
      output = [...output, ...docs];
    }
    const finished = output
    browser.close();
    if (finished) return this.pullHtml(finished);
    throw new Error("could not strip tags");
  }

  private async getPage(url: string, browser: Browser): Promise<string> {
    const page1 = await browser.newPage();
    await page1.goto(url);
    if (!loggedIn) await login(page1);
    const result = await page1.evaluate(() => document.body.innerHTML);
    page1.close();
    return result;
  }


  private pullHtml(strArr: Array<string>) {
    return strArr.map(str => {
    str = str.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "",
    );

    str = str.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ""); // HTML tag with a null string.

    function extractTextFromNode(node, result) {
      if (node.type === "text") {
        result.push(node.data.trim());
      } else if (node.children) {
        node.children.forEach((child) => extractTextFromNode(child, result));
      }
    }

    function stripHTMLTags(htmlString) {
      const $ = cheerio.load(htmlString);
      const rootNode = $.root()[0];
      const result = [];
      extractTextFromNode(rootNode, result);
      return result.join(";;");
    }

    function stripContentBetween(inputStr) {
      const output = [""];
      const preFilter = inputStr.split("BBB Complaint Process;;");
      const text = "Search this site";
      preFilter.forEach((f) => {
        const split = f.split(";;;;");
        split.forEach((s) => {
          output.push(s);
        });
      });
      const filter1 = "Search this site;;";
      const filter2 = "Brittanica;;Home";
      const filter3 = "More;;Home;;";
      function joinShortItems(inputStr) {
        const items = inputStr.split(";;");
        const output = [];

        for (let i = 0; i < items.length; i++) {
          let currentItem = items[i];

          if (currentItem.length < 3) {
            while (items[i + 1] && items[i + 1].length < 3) {
              currentItem += items[i + 1];
              i++;
            }
          }

          output.push(currentItem);
        }

        const inpstr = output.join(";;");

        return inpstr.split(";;").reduce((acc, curr) => {
          const failed = curr.length < 3;

          if (failed) {
            acc += curr;
            return acc;
          }

          return acc += `${curr};;`;
        }, "");
      }
      const secondFilter = output.filter((t) => {
        return !t.includes(filter1) && !t.includes(filter2) &&
          !t.includes(filter3);
      });
      const makeLong = secondFilter.join("\n\n") as string;
      return joinShortItems(makeLong);
    }
      const otpt = stripHTMLTags(str)
      return stripContentBetween(otpt).split(';;').join(' ').split('Page updated\n\nGoogle Sites Report abuse ').join('')
    })
  }

  private removeTags(str: string) {
    if ((str === null) || (str === "")) {
      return false;
    } else {
      str = str.toString();
    }

    // Regular expression to identify HTML tags in
    // the input string. Replacing the identified
    str = str.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      "",
    );

    str = str.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ""); // HTML tag with a null string.

    function extractTextFromNode(node, result) {
      if (node.type === "text") {
        result.push(node.data.trim());
      } else if (node.children) {
        node.children.forEach((child) => extractTextFromNode(child, result));
      }
    }

    function stripHTMLTags(htmlString) {
      const $ = cheerio.load(htmlString);
      const rootNode = $.root()[0];
      const result = [];
      extractTextFromNode(rootNode, result);
      return result.join(";;");
    }

    function stripContentBetween(inputStr) {
      const output = [""];
      const preFilter = inputStr.split("BBB Complaint Process;;");
      const text = "Search this site";
      preFilter.forEach((f) => {
        const split = f.split(";;;;");
        split.forEach((s) => {
          output.push(s);
        });
      });
      const filter1 = "Search this site;;";
      const filter2 = "Brittanica;;Home";
      const filter3 = "More;;Home;;";
      function joinShortItems(inputStr) {
        const items = inputStr.split(";;");
        const output = [];

        for (let i = 0; i < items.length; i++) {
          let currentItem = items[i];

          if (currentItem.length < 3) {
            while (items[i + 1] && items[i + 1].length < 3) {
              currentItem += items[i + 1];
              i++;
            }
          }

          output.push(currentItem);
        }

        const inpstr = output.join(";;");

        return inpstr.split(";;").reduce((acc, curr) => {
          const failed = curr.length < 3;

          if (failed) {
            acc += curr;
            return acc;
          }

          return acc += `${curr};;`;
        }, "");
      }
      const secondFilter = output.filter((t) => {
        return !t.includes(filter1) && !t.includes(filter2) &&
          !t.includes(filter3);
      });
      const makeLong = secondFilter.join("\n\n") as string;
      return joinShortItems(makeLong);
    }

    str = stripHTMLTags(str);
    str = stripContentBetween(str);
    return str.split("Google Sites;;Report abuse").filter((f) => {
      return !f.includes("Sign in;;to continue to Docs");
    }).join("***---***").split(";;").join(" ");
  }
}

async function login(page: Page) {
  async function setUser(itt = 0) {
    try {
      const userSelector = 'input[type="email"]';
      await page.waitForNetworkIdle();
      await page.waitForTimeout(200);
      await page.waitForSelector(userSelector);
      const emailInput = await page.$(userSelector);
      await emailInput.type(process.env.GMAIL_USER);
      const nextButton = await page.$("#identifierNext");
      await nextButton.click();
    } catch {
      if (itt > 20) throw new Error("could not set user");
      itt++;
      return setUser(itt);
    }
  }
  await setUser();
  async function setPass(itt = 0) {
    try {
      await page.waitForNetworkIdle();
      await page.waitForTimeout(200);
      const passwordSelector = 'input[type="password"]';
      await page.waitForSelector(passwordSelector);
      await page.waitForNetworkIdle();
      await page.waitForTimeout(2000);
      const passwordInput = await page.$(passwordSelector);
      await passwordInput.type(process.env.GMAIL_PASSWORD);
      const passNextButton = await page.$("#passwordNext");
      await passNextButton.click();
    } catch {
      if (itt > 20) throw new Error("could not set pass");
      itt++;
      return setPass(itt);
    }
  }
  await setPass();
  await page.waitForNetworkIdle();
  loggedIn = true;
}
