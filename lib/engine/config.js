import { isUtf8 } from 'node:buffer';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { FormatterError } from '../errors.js';
const defaults = {
    max_width: 80, indent_size: 4, continuation_indent_size: 8,
    else_on_new_line: true, while_on_new_line: true, catch_on_new_line: true,
    finally_on_new_line: true, keep_simple_blocks_in_one_line: true,
    class_brace_style: 1, method_brace_style: 1, brace_style: 1,
    query_bracket_style: 2, reformat_apex_doc: true,
};
const integers = ['max_width', 'indent_size', 'continuation_indent_size'];
const booleans = [
    'else_on_new_line', 'while_on_new_line', 'catch_on_new_line', 'finally_on_new_line',
    'keep_simple_blocks_in_one_line', 'reformat_apex_doc',
];
const styles = ['class_brace_style', 'method_brace_style', 'brace_style', 'query_bracket_style'];
const configNames = ['style-guide.xml', '.apexformatter.toml', 'apexformatter.toml'];
const objects = (value) => (Array.isArray(value) ? value : [value]).filter((item) => typeof item === 'object' && item !== null);
/** Mirrors the Ruby formatter's settings and first-file configuration discovery. */
export class Config {
    max_width;
    indent_size;
    continuation_indent_size;
    else_on_new_line;
    while_on_new_line;
    catch_on_new_line;
    finally_on_new_line;
    keep_simple_blocks_in_one_line;
    class_brace_style;
    method_brace_style;
    brace_style;
    query_bracket_style;
    reformat_apex_doc;
    constructor(values = {}) {
        const merged = { ...defaults, ...values };
        for (const key of integers) {
            const value = merged[key];
            if (!Number.isSafeInteger(value) || value < (key === 'max_width' ? 1 : 0) ||
                (key !== 'max_width' && value > 256)) {
                throw new FormatterError('INVALID_CONFIG', `${key} must be a ${key === 'max_width' ? 'positive' : 'nonnegative'} integer${key === 'max_width' ? '' : ' no larger than 256'}.`);
            }
        }
        for (const key of styles) {
            if (merged[key] !== 1 && merged[key] !== 2) {
                throw new FormatterError('INVALID_CONFIG', `${key} must be 1 (end of line) or 2 (next line).`);
            }
        }
        for (const key of booleans) {
            if (typeof merged[key] !== 'boolean')
                throw new FormatterError('INVALID_CONFIG', `${key} must be a boolean.`);
        }
        this.max_width = merged.max_width;
        this.indent_size = merged.indent_size;
        this.continuation_indent_size = merged.continuation_indent_size;
        this.else_on_new_line = merged.else_on_new_line;
        this.while_on_new_line = merged.while_on_new_line;
        this.catch_on_new_line = merged.catch_on_new_line;
        this.finally_on_new_line = merged.finally_on_new_line;
        this.keep_simple_blocks_in_one_line = merged.keep_simple_blocks_in_one_line;
        this.class_brace_style = merged.class_brace_style;
        this.method_brace_style = merged.method_brace_style;
        this.brace_style = merged.brace_style;
        this.query_bracket_style = merged.query_bracket_style;
        this.reformat_apex_doc = merged.reformat_apex_doc;
    }
    query_bracket_next_line() { return this.query_bracket_style === 2; }
    class_brace_next_line() { return this.class_brace_style === 2; }
    method_brace_next_line() { return this.method_brace_style === 2; }
    brace_next_line() { return this.brace_style === 2; }
    static from_toml(content) {
        const values = {};
        // The original supports this deliberately small key=value subset of TOML.
        // Unknown keys and sections are ignored, just as in the Ruby formatter.
        for (const raw of content.split(/\r?\n/u)) {
            const line = raw.replace(/#.*/u, '').trim();
            const number = line.match(/^(max_width|indent_size|continuation_indent_size|class_brace_style|method_brace_style|brace_style|query_bracket_style)\s*=\s*(\d+)$/u);
            const bool = line.match(/^(else_on_new_line|while_on_new_line|catch_on_new_line|finally_on_new_line|keep_simple_blocks_in_one_line|reformat_apex_doc)\s*=\s*(true|false)$/iu);
            if (number) {
                values[number[1]] = Number(number[2]);
            }
            else if (bool) {
                values[bool[1].toLowerCase()] = bool[2].toLowerCase() === 'true';
            }
        }
        return new Config(values);
    }
    static from_xml(content) {
        const valid = XMLValidator.validate(content);
        if (valid !== true || /<!DOCTYPE|<!ENTITY/iu.test(content)) {
            throw new FormatterError('INVALID_CONFIG', valid === true ? 'XML configuration must not declare entities or a DTD.' : `Invalid XML configuration: ${valid.err.msg}`);
        }
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', parseAttributeValue: false, processEntities: false });
        const document = parser.parse(content);
        const values = {};
        const apexOptions = {
            CLASS_BRACE_STYLE: 'class_brace_style', METHOD_BRACE_STYLE: 'method_brace_style',
            BRACE_STYLE: 'brace_style', QUERY_BRACKET_STYLE: 'query_bracket_style',
            APEX_DOC_REFORMAT_APEX_DOC: 'reformat_apex_doc',
        };
        const commonOptions = {
            ELSE_ON_NEW_LINE: 'else_on_new_line', WHILE_ON_NEW_LINE: 'while_on_new_line',
            CATCH_ON_NEW_LINE: 'catch_on_new_line', FINALLY_ON_NEW_LINE: 'finally_on_new_line',
            KEEP_SIMPLE_BLOCKS_IN_ONE_LINE: 'keep_simple_blocks_in_one_line', RIGHT_MARGIN: 'max_width',
        };
        const indentOptions = { INDENT_SIZE: 'indent_size', CONTINUATION_INDENT_SIZE: 'continuation_indent_size' };
        const readOptions = (value, mapping) => {
            for (const option of objects(value)) {
                const key = mapping[String(option.name)];
                if (!key)
                    continue;
                const text = String(option.value);
                if (booleans.includes(key)) {
                    values[key] = text === 'true';
                }
                else {
                    if (!/^[+-]?\d+$/u.test(text))
                        throw new FormatterError('INVALID_CONFIG', `${String(option.name)} must be an integer.`);
                    values[key] = Number(text);
                }
            }
        };
        const visit = (value) => {
            for (const node of objects(value)) {
                for (const settings of objects(node.ApexCodeStyleSettings))
                    readOptions(settings.option, apexOptions);
                for (const settings of objects(node.codeStyleSettings)) {
                    if (settings.language !== 'Apex')
                        continue;
                    readOptions(settings.option, commonOptions);
                    for (const indent of objects(settings.indentOptions))
                        readOptions(indent.option, indentOptions);
                }
                for (const [key, child] of Object.entries(node)) {
                    if (key !== 'ApexCodeStyleSettings' && key !== 'codeStyleSettings')
                        visit(child);
                }
            }
        };
        visit(document);
        return new Config(values);
    }
    static async from_file(file) {
        try {
            const bytes = await readFile(file);
            if (!isUtf8(bytes))
                throw new FormatterError('INVALID_CONFIG', 'Configuration is not valid UTF-8.');
            const text = bytes.toString('utf8');
            return path.extname(file).toLowerCase() === '.xml' ? Config.from_xml(text) : Config.from_toml(text);
        }
        catch (error) {
            if (error instanceof FormatterError)
                throw error;
            throw new FormatterError('CONFIG_READ_ERROR', `Failed to read configuration ${file}: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
        }
    }
    static async discover(startPath) {
        const absolute = path.resolve(startPath);
        let directory = (await stat(absolute)).isFile() ? path.dirname(absolute) : absolute;
        for (;;) {
            for (const name of configNames) {
                const candidate = path.join(directory, name);
                try {
                    if ((await stat(candidate)).isFile())
                        return await Config.from_file(candidate);
                }
                catch (error) {
                    if (error.code !== 'ENOENT')
                        throw error;
                }
            }
            const parent = path.dirname(directory);
            if (parent === directory)
                return new Config();
            directory = parent;
        }
    }
}
//# sourceMappingURL=config.js.map