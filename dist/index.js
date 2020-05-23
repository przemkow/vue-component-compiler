"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultCompiler = exports.createCompiler = void 0;
const compiler_1 = require("./compiler");
exports.createCompiler = ({ script, style, template }) => new compiler_1.SFCCompiler(script, style, template);
exports.createDefaultCompiler = (options = {}) => exports.createCompiler({
    script: Object.assign({}, options.script),
    style: Object.assign({ trim: true }, options.style),
    template: Object.assign({ compiler: require('vue-template-compiler'), compilerOptions: {}, isProduction: process.env.NODE_ENV === 'production', optimizeSSR: process.env.VUE_ENV === 'server' }, options.template)
});
__exportStar(require("./compiler"), exports);
__exportStar(require("./assembler"), exports);
