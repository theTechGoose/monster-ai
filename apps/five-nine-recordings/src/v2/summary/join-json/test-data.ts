
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
export const raw2 = '{\n' +
      '  "names": [\n' +
      '    {\n' +
      '      "speaker": "Kimberly",\n' +
      '      "spouse": null,\n' +
      '      "kids": [\n' +
      '        "Ralphie"\n' +
      '      ]\n' +
      '    },\n' +
      '    {\n' +
      '      "speaker": null,\n' +
      '      "spouse": null,\n' +
      '      "kids": [\n' +
      '        "Ralphie"\n' +
      '      ],\n' +
      '      "otherFamily": [\n' +
      '        "Kimberly",\n' +
      '        "granddaughter"\n' +
      '      ]\n' +
      '    },\n' +
      '    {\n' +
      '      "speaker": null,\n' +
      '      "spouse": "husband",\n' +
      '      "kids": [\n' +
      '        "granddaughter"\n' +
      '      ]\n' +
      '    },\n' +
      '    {\n' +
      '      "speaker": null,\n' +
      '      "spouse": null,\n' +
      '      "kids": []\n' +
      '    },\n' +
      '    {\n' +
      '      "speaker": null,\n' +
      '      "spouse": "husband",\n' +
      '      "kids": null\n' +
      '    }\n' +
      '  ],\n' +
      '  "destinations": [\n' +
      '    "Myrtle Beach",\n' +
      '    "Sands Ocean Club Resort",\n' +
      '    "Crown Reef",\n' +
      '    "North Myrtle Beach"\n' +
      '  ],\n' +  '  "eventNotes": [\n' +
      '    {\n' +
      '      "birthdays": [],\n' +
      '      "holidays": []\n' +
      '    }\n' +
      '  ],\n' +
      '  "additionalNotes": [\n' +
      '    "Visits Myrtle Beach annually, has previously attended a seminar in the location",\n' +
      '    "Regularly visits Myrtle Beach every year",\n' +
      '    "Interested in Sands Ocean Club Resort in Myrtle Beach",\n' +
      `    "Prefers resorts with a lazy river; previously stayed at Crown Reef but it's fully booked; looking at Sands Ocean Club Resort",\n` +
      '    "The guest mentioned an offer that provides studio, one-bedroom, and two-bedroom accommodations for a minimum of seven nights and requires a non-refundable payment for the cleaning process. However, the guest is unsure about the cost and the number of payments can be made as this information is not mentioned in the terms and conditions book they have.",\n' +
      `    "The guest generally stays at Crown Reef when visiting Myrtle Beach due to their deals of 'pay for three, stay for five' or 'pay for five, stay for seven'. The speaker was inquiring about pricing rather than booking during the call."\n` +
      '  ],\n' +
      '  "familyNotes": [\n' +
      '    "Has a kid named Ralphie and a granddaughter",\n' +
      '    "Travels with husband and granddaughter",\n' +
      '    "Has a granddaughter"\n' +
      '  ],\n' +
      '  "travelGroup": [\n' +
      '    "Family",\n' +
      '    "up to four people"\n' +
      '  ],\n' +
      '  "interests": [\n' +
      '    "Beach",\n' +
      `    "Pirate's Voyage",\n` +
      '    "Broadway at the Beach",\n' +
      '    "Go-karts",\n' +
      '    "Skating Range",\n' +
      '    "Wax Museum",\n' +
      '    "voyage",\n' +
      '    "wax museum",\n' +
      '    "live bands",\n' +
      '    "water activities",\n' +
      '    "spa",\n' +
      '    "lazy river",\n' +
      '    "beach holidays",\n' +
      '    "oceanfront accommodations",\n' +
      '    "accommodations with a lazy river, full-size kitchen, a dining area, a full bath, private balcony, and two beds",\n' +
      '    "Offers and deals",\n' +
      '    "Beach holidays"\n' +
'  ],\n' +
      '  "travelDates": [\n' +
      '    "August the 10th",\n' +
      '    "August the 17th",\n' +
      '    "8-day",\n' +
      '    "7-night"\n' +
      '  ]\n' +
      '}'

export function getTestData() {
  return [...raw]
}
