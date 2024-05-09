
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
  _newOutput = Object.entries(_newOutput).reduce((acc, [key, value]) => {
    if(Array.isArray(value)) {
      const _value = value.flat() as any[];
      acc[key] = Array.from(new Set(_value));
      return acc;
    } else {
      acc[key] = value;
      return acc;
    }
  }, {});
  _newOutput = condenseData(_newOutput);
  return _newOutput;

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

export function condenseData(data) {
  // Function to clean arrays by removing nulls and duplicates
  function cleanArray(arr) {
    const seen = new Set();
    return arr.filter(item => {
      const key = JSON.stringify(item);
      if (item !== null && !seen.has(key)) {
        seen.add(key);
        return true;
      }
      return false;
    });
  }

  // Function to recursively process objects and arrays
  function processElement(element) {
    if (Array.isArray(element)) {
      return cleanArray(element.map(e => processElement(e)));
    } else if (element && typeof element === 'object') {
      const processedObject = {};
      for (const [key, value] of Object.entries(element)) {
        const processedValue = processElement(value);
        // Exclude keys with null values or empty arrays
        if (processedValue !== null && !(Array.isArray(processedValue) && processedValue.length === 0)) {
          processedObject[key] = processedValue;
        }
      }
      return processedObject;
    }
    return element;
  }

  const out = processElement(data); // Start processing from the root of the data
  if(out && out.names) {
    out.names = cleanData(out.names);
    out.names = out.names.filter(name => Object.keys(name).length > 0)
    return out
  }
  return out;
}


function cleanData(data) {
    // Helper function to merge two objects
    function mergeObjects(obj1, obj2) {
        const result = {...obj1}; // Create a copy of the first object

        // Iterate over each key in the second object
        Object.keys(obj2).forEach(key => {
            if (result.hasOwnProperty(key) && Array.isArray(result[key]) && Array.isArray(obj2[key])) {
                // If both are arrays, merge and remove duplicates
                result[key] = [...new Set([...result[key], ...obj2[key]])];
            } else {
                // If not arrays, the value in the second object overrides the first
                result[key] = obj2[key];
            }
        });

        return result;
    }

    return data.reduce((acc, obj) => {
        // Check if there's an object in the accumulator that can be merged
        let found = false;
        for (let i = 0; i < acc.length; i++) {
            // Check if objects have any keys in common
            const commonKeys = Object.keys(acc[i]).filter(key => Object.keys(obj).includes(key));
            if (commonKeys.length > 0) {
                // Merge objects and update the accumulator
                acc[i] = mergeObjects(acc[i], obj);
                found = true;
                break;
            }
        }
        // If no mergeable object was found, add the new object to the accumulator
        if (!found) {
            acc.push(obj);
        }
        return acc;
    }, []);
}


export function jsonToPlainText(json) {
  function formatValue(value) {
    if (Array.isArray(value)) {
      return value.map(item => '\n- ' + formatValue(item)).join('');
    } else if (typeof value === 'object' && value !== null) {
      return objectToPlainText(value);
    } else {
      return String(value);
    }
  }

  function objectToPlainText(obj) {
    return Object.entries(obj).map(([key, value]) => {
      return `${capitalizeFirstLetter(key)}: ${formatValue(value)}`;
    }).join('.\n');
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  return objectToPlainText(json);
}
