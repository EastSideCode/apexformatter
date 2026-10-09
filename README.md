# Apex Formatter for Salesforce CLI

Apex Formatter formats local `.cls` and `.trigger` files through Salesforce CLI. Its TypeScript engine runs in Node.js and uses the WebAssembly grammar supplied by `web-tree-sitter-sfapex`. Users need Node.js 20.11 or newer and Salesforce CLI; formatting requires no authenticated org, Ruby installation, native parser library, or compiler.

## Install from npm

```sh
sf plugins install sf-plugin-apex-formatter
sf apex format --help
```

For a fixed version in CI or a shared development environment:

```sh
sf plugins install sf-plugin-apex-formatter@0.1.0
```

Salesforce CLI can prompt for confirmation when installing an unsigned community plugin. See the [Salesforce plugin installation guide](https://developer.salesforce.com/docs/platform/sfdx-setup/guide/sfdx-setup-install-plugin.html).

## Format, preview, and check

```sh
# Write changed Apex files, recursively.
sf apex format --path force-app/main/default/classes

# Preview without writing.
sf apex format --path "src/shared classes" --dry-run

# Each selected path gets its own flag.
sf apex format --path src/MyClass.cls --path src/MyTrigger.trigger

# Check in CI without writing; status 1 means changes are needed or an error occurred.
sf apex format --path force-app/main/default --check --json

# Use a specific style guide.
sf apex format --path src --config style-guide.xml
```

`--check` and `--dry-run` are mutually exclusive. Default mode writes changed files; successful write/preview and clean check return status 0. Every mode returns status 1 on an error. Empty selections produce `NO_APEX_FILES` instead of a misleading successful check.

Directories expand to `.cls` and `.trigger` files in deterministic order. Overlapping selections are deduplicated. Explicit symbolic links are rejected; links encountered while scanning, `.git`, and `node_modules` directories are skipped. Paths in results are absolute canonical paths.

## Configuration and compatibility

Configuration discovery starts at the **first selected source file** and walks up its parent directories. Within each directory, look for `style-guide.xml`, `.apexformatter.toml`, then `apexformatter.toml`. That one configuration applies to the whole invocation. `--config` overrides discovery; the included style guide is available as an explicit configuration. Without a discovered or explicit file, the defaults below apply.

The XML reader selects Apex settings from JetBrains/Illuminated Cloud style guides. The TOML reader supports a small `key = value` dialect, ignoring unknown keys and sections. It is not a general TOML parser.

| Setting | Default | Behavior |
| --- | --- | --- |
| `max_width` | 80 | Line fitting, measured in UTF-8 bytes |
| `indent_size` | 4 | Block indentation |
| `continuation_indent_size` | 8 | Wrapped expression indentation |
| `else_on_new_line`, `while_on_new_line`, `catch_on_new_line`, `finally_on_new_line` | `true` | Control-flow placement |
| `keep_simple_blocks_in_one_line` | `true` | Compact blocks where the existing rules permit |
| `query_bracket_style` | 2 | 1 places the bracket on the current line; 2 uses the next-line layout |
| `class_brace_style`, `method_brace_style`, `brace_style` | 1 | Accepted; currently do not change brace placement |
| `reformat_apex_doc` | `true` | Accepted; currently does not change comment formatting |

Output uses LF line endings and a final newline for ordinary source files. Malformed XML, invalid recognized numeric settings, and invalid UTF-8 are rejected. Width must be a positive safe integer, indentation must be an integer from 0 through 256, and style values must be 1 or 2.

Unsupported query syntax includes SOQL `USING SCOPE` and `UPDATE TRACKING`/`VIEWSTAT`, top-level SOSL `OFFSET`, `TYPEOF` selections, and SOSL `USING LOOKUP`. These cases fail before writing. Other unsupported syntax also produces an error.

## File protection

Every formatted output is reparsed, and its non-comment tokens are compared with the input. The check permits keyword case and compound-keyword whitespace changes, preserving quoted literal and integer text exactly. Every attached comment must be printed. A parse, configuration, unsupported-node, or token-conservation error anywhere in a batch prevents **all writes**.

Only changed files are replaced. The writer checks original bytes before starting the write phase and again before replacing each file, uses a temporary file in the same directory, and preserves permission bits. Unchanged files retain their modification times. A detected concurrent edit aborts replacement; the check and rename do not constitute a filesystem lock. A failure during the write phase can occur after earlier files have been written: the result reports those writes; this is not a multi-file filesystem transaction.

## JSON result and library API

The Salesforce CLI wraps the returned result with its standard `status`, `result`, and `warnings` fields. Human messages and previews use `SfCommand` logging and are suppressed with `--json`.

```json
{
  "status": 1,
  "result": {
    "mode": "check",
    "scannedFiles": 1,
    "changedFiles": 1,
    "unchangedFiles": 0,
    "writtenFiles": 0,
    "changedPaths": ["/project/src/Example.cls"],
    "files": [{ "path": "/project/src/Example.cls", "status": "changed", "written": false }],
    "errors": []
  },
  "warnings": []
}
```

`files[].status` is `changed`, `unchanged`, or `error`. `written` records an actual replacement. Successful preview entries additionally include `formatted`; check and write modes omit that text. Errors contain `code` and `message`, and usually `path`. A per-file formatting error also appears as `files[].error`. `changedFiles` counts proposed changes, including changes withheld because another file failed; `writtenFiles` counts completed replacements. During input/configuration failures, `files` can be empty even when `scannedFiles` is positive. These fields form the versioned result contract.

The engine is also usable without Salesforce CLI:

```sh
npm install sf-plugin-apex-formatter
```

```js
import { Config, formatApex, formatPaths } from 'sf-plugin-apex-formatter';

const text = await formatApex('class Example{Integer count=1;}', new Config());
const result = await formatPaths({ paths: ['src'], mode: 'check' });
```

Implementation references: [tree-sitter-sfapex](https://github.com/aheber/tree-sitter-sfapex) and [web-tree-sitter](https://github.com/tree-sitter/tree-sitter/tree/master/lib/binding_web).
