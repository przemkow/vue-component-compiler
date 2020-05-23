import { SFCCompiler, StyleOptions, TemplateOptions, ScriptOptions } from './compiler';
export declare const createCompiler: ({ script, style, template }: {
    script: ScriptOptions;
    style: StyleOptions;
    template: TemplateOptions;
}) => SFCCompiler;
export declare const createDefaultCompiler: (options?: {
    script?: ScriptOptions;
    style?: StyleOptions;
    template?: TemplateOptions;
}) => SFCCompiler;
export * from './compiler';
export * from './assembler';
