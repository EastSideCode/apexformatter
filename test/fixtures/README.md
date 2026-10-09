# Recorded formatter baselines

These fixtures are self-contained development test data. Running or reviewing them requires Node.js and the package's installed dependencies, with no original formatter source checkout or reference executable.

- `formatter.golden.json` contains 17 Apex examples, a shared configuration, and each example's exact expected output.
- `queries.golden.json` contains six examples with their own Apex input, configuration, and exact expected output.

The recorded expected outputs were established before publication of the TypeScript port and remain unchanged. Each baseline contains its complete input, configuration, and expected output; the tests never read original formatter sources or regenerate expectations.

From the package directory, run `npm test`. The tests build and execute the TypeScript engine with its packaged WASM parser, compare its output with the checked-in JSON, and run additional syntax and stability checks. Testing requires only Node.js and the installed dependencies.

To review a fixture change, compare its Apex input, configuration, and expected output directly, explain the intended behavior change, and run the Node tests. New or deliberately revised expectations can be written and reviewed directly. Do not replace recorded expectations automatically with the current engine's output just to make a failing test pass. Identify newly authored or revised expectations in the change description so reviewers can distinguish intentional changes from the established baselines.

The package's explicit npm `files` allowlist includes runtime code, command messages, package documentation, the license, and the style guide. It excludes `test/`, including these fixtures and both baseline test files. These artifacts belong to the development checkout and are not part of the published runtime package.
