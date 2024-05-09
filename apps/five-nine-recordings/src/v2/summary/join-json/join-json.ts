
export function joinJson(jsonChunks: string[], callType: string) {
  const payloads = jsonChunks.map((chunk) => JSON.parse(chunk));
  const output = {};
  for (let payload of payloads) {
    const keys = Object.keys(payload);
    for (let key of keys) {
     const data = payload[key];
      if(!data) continue;
      if(!output[key]) {
        output[key] = {
          multi: false,
          data: [data]
        }
      } else {
        output[key].data.push(data);
        output[key].multi = true;
      }
    }
  }
  let _newOutput =  Object.entries(output).reduce((acc, [key, _value]) => {
    const value = _value as any;
    if(value.multi) {
      acc[key] = value.data;
    } else {
      acc[key] = value.data[0];
    }
    return acc;
  }, {})
   _newOutput = removeNullData(_newOutput);
  return Object.entries(_newOutput).reduce((acc, [key, value]) => {
    if(Array.isArray(value)) {
      const _value = value.flat() as any[];
      acc[key] = Array.from(new Set(_value));
      return acc;
    } else {
      acc[key] = value;
      return acc;
    }
  }, {});

}


function removeNullData(obj) {
    Object.keys(obj).forEach(key => {
        if (Array.isArray(obj[key])) {
            // Filter the array removing objects with all properties null
            obj[key] = obj[key].filter(item => {
                if (item && typeof item === 'object') {
                    return Object.values(item).some(v => v !== null);
                }
                return true;  // Keep the item if it's not an object
            });
            // Recursively clean each object in the array
            obj[key].forEach(element => {
                if (typeof element === 'object') {
                    removeNullData(element);
                }
            });
        }
    });
  return obj;
}



