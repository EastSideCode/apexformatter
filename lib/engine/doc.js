export class PrettyPrinter {
    maxWidth;
    col = 0;
    chunks;
    constructor(doc, maxWidth) {
        this.maxWidth = maxWidth;
        this.chunks = [{ doc, indent: 0, flat: false }];
    }
    print() {
        let result = '';
        let chunk;
        while ((chunk = this.chunks.pop())) {
            const doc = chunk.doc;
            if (typeof doc === 'string') {
                switch (doc) {
                    case 'newline':
                        result += this.newline(chunk);
                        break;
                    case 'softline':
                        if (chunk.flat) {
                            result += ' ';
                            this.col += 1;
                        }
                        else
                            result += this.newline(chunk);
                        break;
                    case 'maybeline':
                        if (!chunk.flat)
                            result += this.newline(chunk);
                        break;
                    case 'newline_with_no_indent':
                        result += '\n';
                        this.col = 0;
                        break;
                    case 'newline_when_in_flat':
                        if (chunk.flat)
                            result += this.newline(chunk);
                        break;
                    case 'force_break':
                        break;
                }
                continue;
            }
            switch (doc.kind) {
                case 'text':
                    // Comment attachment can request a space already supplied by a neighbor.
                    if (doc.s !== ' ' || !result.endsWith(' ')) {
                        result += doc.s;
                        this.col += doc.width;
                    }
                    break;
                case 'flat':
                    this.chunks.push({ ...chunk, doc: doc.doc, flat: true });
                    break;
                case 'indent':
                    this.chunks.push({ ...chunk, doc: doc.doc, indent: chunk.indent + doc.amount });
                    break;
                case 'dedent':
                    this.chunks.push({ ...chunk, doc: doc.doc, indent: Math.max(0, chunk.indent - doc.amount) });
                    break;
                case 'concat':
                    for (let i = doc.docs.length - 1; i >= 0; i--)
                        this.chunks.push({ ...chunk, doc: doc.docs[i] });
                    break;
                case 'choice':
                    this.chunks.push({ ...chunk, doc: chunk.flat || this.fits({ ...chunk, doc: doc.first }) ? doc.first : doc.second });
                    break;
            }
        }
        return result;
    }
    newline(chunk) {
        this.col = chunk.indent;
        return '\n' + ' '.repeat(chunk.indent);
    }
    fits(initial) {
        let remaining = Math.max(0, this.maxWidth - this.col);
        const stack = [initial];
        let restIndex = this.chunks.length - 1;
        while (true) {
            let chunk = stack.pop();
            if (!chunk) {
                if (restIndex < 0)
                    return true;
                chunk = this.chunks[restIndex--];
            }
            const doc = chunk.doc;
            if (typeof doc === 'string') {
                switch (doc) {
                    case 'newline':
                    case 'newline_with_no_indent':
                        return true;
                    case 'newline_when_in_flat':
                        if (chunk.flat)
                            return false;
                        break;
                    case 'force_break':
                        return false;
                    case 'softline':
                        if (!chunk.flat)
                            return true;
                        if (remaining < 1)
                            return false;
                        remaining -= 1;
                        break;
                    case 'maybeline':
                        if (!chunk.flat)
                            return true;
                        break;
                }
                continue;
            }
            switch (doc.kind) {
                case 'text':
                    if (doc.width > remaining)
                        return false;
                    remaining -= doc.width;
                    break;
                case 'flat':
                    stack.push({ ...chunk, doc: doc.doc, flat: true });
                    break;
                case 'indent':
                    stack.push({ ...chunk, doc: doc.doc, indent: chunk.indent + doc.amount });
                    break;
                case 'dedent':
                    stack.push({ ...chunk, doc: doc.doc, indent: Math.max(0, chunk.indent - doc.amount) });
                    break;
                case 'concat':
                    for (let i = doc.docs.length - 1; i >= 0; i--)
                        stack.push({ ...chunk, doc: doc.docs[i] });
                    break;
                case 'choice':
                    // As in Ruby, the fallback's first line is assumed no longer than the flat choice.
                    stack.push({ ...chunk, doc: chunk.flat ? doc.first : doc.second });
                    break;
            }
        }
    }
}
export function prettyPrint(doc, maxWidth) {
    return new PrettyPrinter(doc, maxWidth).print();
}
export const pretty_print = prettyPrint;
//# sourceMappingURL=doc.js.map