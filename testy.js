function analyzeText(text, removeDedupe) {
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
        dedupedCharCount: dedupedCharCount,
        dedupedText: dedupedText
    };
  if(removeDedupe) delete output.dedupedText
  return output
}

const text = `
It's a beautiful day here in the Reservations Department home of the 90-day
priority booking notice. My name is Ruthie. How can I help you on our vacation today?
Yeah, this is Augustine and Samuel. This is my fourth call. I just wanted to make
sure that, you know, we change their dates and I'm still not getting the
confirmation email from Reservation Department.
Okay, let's see here.
Okay, bear with me one moment here. We're gonna see why you're not getting it.
Okay, give me one second here, ma'am. We're gonna figure out why you're not
getting it. All right.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
That's what the last person called me.
Yes, ma'am. And they emailed him back and said that your trip is confirmed.
He emailed that over to you, but I just don't have a confirmation for you yet.
Like a letter that would state like all the details like your last one did with your new travel dates.
We just don't have that yet. We're waiting for them to send it over.
Yeah, but every week I've been calling and it's the same thing you don't have.
It's the same answer I've been getting for the last three weeks that you don't have the email.
I have to book the flights and stuff, and the closer you get, it's gonna be more expensive.
So why I just can't get an email if it is confirmed? It's not a big deal to get an email.
Yes, ma'am. They do their own confirmation, so they'll actually send that confirmation letter back over to us,
and all we do is get it sent over to you.
So that's exactly my point. So you said that you have the confirmation from them.
Yes, ma'am. They said they sent the confirmation over whenever Corey emailed them for you.
They said they sent it over, but we're just not seeing it in our system.
That's what I've been trying to look for here. So I went ahead and sent them a follow-up email to get it sent back over.
And that's what the last twice call, when I made the two calls last time, it was the same answer.
I'm telling you, it is getting to be very frustrating. It's not easy to get you guys online,
and right now it's about 30 minutes and 39 seconds right now.
My phone is calculating the time to have somebody to talk to.
Everybody don't have that.
And I just need the confirmation. I just need an email to confirm my trip so I can book the flights.
That's all I'm saying, and it's getting to be so difficult, and it's not a good experience so far.
Okay, give me one second, ma'am.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
Okay.
`
  const res = analyzeText(text)
console.log(res)
  

