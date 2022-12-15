#!/usr/bin/env node

/*
 * TODO: There's way too much looping in here. Very likely some loops
 *       can be collapsed into one another, significantly improving
 *       performance.
 */

/**
 * Given an array of object entries, returns an array of entries
 * where each key is accompanied by the formatted inline representation
 * of its original value.
 *
 * @param {[string, any][]} entriesArr
 * @returns {[string, any, string][]}
 */
const formatObjectEntriesInline = (entriesArr) => {
  return entriesArr
    .sort(([ak], [bk]) => ak < bk ? -1 : 1)
    .map(([key, val]) => [key, formatValueInline(val)]);
};

/**
 * Given an object, returns an inline JSON representation of it.
 *
 * @param {Object<any>>} obj
 * @returns {string}
 */
const formatObjectInline = (obj) => {
  const formattedEntriesArr = formatObjectEntriesInline(Object.entries(obj));
  return `{ ${formattedEntriesArr.map(([key, formattedVal]) => `"${key}": ${formattedVal}`).join(', ')} }`;
};

/**
 * Given an array, returns an inline JSON representation of it.
 *
 * @param {any[]}
 * @returns {string}
 */
const formatArrayInline = (itemArr) => {
  const formattedItemArr = itemArr.map((item) => {
    return formatValueInline(item);
  });
  return `[${formattedItemArr.join(', ')}]`;
};

/**
 * Given a value of any type, returns an inline JSON representation of it.
 *
 * @param {any} val
 * @returns {string}
 */
const formatValueInline = (val) => {
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
      return formatObjectInline(val);
    case 'undefined':
      throw new Error('columnify-json: values of type "undefined" are not supported');
    case 'function':
      throw new Error('columnify-json: values of type "function" are not supported');
    default:
      throw new Error(`columnify-json: values of type "${typeof val}" are not supported`);
  }
};

/**
 * Given an array of object entries, returns an array of entries with the same
 * keys but with formatted values.
 *
 * Note: A "subvalue" is a value of the property of an object that is itself the
 *       value of an entry.
 *
 * Note: A "subkey" is a key of an object that is itself the value of an entry.
 *
 *
 * @param {[string, any][]} entriesArr
 * @returns {[string, string][]}
 */
const formatEntriesArrPretty = (entriesArr) => {
  // A dictionary of max. lengths of subvalues, keyed by subkey.
  // Each key maps to the length of the longest value seen for
  // the key itself across all entries with object-like values.
  const maxSubvalLenBySubkey = Object.create(null);
  const formattedEntriesArr = entriesArr.map(([key, val]) => {
    if (typeof val === 'object' && val !== null) {
      const formattedEntriesArr = formatObjectEntriesInline(Object.entries(val))
      const formattedSubvalsBySubkey = Object.create(null);
      for (const [subkey, formattedSubval] of formattedEntriesArr) {
        formattedSubvalsBySubkey[subkey] = formattedSubval;
        maxSubvalLenBySubkey[subkey] = Math.max(formattedSubval.length, maxSubvalLenBySubkey[subkey] || 0);
      }
      return [key, formattedEntriesArr, formattedSubvalsBySubkey];
    }
    return [key, formatValueInline(val)];
  });
  const sortedSubkeys = Object.keys(maxSubvalLenBySubkey)
    .sort((a, b) => a < b ? -1 : 1);
  return formattedEntriesArr.map(([key, formValOrEntriesArr, formSubvalsBySubkey]) => {
    if (typeof formValOrEntriesArr === 'string') {
      return [key, formValOrEntriesArr];
    }
    let output = '{ ';
    let pendingSeparator = false;
    let pendingWhitespace = '';
    sortedSubkeys.forEach((subkey) => {
      if (subkey in formSubvalsBySubkey) {
        if (pendingSeparator) {
          output += ', ';
        }
        pendingSeparator = true;
        output += pendingWhitespace;
        pendingWhitespace = '';
        output += `"${subkey}": ${formSubvalsBySubkey[subkey].padEnd(maxSubvalLenBySubkey[subkey], ' ')}`;
      } else {
        pendingWhitespace += ''.padEnd(6 + subkey.length + maxSubvalLenBySubkey[subkey], ' ');
      }
    });
    output += pendingWhitespace + ' }';
    return [key, output];
  });
};

/**
 * Given an object, returns a multi-line JSON representation of it.
 *
 * @param {Object.<string, any>} obj
 * @returns {string}
 */
const formatObjectMultiline = (obj) => {
  const entriesArr = Object.entries(obj);
  const formattedEntriesArr = formatEntriesArrPretty(entriesArr);
  const maxKeyLen = formattedEntriesArr.reduce(
    (maxLen, [key]) => Math.max(maxLen, key.length),
    0,
  ) + 2;
  const paddedKeysformattedEntriesArr = formattedEntriesArr.map(
    ([key, val]) => `${`"${key}"`.padEnd(maxKeyLen, ' ')}: ${val}`
  );
  return `{\n  ${paddedKeysformattedEntriesArr.join(',\n  ')}\n}`;
};

/**
 * Given an array, returns a multi-line JSON representation of it.
 *
 * @param {any[]} arr
 * @returns {string}
 */
const formatArrayMultiline = (arr) => {
  const asEntriesArr = arr.map((v, i) => [i, v]);
  const formattedEntriesArr = formatEntriesArrPretty(asEntriesArr);
  const formattedArr = formattedEntriesArr.map(([, fv]) => fv);
  return `[\n  ${formattedArr.join(',\n  ')}\n]`;
};

/**
 * Given a value of any type, returns a multi-line JSON representation of it.
 *
 * @param {any} val
 * @returns {string}
 */
const formatValueMultiline = (val) => {
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
        return formatArrayMultiline(val);
      }
      return formatObjectMultiline(val);
    case 'undefined':
      throw new Error('columnify-json: values of type "undefined" are not supported');
    case 'function':
      throw new Error('columnify-json: values of type "function" are not supported');
    default:
      throw new Error(`columnify-json: values of type "${typeof val}" are not supported`);
  }
};

if (process.argv[2]) {

  const fs = require('fs');
  const path = require('path');

  const file = path.resolve(process.cwd(), process.argv[2]);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  console.log(formatValueMultiline(data));

} else {

  const Parser = require('jsonparse');

  const parser = new Parser();

  parser.onValue = function (val) {
    if (this.stack.length === 0) {
      console.log(formatValueMultiline(val));
    }
  };

  process.stdin.on('data', (chunk) => {
    parser.write(chunk);
  });

}
