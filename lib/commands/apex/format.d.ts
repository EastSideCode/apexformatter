import { SfCommand } from '@salesforce/sf-plugins-core';
import { type FormatOptions, type FormatResult } from '../../formatter.js';
export default class ApexFormat extends SfCommand<FormatResult> {
    static readonly summary: string;
    static readonly description: string;
    static readonly examples: string[];
    static readonly flags: {
        path: import("@oclif/core/interfaces").OptionFlag<string[], import("@oclif/core/interfaces").CustomOptions>;
        config: import("@oclif/core/interfaces").OptionFlag<string | undefined, import("@oclif/core/interfaces").CustomOptions>;
        check: import("@oclif/core/interfaces").BooleanFlag<boolean>;
        'dry-run': import("@oclif/core/interfaces").BooleanFlag<boolean>;
    };
    run(): Promise<FormatResult>;
    protected executeFormat(options: FormatOptions): Promise<FormatResult>;
}
