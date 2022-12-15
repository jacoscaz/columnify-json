#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const formatObjectEntriesInline = (entriesArr) => {
  const sortedArr = entriesArr.slice().sort(([aKey], [bKey]) => aKey < bKey ? -1 : 1);
  const formattedEntriesMap = new Map();
  sortedArr.forEach(([key, val]) => {
    formattedEntriesMap.set(key, [key, val, formatValueInline(val)]);
  });
  return formattedEntriesMap;
};

const formatObjectInline = (obj) => {
  const formattedEntriesArr = [...formatObjectEntriesInline(Object.entries(obj)).values()];
  return `{ ${formattedEntriesArr.map(([key, val, formattedVal]) => `"${key}": ${formattedVal}`).join(', ')} }`;
};

const formatArrayInline = (itemArr) => {
  const formattedItemArr = itemArr.map((item) => {
    return formatValueInline(item);
  });
  return `[${formattedItemArr.join(', ')}]`;
};

const formatValueInline = (val, maxValueLengthsByKey) => {
  switch (typeof val) {
    case 'number':
    case 'string':
    case 'boolean':
      return JSON.stringify(val);
    case 'object':
      if (val === null) {
        return JSON.stringify(val);
      }
      if (Array.isArray(val)) {
        return formatArrayInline(val);
      }
      return formatObjectInline(val, maxValueLengthsByKey);
    case 'undefined':
      throw new Error('cannot format "undefined"');
    case 'function':
      throw new Error('cannot format "function"');
    default:
      throw new Error(`cannot format unknown type ${typeof val}`);
  }
};

const formatEntriesArrPretty = (entriesArr) => {
  const maxValueLengthsByKey = Object.create(null);
  const formattedItemArr = entriesArr.map(([key, val]) => {
    if (typeof val === 'object' && val !== null) {
      const formattedEntriesMap = formatObjectEntriesInline(Object.entries(val));
      for (const [_key, _val, _formattedVal] of formattedEntriesMap.values()) {
        maxValueLengthsByKey[_key] = Math.max(_formattedVal.length, maxValueLengthsByKey[_key] || 0);
      }
      return [key, formattedEntriesMap];
    }
    return [key, formatValueInline(val)];
  });
  const sortedKeys = Object.keys(maxValueLengthsByKey).sort((a, b) => a < b ? -1 : 1);
  return formattedItemArr.map(([key, valOrEntries]) => {
    if (typeof valOrEntries === 'string') {
      return [key, valOrEntries];
    }
    if (valOrEntries instanceof Map) {
      let output = '{ ';
      let empty = true;
      sortedKeys.forEach((_key, _i) => {
        if (valOrEntries.has(_key)) {
          const [,, formattedVal] = valOrEntries.get(_key);
          if (empty) {
            empty = false;
          } else {
            output += ', ';
          }
          output += `"${_key}": ${formattedVal.padEnd(maxValueLengthsByKey[_key], ' ')}`;
        } else {
          if (!empty) {
            output += ', ';
          }
          output += ''.padEnd(6 + _key.length + maxValueLengthsByKey[_key], ' ');
          empty = true;
        }
      });
      output += ' }';
      return [key, output];
    }
    throw new Error('should not be here');
  });
};

const formatObjectPretty = (obj) => {
  const formattedEntries = formatEntriesArrPretty(Object.entries(obj));
  const maxKeyLen = formattedEntries.reduce((maxLen, [key]) => Math.max(maxLen, key.length), 0);
  return `{\n  ${formatEntriesArrPretty(Object.entries(obj)).map(([key, val]) => `${`"${key}"`.padEnd(maxKeyLen + 2, ' ')}: ${val}`).join(',\n  ')}\n}`;
};

const formatArrayPretty = (itemArr) => {
  return `[\n  ${formatEntriesArrPretty(itemArr.map((v, i) => [i, v])).map(([fi, fv]) => fv).join(',\n  ')}\n]`;
};

const formatValuePretty = (val) => {
  switch (typeof val) {
    case 'number':
    case 'string':
    case 'boolean':
      return JSON.stringify(val, null, 2);
    case 'object':
      if (val === null) {
        return JSON.stringify(val, null, 2);
      }
      if (Array.isArray(val)) {
        return formatArrayPretty(val);
      }
      return formatObjectPretty(val);
    case 'undefined':
      throw new Error('cannot format "undefined"');
    case 'function':
      throw new Error('cannot format "function"');
    default:
      throw new Error(`cannot format unknown type ${typeof val} ${val}`);
  }
};

if (process.argv[2]) {

  const file = path.resolve(process.cwd(), process.argv[2]);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(formatValuePretty(data));

} else {

  const Parser = require('jsonparse');

  const parser = new Parser();

  parser.onValue = function (val) {
    if (this.stack.length === 0) {
      console.log(formatValuePretty(val));
    }
  };

  process.stdin.on('data', (chunk) => {
    parser.write(chunk);
  });

}
