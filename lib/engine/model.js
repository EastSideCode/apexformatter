/** Model names are registered once; mutable format state belongs to the context. */
export class Model {
    context;
    constructor(context) {
        this.context = context;
    }
    build(builder) {
        const result = [];
        this.build_inner(builder, result);
        return builder.concat(result);
    }
    build_inner(_builder, _result) {
        throw new Error('A formatter model has no build implementation.');
    }
}
const constructors = new Map();
export function register(name, constructor) {
    const previous = constructors.get(name);
    if (previous && previous !== constructor)
        throw new Error(`Duplicate formatter model: ${name}`);
    constructors.set(name, constructor);
}
export function create(name, context, ...args) {
    const constructor = constructors.get(name);
    if (!constructor)
        throw new Error(`Unknown formatter model: ${name}`);
    return new constructor(context, ...args);
}
export function make(name, context, variant, value) {
    return create(name, context, variant, value);
}
//# sourceMappingURL=model.js.map