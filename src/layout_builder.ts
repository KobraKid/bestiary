import asyncHelpers, { AsyncHandlebars, HelperOptions } from "handlebars-async-helpers";
import path from "path";
import { SafeString } from "handlebars";
import { hb, paths } from "./electron";
import Entry, { IEntrySchema } from "./model/Entry";
import { ISO639Code } from "./model/Package";
import Resource from "./model/Resource";
import { ViewType, getAttribute, getLayout, getStyle } from "./database";

function getDataFromOptions<T>(options: HelperOptions, data: string): T {
    return options.data.root[data];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDelegateParams(context?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any, options?: any): { context: any, arg1: any, arg2: any, arg3: any, arg4: any, arg5: any, options: HelperOptions } {
    // All args are defined
    if (typeof options !== "undefined" && "data" in options && "hash" in options) {
        return { context, arg1, arg2, arg3, arg4, arg5, options };
    }
    // Context + arg1-arg4 are defined
    else if (typeof arg5 !== "undefined" && "data" in arg5 && "hash" in arg5) {
        return { context, arg1, arg2, arg3, arg4, arg5: undefined, options: arg5 };
    }
    // Context + arg1-arg3 are defined
    else if (typeof arg4 !== "undefined" && "data" in arg4 && "hash" in arg4) {
        return { context, arg1, arg2, arg3, arg4: undefined, arg5: undefined, options: arg4 };
    }
    // Context + arg1-arg2 are defined
    else if (typeof arg3 !== "undefined" && "data" in arg3 && "hash" in arg3) {
        return { context, arg1, arg2, arg3: undefined, arg4: undefined, arg5: undefined, options: arg3 };
    }
    // Context + arg1 are defined
    else if (typeof arg2 !== "undefined" && "data" in arg2 && "hash" in arg2) {
        return { context, arg1, arg2: undefined, arg3: undefined, arg4: undefined, arg5: undefined, options: arg2 };
    }
    // Context is defined
    else if (typeof arg1 !== "undefined" && "data" in arg1 && "hash" in arg1) {
        return { context, arg1: undefined, arg2: undefined, arg3: undefined, arg4: undefined, arg5: undefined, options: arg1 };
    }
    // No args defined, context is actually options parameter
    return { context: undefined, arg1: undefined, arg2: undefined, arg3: undefined, arg4: undefined, arg5: undefined, options: context };
}

export function registerHelpers(handlebars: typeof Handlebars): AsyncHandlebars {
    const hb = asyncHelpers(handlebars);

    hb.registerHelper("each", async (_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options) => {
        const { context, options } = parseDelegateParams(_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options);
        return await __eachHelper(context, options);
    });

    hb.registerHelper("view", async (_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options) => {
        const { context, options } = parseDelegateParams(_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options);
        return await __viewHelper(hb, context, options);
    });

    hb.registerHelper("image", async (_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options) => {
        const { context, options } = parseDelegateParams(_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options);
        return await __imageHelper(hb, context, options);
    });

    hb.registerHelper("string", async (_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options) => {
        const { context, options } = parseDelegateParams(_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options);
        return await __stringHelper(context, options);
    });

    hb.registerHelper("path", (_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options) => {
        const { context, options } = parseDelegateParams(_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options);
        return __pathHelper(context, options);
    });

    hb.registerHelper("eq", async (_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options) => {
        const { context, arg1, options } = parseDelegateParams(_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options);
        return __eqHelper(context, arg1, options);
    });

    return hb;
}

async function __eachHelper(context: object, options: HelperOptions): Promise<string | SafeString> {
    const entry = getDataFromOptions<IEntrySchema>(options, "entry");
    if (!entry) { return ""; }

    let attributePath = "";

    Object.keys(options.hash).forEach(key => {
        if (key === "path") {
            attributePath = options.hash[key];
        }
    });

    const array: [] = await getAttribute(entry.packageId, attributePath, context ?? entry, {}) ?? this;
    let result = "";

    for (let i = 0; i < array.length; i++) {
        result += await options.fn(array[i], { data: options.data, blockParams: [array[i], i] });
    }

    return result;
}

async function __viewHelper(hb: AsyncHandlebars, context: object, options: HelperOptions): Promise<string | SafeString> {
    const entry = getDataFromOptions<IEntrySchema>(options, "entry");
    const lang = getDataFromOptions<ISO639Code>(options, "lang");
    if (entry) {
        const [linkedCollectionId, linkedBid]: [string, string] = (await getAttribute(entry.packageId, options.hash["path"], context ?? entry, {}) as string).split(".") as [string, string];
        const linkedEntry = await Entry.findOne({ packageId: entry.packageId, collectionId: linkedCollectionId, bid: linkedBid }).lean().exec();
        if (linkedEntry) {
            const layout = await (await getLayout(linkedEntry.packageId, linkedCollectionId, ViewType.preview))({ entry: linkedEntry, lang });
            const style = getStyle(linkedEntry.packageId, linkedCollectionId, ViewType.preview);
            return new hb.SafeString(layout + style);
        }
    }
    return "";
}

async function __imageHelper(hb: AsyncHandlebars, context: object, options: HelperOptions): Promise<string | SafeString> {
    const entry = getDataFromOptions<IEntrySchema>(options, "entry");

    if (!entry) { return ""; }

    // full image path
    let src = "";

    // constructed image path (prefix + path + suffix)
    let prefix = "";
    let attributePath = "";
    let suffix = "";

    const attributes: string[] = [];

    Object.keys(options.hash).forEach(key => {
        if (key === "src") {
            src = options.hash[key];
        }
        else if (key === "prefix") {
            prefix = options.hash[key];
        }
        else if (key === "path") {
            attributePath = options.hash[key];
        }
        else if (key === "suffix") {
            suffix = options.hash[key];
        }
        else {
            attributes.push(`${key}="${options.hash[key]}"`);
        }
    });

    if (src === "") {
        src = prefix + await getAttribute(entry.packageId, attributePath, context ?? entry, {}) + suffix;
    }

    return new hb.SafeString(`<img src="${path.join(paths.data, entry.packageId, "images", src)}" ${attributes.join(" ")} />`);
}

async function __stringHelper(context: object, options: HelperOptions): Promise<string | SafeString> {
    const entry = getDataFromOptions<IEntrySchema>(options, "entry");
    const lang = getDataFromOptions<ISO639Code>(options, "lang");

    let attributePath = "";
    let resId = "";

    Object.keys(options.hash).forEach(key => {
        if (key === "path") {
            attributePath = options.hash[key];
        }
        else if (key === "resId") {
            resId = options.hash[key];
        }
    });

    if (resId === "" && attributePath !== "") {
        resId = await getAttribute(entry.packageId, attributePath, context ?? entry, {}) as string;
    }

    const resource = await Resource.findOne({ packageId: entry.packageId, resId }).lean().exec();
    return hb.escapeExpression(resource?.values[lang] ?? "");
}

function __pathHelper(context: string, options: HelperOptions): string | SafeString {
    const entry = getDataFromOptions<IEntrySchema>(options, "entry");
    if (!entry) { return ""; }

    return new hb.SafeString(path.join(paths.data, entry.packageId, context).replace(/\\/g, "/"));
}

async function __eqHelper(context: unknown, arg1: unknown, options: HelperOptions): Promise<string | SafeString> {
    const entry = getDataFromOptions<IEntrySchema>(options, "entry");
    let lCompare = context;
    let rCompare = arg1;
    let lPath = "";
    let rPath = "";
    Object.keys(options.hash).forEach(key => {
        if (key === "lPath") {
            lPath = options.hash[key];
        }
        else if (key === "rPath") {
            rPath = options.hash[key];
        }
    });
    if (lPath !== "") {
        lCompare = await getAttribute(entry.packageId, lPath, context ?? entry, {});
    }
    if (rPath !== "") {
        rCompare = await getAttribute(entry.packageId, rPath, arg1 ?? entry, {});
    }
    return lCompare == rCompare ? (await options.fn(this)) : (await options.inverse(this));
}