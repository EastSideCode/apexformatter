import { Messages } from '@salesforce/core';
import { Flags, SfCommand } from '@salesforce/sf-plugins-core';
import { formatPaths } from '../../formatter.js';
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('sf-plugin-apex-formatter', 'apex.format');
export default class ApexFormat extends SfCommand {
    static summary = messages.getMessage('summary');
    static description = messages.getMessage('description');
    static examples = messages.getMessages('examples');
    static flags = {
        path: Flags.string({
            char: 'p',
            summary: messages.getMessage('flags.path.summary'),
            description: messages.getMessage('flags.path.description'),
            multiple: true,
            multipleNonGreedy: true,
            required: true,
        }),
        config: Flags.file({
            char: 'c',
            summary: messages.getMessage('flags.config.summary'),
            description: messages.getMessage('flags.config.description'),
            exists: true,
        }),
        check: Flags.boolean({
            summary: messages.getMessage('flags.check.summary'),
            description: messages.getMessage('flags.check.description'),
            exclusive: ['dry-run'],
        }),
        'dry-run': Flags.boolean({
            char: 'n',
            summary: messages.getMessage('flags.dry-run.summary'),
            description: messages.getMessage('flags.dry-run.description'),
            exclusive: ['check'],
        }),
    };
    async run() {
        const { flags } = await this.parse(ApexFormat);
        const mode = flags.check ? 'check' : flags['dry-run'] ? 'dry-run' : 'write';
        const options = {
            paths: flags.path,
            mode,
            ...(flags.config === undefined ? {} : { configPath: flags.config }),
        };
        const result = await this.executeFormat(options);
        for (const error of result.errors) {
            const location = error.path ?? messages.getMessage('info.formatter');
            this.warn(messages.getMessage('warning.error', [location, error.code, error.message]));
        }
        for (const file of result.files) {
            if (result.mode === 'dry-run' && file.formatted !== undefined) {
                this.log(messages.getMessage('info.preview', [file.path]));
                this.log(file.formatted);
            }
            else if (file.status === 'changed') {
                const messageKey = file.written ? 'info.formatted' : 'info.needs-formatting';
                this.log(messages.getMessage(messageKey, [file.path]));
            }
        }
        this.log(messages.getMessage('info.summary', [
            result.mode,
            result.scannedFiles,
            result.changedFiles,
            result.unchangedFiles,
            result.writtenFiles,
            result.errors.length,
        ]));
        const failed = result.errors.length > 0 || (result.mode === 'check' && result.changedFiles > 0);
        if (failed) {
            // SfCommand includes this exit status while preserving the typed JSON result.
            process.exitCode = 1;
        }
        return result;
    }
    async executeFormat(options) {
        return formatPaths(options);
    }
}
//# sourceMappingURL=format.js.map