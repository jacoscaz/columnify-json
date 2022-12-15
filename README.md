
# tabulate-json

A simple, one-dependency CLI tool to render JSON collections
(objects, arrays, ...) in columnar form.
Useful for working through configuration files. Use with other CLI
tools, such as `jq` and `grep`, for maximum effect.

## How to use

I have not published this on NPM, yet.

```shell
git clone https://github.com/jacoscaz/tabulate-json
cd tabulate-json
npm link
```

After the above, running 
`echo '[{"foo": {"b": 42}}, {"foo": null, "bar": {"a": 17}}]' | tabulate-json` 
will output the following:

```shell
[
  {                     "foo": { "b": 42 } },
  { "bar": { "a": 17 }, "foo": null        }
]
```
