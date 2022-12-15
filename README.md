
# columnify-json

A simple, one-dependency CLI tool to render JSON collections
(objects, arrays, ...) in columnar form.
Useful for working through configuration files. Use with other CLI
tools, such as `jq` and `grep`, for maximum effect.

## How to use

Install:

```shell
npm install -g columnify-json
```

Use:

```shell
columnify-json /path/to/file.json       // reads from file
echo '{"foo": "bar"}' | columnify-json  // reads from stdin
```

With an input such as

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
