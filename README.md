
# columnify-json

A simple, one-dependency JSON formatter that uses whitespace and key
(re)ordering to tabulate entries in JSON collections.

Particularly useful for certain kinds of configuration files. Combine
with other CLI tools such as `jq` and `grep` for maximum effect.

## Example 

With an input such as:

```json
[{"foo": {"b": 42}}, {"foo": null, "bar": {"a": 17}}]
```

`columnify-json` will output the following:

```json
[
  {                     "foo": { "b": 42 } },
  { "bar": { "a": 17 }, "foo": null        }
]
```

## Install

```shell
npm install -g columnify-json
```

## Usage

```shell
columnify-json /path/to/file.json       // reads from file
echo '{"foo": "bar"}' | columnify-json  // reads from stdin
```
