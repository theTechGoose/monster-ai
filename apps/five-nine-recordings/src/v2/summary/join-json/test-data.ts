
export const raw = [
      '{\n' +
        '  "names": {\n' +
        '    "speaker": "Donald Young",\n' +
        '    "spouse": null,\n' +
        '    "kids": null\n' +
        '  },\n' +
        '  "familyNotes": null,\n' +
        '  "travelGroup": null,\n' +
        '  "interests": null,\n' +
        '  "destinations": ["Jamaica"],\n' +
        '  "travelDates": null,\n' +
        '  "eventNotes": {\n' +
        '    "birthdays": null,\n' +
        '    "holidays": null\n' +
        '  },\n' +
        '  "additionalNotes": null\n' +
        '}',
      '{\n' +
        '  "names": {\n' +
        '    "speaker": null,\n' +
        '    "spouse": null,\n' +
        '    "kids": null\n' +
        '  },\n' +
        '  "familyNotes": null,\n' +
        '  "travelGroup": null,\n' +
        '  "interests": null,\n' +
        '  "destinations": ["Jamaica"],\n' +
        '  "travelDates": ["September"],\n' +
        '  "eventNotes": {\n' +
        '    "birthdays": null,\n' +
        '    "holidays": null\n' +
        '  },\n' +
        '  "additionalNotes": "Will call back in a month to check for any updates about possible destinations in Jamaica."\n' +
        '}',
      '{\n' +
        '  "names": {\n' +
        '    "speaker": null,\n' +
        '    "spouse": null,\n' +
        '    "kids": null\n' +
        '  },\n' +
        '  "familyNotes": null,\n' +
        '  "travelGroup": null,\n' +
        '  "interests": null,\n' +
        '  "destinations": null,\n' +
        '  "travelDates": null,\n' +
        '  "eventNotes": {\n' +
        '    "birthdays": null,\n' +
        '    "holidays": null\n' +
        '  },\n' +
        '  "additionalNotes": null\n' +
        '}'
    ]

export function getTestData() {
  return [...raw]
}
