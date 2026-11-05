import { registerHooks } from "node:module";

// Node 原生运行项目 TS；只补齐 Next.js 使用的路径别名和包子路径。
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`../${specifier.slice(2)}.ts`, import.meta.url).href, context);
    }
    return nextResolve(specifier === "next/server" ? "next/server.js" : specifier, context);
  },
});
