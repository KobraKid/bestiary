/* eslint-disable @typescript-eslint/no-explicit-any */
declare module "handlebars-async-helpers" {
    import * as hbs from "handlebars";

    type Handlebars = typeof hbs;

    function asyncHelpers(handlebars: Handlebars): asyncHelpers.AsyncHandlebars;

    namespace asyncHelpers {
        // At least an empty namespace is necessary for allowing "import * as" when allowSyntheticDefaultImports is
        // false. But we'll export our custom types too, so they can be imported too, they can be useful.

        type AsyncTemplateDelegate<Context> = (context: Context, options?: hbs.RuntimeOptions) => Promise<string>;

        type AsyncHandlebars = Omit<Handlebars, "compile"> & {
            // CompileOptions is not explicitly imported because it's transient in the scope due to how it's declared in
            // Handlebars.
            compile<Context = unknown>(input: any, options?: CompileOptions): AsyncTemplateDelegate<Context>;
        }

        type HelperOptions = Omit<Handlebars.HelperOptions, "fn" | "inverse"> & {
            fn<Context = unknown>(input: Context, options?: RuntimeOptions): Promise<string>;
            inverse<Context = unknown>(input: Context, options?: RuntimeOptions): Promise<string>;
        };
    }

    export = asyncHelpers;
}