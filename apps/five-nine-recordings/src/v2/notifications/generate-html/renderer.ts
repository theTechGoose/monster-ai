import playwright from 'playwright';
import axios from 'axios'
import fs from 'fs'
import tmp from 'tmp'

async function uploadImageToImgur(filePath: string): Promise<string | null> {
        // Read the image file
        const imageBuffer = fs.readFileSync(filePath, { encoding: 'base64' });

        // Convert the image to Base64
        const base64Image = imageBuffer;
        const key = '5abe60d7df72e769ea9c9d11fe467fc3'
        const formdat = new FormData();
        formdat.append('image', base64Image);

        // Call Imgur API to upload the image
        try {
        const response = await axios.post(
            `https://api.imgbb.com/1/upload?key=${key}`,
            formdat

        );
        return response.data.data.url
        } catch (error) {
            console.log(error.response.data)
            return null;
        }

}

export async function renderHtmlAndCaptureScreenshot(html: string) {
    const browser = await playwright.firefox.launch({headless: true });
    const page = await browser.newPage();
     await page.setContent(html, { waitUntil: 'networkidle' });
     await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for the page to settle
     const  file = tmp.fileSync()
     await page.screenshot({ path: file.name, fullPage: true});
     const link = await uploadImageToImgur(file.name)
const imgTag = `
<img src="${link}" alt="screenshot" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />`
return imgTag



}
