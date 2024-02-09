import { SafeString } from "handlebars";
import asyncHelpers, { AsyncHandlebars, HelperOptions } from "handlebars-async-helpers";
import { IEntrySchema } from "../model/Entry";
import { ISO639Code } from "../model/Package";
import { ViewType, getAttribute, getLayout, getResource, getScript, getStyle } from "./database";
import { hb } from "./electron";

/**
 * Gets data from the handlebars options
 * @param options The handlebars options
 * @param data The data node to retrieve
 * @returns The data value
 */
function getDataFromOptions<T>(options: HelperOptions, data: string): T {
    return options.data.root[data];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface IParams { context: any, arg1: any, arg2: any, arg3: any, arg4: any, arg5: any, options: HelperOptions }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseDelegateParams(context?: any, arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any, options?: any): IParams {
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

/**
 * Registers bestiary helpers to handlebars
 * @param handlebars The instance of handlebars to register helpers to
 * @returns An async handlebars instance that can handle bestiary handlebars calls
 */
export function registerHelpers(handlebars: typeof Handlebars): AsyncHandlebars {
    const hb = asyncHelpers(handlebars);

    hb.registerHelper("attr", async (_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options) => {
        const { context, options } = parseDelegateParams(_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options);
        return await __attrHelper(context, options);
    });

    hb.registerHelper("each", async (_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options) => {
        const { context, options } = parseDelegateParams(_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options);
        return await __eachHelper(context, options);
    });

    hb.registerHelper("view", async (_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options) => {
        const { context, options } = parseDelegateParams(_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options);
        return await __viewHelper(hb, context, options);
    });

    hb.registerHelper("link", async (_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options) => {
        const { context, options } = parseDelegateParams(_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options);
        return await __linkHelper(context, options);
    });

    hb.registerHelper("image", async (_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options) => {
        const { context, options } = parseDelegateParams(_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options);
        return await __imageHelper(hb, context, options);
    });

    hb.registerHelper("string", async (_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options) => {
        const { context, options } = parseDelegateParams(_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options);
        return await __stringHelper(context, options);
    });

    hb.registerHelper("eq", async (_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options) => {
        const { context, arg1, arg2, options } = parseDelegateParams(_context, _arg1, _arg2, _arg3, _arg4, _arg5, _options);
        return __eqHelper(context, arg1, arg2, options);
    });

    return hb;
}

async function __attrHelper(context: object, options: HelperOptions): Promise<string | SafeString> {
    const entry = getDataFromOptions<IEntrySchema>(options, "entry");

    let attributePath = "";

    Object.keys(options.hash).forEach(key => {
        if (key === "path") {
            attributePath = options.hash[key];
        }
    });

    const attrValue = await getAttribute(context || entry, attributePath);
    return new hb.SafeString(attrValue + "");
}

/**
 * Handles an {{#each}} block asynchronously
 */
async function __eachHelper(context: object, options: HelperOptions): Promise<string | SafeString> {
    const entry = getDataFromOptions<IEntrySchema>(options, "entry");

    let attributePath = "";

    Object.keys(options.hash).forEach(key => {
        if (key === "path") {
            attributePath = options.hash[key];
        }
    });

    const array = Array.isArray(context) && attributePath === "" ? context : await getAttribute(context || entry, attributePath) as unknown[];

    let result = "";
    if (array.length > 0) {
        for (let i = 0; i < array.length; i++) {
            const blockData = await getAttribute(array[i], "");
            result += await options.fn(blockData, { data: options.data, blockParams: [blockData, i] });
        }
    }
    else {
        result = await options.inverse(context ?? entry);
    }

    return result;
}

/**
 * Handles a {{view}} element asynchronously
 */
async function __viewHelper(hb: AsyncHandlebars, context: unknown, options: HelperOptions): Promise<string | SafeString> {
    const entry = getDataFromOptions<IEntrySchema>(options, "entry");
    const lang = getDataFromOptions<ISO639Code>(options, "lang");
    const scripts = getDataFromOptions<{ [key: string]: string }>(options, "scripts") || {};
    const attrPath = options.hash["path"] ?? "";
    const linkedEntry = await getAttribute(context || entry, attrPath) as IEntrySchema;

    if (linkedEntry && linkedEntry.packageId != null && linkedEntry.groupId != null) {
        if (linkedEntry.groupId === entry.groupId && linkedEntry.bid === linkedEntry.bid) { return ""; }

        const layout = await (await getLayout(linkedEntry.packageId, linkedEntry.groupId, ViewType.preview))({ entry: linkedEntry, lang });
        const style = await getStyle(linkedEntry.packageId, linkedEntry.groupId, ViewType.preview, { entry: linkedEntry, lang });

        const scriptKey = `${linkedEntry.packageId}${linkedEntry.groupId}.${ViewType.preview}`;
        if (!scripts[scriptKey]) {
            const script = await (await getScript(linkedEntry.packageId, linkedEntry.groupId))({ entry: linkedEntry, lang });
            scripts[scriptKey] = script;
        }

        return new hb.SafeString(layout + style);
    }
    else if (linkedEntry !== null) {
        console.debug("Failed to get view for", context, "found", linkedEntry);
    }
    return "";
}

/**
 * Handles a {{link}} element asynchronously
 */
async function __linkHelper(context: unknown, options: HelperOptions): Promise<string | SafeString> {
    const entry = getDataFromOptions<IEntrySchema>(options, "entry");
    const attrPath = options.hash["path"] ?? "";
    const link = await getAttribute(context || entry, attrPath) as IEntrySchema;
    if (link) {
        return `data-linked-group="${link.groupId}" data-linked-entry="${link.bid}"`;
    }
    return "";
}

/**
 * Handles an {{image}} element asynchronously
 */
async function __imageHelper(hb: AsyncHandlebars, context: unknown, options: HelperOptions): Promise<string | SafeString> {
    const entry = getDataFromOptions<IEntrySchema>(options, "entry");

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
        src = prefix + await getAttribute(context || entry, attributePath) + suffix;
    }

    return new hb.SafeString(`<img src="bestiary://${entry.packageId}/${src}" ${attributes.join(" ")} />`);
}

/**
 * Handles a {{string}} element asynchronously
 */
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
        resId = await getAttribute(context || entry, attributePath) as string;
    }

    const resource = await getResource(entry.packageId, resId, lang);
    return new hb.SafeString(escapeString(resource));
}

/**
 * Handles an {{#eq}} block asynchronously.
 * 
 * Syntax: {{#eq context [arg1] [arg2] [lPath="..."] [rPath="..."]}}
 * 
 * If arg1 is provided, it is used as the left side of an equality comparison.
 * If arg2 is provided, it is used as the right side of an equality comparison.
 * If lPath is provided, it is used instead of arg1.
 * If rPath is provided, it is used instead of arg2.
 * 
 * Performs an equality check bewteen the left and right side values.
 * 
 * @param context The context to use inside the block
 * @param arg1 The first argument passed in
 * @param arg2 The second argument passed in
 * @param options Handlebars options
 * 
 * @returns A string containing the contents of the block if the left and right sides of the comparison were equal.
 */
async function __eqHelper(context: unknown, arg1: unknown, arg2: unknown, options: HelperOptions): Promise<string | SafeString> {
    const entry = getDataFromOptions<IEntrySchema>(options, "entry");
    let lCompare = arg1;
    let rCompare = arg2;
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
        lCompare = await getAttribute(context || entry, lPath);
    }
    if (rPath !== "") {
        rCompare = await getAttribute(context || entry, rPath);
    }
    return lCompare == rCompare ? (await options.fn(context, { data: options.data, blockParams: [context] })) : (await options.inverse(context, { data: options.data, blockParams: [context] }));
}

/**
 * Escapes < and >
 */
function escapeString(str: string): string {
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}