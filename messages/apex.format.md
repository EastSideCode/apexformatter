# summary

Format local Apex files with the bundled Apex Formatter.

# description

Format .cls and .trigger files from one or more local files or directories. Directories are searched recursively, and overlapping paths are deduplicated. No authenticated org or Salesforce project is required.

The default mode writes changed files. Use --check to detect changes without writing; it exits with status 1 when formatting is needed. Use --dry-run to preview formatted text without writing. Formatting errors also exit with status 1. Check and preview modes cannot be combined.

The formatter runs entirely in Node.js using the bundled Apex grammar and TypeScript formatting engine. Configuration is discovered from the first selected source file unless --config is supplied.

With --json, human messages and previews are suppressed. The result includes mode, scannedFiles, changedFiles, unchangedFiles, writtenFiles, changedPaths, files, and errors. Each file has path, status, and written, with an optional error. Only dry-run results include formatted text. A check that detects changes returns this same result with status 1.

# examples

- Format every Apex file under a directory:

  <%= config.bin %> <%= command.id %> --path force-app/main/default

- Format multiple paths, including a path with spaces:

  <%= config.bin %> <%= command.id %> --path src/MyClass.cls --path "src/shared classes"

- Check formatting in CI without changing files:

  <%= config.bin %> <%= command.id %> --path force-app --check --json

- Preview a file with an explicit configuration:

  <%= config.bin %> <%= command.id %> --path src/MyClass.cls --config style-guide.xml --dry-run

# flags.path.summary

Local Apex file or directory to format; repeat this flag for multiple paths.

# flags.path.description

Directories are searched recursively for .cls and .trigger files. Supply each path with its own --path flag, and quote paths containing spaces.

# flags.config.summary

Existing style-guide.xml or Apex Formatter TOML configuration file.

# flags.config.description

Override configuration discovery with the supplied file.

# flags.check.summary

Check for formatting changes without writing files.

# flags.check.description

Exit with status 1 when changes are needed or formatting fails. File details remain available in the JSON result.

# flags.dry-run.summary

Preview formatted text without writing files.

# flags.dry-run.description

Human output prints each formatted file with a path heading. JSON output includes the formatted text in each successful file result.

# info.formatter

formatter

# info.preview

===== %s =====

# info.formatted

Formatted: %s

# info.needs-formatting

Needs formatting: %s

# info.summary

%s: %s files scanned, %s changed, %s unchanged, %s written, %s errors.

# warning.error

%s [%s]: %s
