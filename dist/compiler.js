"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SFCCompiler = void 0;
const component_compiler_utils_1 = require("@vue/component-compiler-utils");
const postcss_modules_sync_1 = require("postcss-modules-sync");
const postcss_clean_1 = require("./postcss-clean");
const fs = require("fs");
const path = require("path");
const hash = require('hash-sum');
const templateCompiler = require('vue-template-compiler');
class SFCCompiler {
    constructor(script, style, template, resolve = require.resolve) {
        this.template = template;
        this.style = style;
        this.script = script;
        this.resolve = resolve;
    }
    compileToDescriptor(filename, source) {
        const descriptor = component_compiler_utils_1.parse({
            source,
            filename,
            needMap: true,
            compiler: templateCompiler
        });
        const scopeId = 'data-v-' +
            (this.template.isProduction
                ? hash(path.basename(filename) + source)
                : hash(filename + source));
        const template = descriptor.template
            ? this.compileTemplate(filename, descriptor.template)
            : undefined;
        const styles = descriptor.styles.map(style => this.compileStyle(filename, scopeId, style));
        const { script: rawScript, customBlocks } = descriptor;
        const script = rawScript
            ? {
                code: rawScript.src
                    ? this.read(rawScript.src, filename)
                    : rawScript.content,
                map: rawScript.map
            }
            : undefined;
        return {
            scopeId,
            template,
            styles,
            script,
            customBlocks
        };
    }
    compileToDescriptorAsync(filename, source) {
        return __awaiter(this, void 0, void 0, function* () {
            const descriptor = component_compiler_utils_1.parse({
                source,
                filename,
                needMap: true,
                compiler: templateCompiler
            });
            const scopeId = 'data-v-' +
                (this.template.isProduction
                    ? hash(path.basename(filename) + source)
                    : hash(filename + source));
            const template = descriptor.template
                ? this.compileTemplate(filename, descriptor.template)
                : undefined;
            const styles = yield Promise.all(descriptor.styles.map(style => this.compileStyleAsync(filename, scopeId, style)));
            const { script: rawScript, customBlocks } = descriptor;
            const script = rawScript
                ? {
                    code: rawScript.src
                        ? this.read(rawScript.src, filename)
                        : rawScript.content,
                    map: rawScript.map
                }
                : undefined;
            return {
                scopeId,
                template,
                styles,
                script,
                customBlocks
            };
        });
    }
    compileTemplate(filename, template) {
        const _a = this.template, { preprocessOptions } = _a, options = __rest(_a, ["preprocessOptions"]);
        const functional = 'functional' in template.attrs;
        return Object.assign({ functional }, component_compiler_utils_1.compileTemplate(Object.assign(Object.assign({}, options), { source: template.src
                ? this.read(template.src, filename)
                : template.content, filename, preprocessLang: template.lang, preprocessOptions: (template.lang &&
                preprocessOptions &&
                preprocessOptions[template.lang]) ||
                {}, isFunctional: functional })));
    }
    compileStyle(filename, scopeId, style) {
        const { options, prepare } = this.doCompileStyle(filename, scopeId, style);
        return prepare(component_compiler_utils_1.compileStyle(options));
    }
    compileStyleAsync(filename, scopeId, style) {
        return __awaiter(this, void 0, void 0, function* () {
            const { options, prepare } = this.doCompileStyle(filename, scopeId, style);
            return prepare(yield component_compiler_utils_1.compileStyleAsync(options));
        });
    }
    doCompileStyle(filename, scopeId, style) {
        let tokens = undefined;
        const needsCSSModules = style.module === true || typeof style.module === 'string';
        const needsCleanCSS = this.template.isProduction && !(this.style.postcssCleanOptions && this.style.postcssCleanOptions.disabled);
        const postcssPlugins = (this.style.postcssPlugins || [])
            .slice()
            .concat([
            needsCSSModules
                ? postcss_modules_sync_1.default(Object.assign(Object.assign({ generateScopedName: '[path][local]-[hash:base64:4]' }, this.style.postcssModulesOptions), { getJSON: (t) => {
                        tokens = t;
                    } }))
                : undefined,
            needsCleanCSS
                ? postcss_clean_1.default(this.style.postcssCleanOptions)
                : undefined,
        ])
            .filter(Boolean);
        const preprocessOptions = (style.lang &&
            this.style.preprocessOptions &&
            this.style.preprocessOptions[style.lang]) ||
            {};
        const source = style.src ? this.read(style.src, filename) : style.content;
        return {
            options: {
                source: preprocessOptions.data ? `${preprocessOptions.data}\n${source}` : source,
                filename,
                id: scopeId,
                map: style.map,
                scoped: style.scoped || false,
                postcssPlugins,
                postcssOptions: this.style.postcssOptions,
                preprocessLang: style.lang,
                preprocessOptions,
                trim: this.style.trim
            },
            prepare: result => (Object.assign(Object.assign({ media: typeof style.attrs.media === 'string' ? style.attrs.media : undefined, scoped: style.scoped, moduleName: style.module === true ? '$style' : style.module, module: tokens }, result), { code: result.code }))
        };
    }
    read(filename, context) {
        try {
            return fs
                .readFileSync(filename.startsWith('.')
                ? path.resolve(path.dirname(context), filename)
                : this.resolve(filename, { paths: [path.dirname(context)] }))
                .toString();
        }
        catch (e) {
            if (/cannot find module/i.test(e.message)) {
                throw Error(`Cannot find '${filename}' in '${context}'`);
            }
            throw e;
        }
    }
}
exports.SFCCompiler = SFCCompiler;
