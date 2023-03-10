
const path = require('path');
const assert = require('assert');
const childProcess = require('child_process');

const columnifyAndCheck = (input, expected) => {
  return new Promise((resolve, reject) => {
    const child = childProcess.fork(path.resolve(__dirname, '..', 'bin.js'), { silent: true });
    let stdout = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stdout.on('end', () => {
      const trimmed = stdout.trim();
      try { JSON.parse(trimmed); } catch (err) {
        reject(new Error(`Invalid JSON generated\n\n${trimmed}\n\nfrom input\n\n${input}\n\n${err.stack}`));
      }
      try { assert.deepStrictEqual(JSON.parse(trimmed), JSON.parse(input)) } catch (err) {
        reject(new Error(`Mismatching JSON generated\n\n${trimmed}\n\nfrom input\n\n${input}\n\n${err.stack}`));
      }
      if (trimmed === expected) {
        resolve();
        return;
      }
      reject(new Error(`Expected\n\n${expected}\n\ngot\n\n${trimmed}`));
    });
    child.stdin.write(input);
    child.stdin.end();
  });
};

(async () => {

  await columnifyAndCheck('42\n', '42');
  await columnifyAndCheck('true\n', 'true');
  await columnifyAndCheck('null\n', 'null');
  await columnifyAndCheck('"hello"', '"hello"');
  await columnifyAndCheck('{"foo": "bar"}', '{\n  "foo": "bar"\n}');
  await columnifyAndCheck('{"foo": 42, "bar": 42}', '{\n  "foo": 42,\n  "bar": 42\n}');
  await columnifyAndCheck('[{"foo": 42}, {"bar": 42}]', '[\n  {            "foo": 42 },\n  { "bar": 42            }\n]');
  await columnifyAndCheck('[{"bar": 42}, {"foo": 42}]', '[\n  { "bar": 42            },\n  {            "foo": 42 }\n]');
  await columnifyAndCheck('[{"foo": 42}, {"bar": 42}, {"baz": 42}]', '[\n  {                       "foo": 42 },\n  { "bar": 42                       },\n  {            "baz": 42            }\n]');
  await columnifyAndCheck('{"one": {"foo": 42}, "two": {"bar": 42}}', '{\n  "one": {            "foo": 42 },\n  "two": { "bar": 42            }\n}');
  await columnifyAndCheck('[{"foo": 42, "bar": 43}, {"foo": true, "baz": false}]', '[\n  { "bar": 43,               "foo": 42   },\n  {            "baz": false, "foo": true }\n]');

  console.log('Done! All tests passed.');

})().catch((err) => {
  console.error(err);
  process.exit(1);
});


