export type ConfigValues = {
    max_width: number;
    indent_size: number;
    continuation_indent_size: number;
    else_on_new_line: boolean;
    while_on_new_line: boolean;
    catch_on_new_line: boolean;
    finally_on_new_line: boolean;
    keep_simple_blocks_in_one_line: boolean;
    class_brace_style: number;
    method_brace_style: number;
    brace_style: number;
    query_bracket_style: number;
    reformat_apex_doc: boolean;
};
/** Mirrors the Ruby formatter's settings and first-file configuration discovery. */
export declare class Config implements ConfigValues {
    readonly max_width: number;
    readonly indent_size: number;
    readonly continuation_indent_size: number;
    readonly else_on_new_line: boolean;
    readonly while_on_new_line: boolean;
    readonly catch_on_new_line: boolean;
    readonly finally_on_new_line: boolean;
    readonly keep_simple_blocks_in_one_line: boolean;
    readonly class_brace_style: number;
    readonly method_brace_style: number;
    readonly brace_style: number;
    readonly query_bracket_style: number;
    readonly reformat_apex_doc: boolean;
    constructor(values?: Partial<ConfigValues>);
    query_bracket_next_line(): boolean;
    class_brace_next_line(): boolean;
    method_brace_next_line(): boolean;
    brace_next_line(): boolean;
    static from_toml(content: string): Config;
    static from_xml(content: string): Config;
    static from_file(file: string): Promise<Config>;
    static discover(startPath: string): Promise<Config>;
}
