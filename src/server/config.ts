import chalk from "chalk";
import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import { paths } from "./electron";
import { IAppConfig, IAppearanceConfig, IServerConfig, IServerInstance } from "../model/Config";
import { IpcMainEvent, app } from "electron";
import { setup } from "./database";

const defaultServer: IServerInstance = {
    connectionKey: "0|mongodb+srv://<username>:<password>@bestiary.scnanv0.mongodb.net/?retryWrites=true&w=majority",
    name: "Bestiary",
    url: "mongodb+srv://<username>:<password>@bestiary.scnanv0.mongodb.net/?retryWrites=true&w=majority",
    username: "Bestiary",
    password: "Bestiary",
    visiblePackages: []
};

const defaultAppearance: IAppearanceConfig = {
    bgColor: "#808080"
};

const defaultConfig = {
    serverConfig: {
        serverList: [defaultServer]
    },
    appearance: defaultAppearance,
    version: app.getVersion()
};

type AppConfigWithVersion = IAppConfig & { version: string };

export class Config {
    private readonly _configFilePath: string;
    private _config: AppConfigWithVersion;

    constructor() {
        this._configFilePath = path.join(paths.config, "config.json");
        this._config = defaultConfig;
    }

    public async initialiazeConfig() {
        try {
            await mkdir(paths.config, { recursive: true });
            await this.loadConfig();
        } catch (err) {
            console.log(chalk.white.bgRed("❌ Error loading app config", err));
        }
    }

    public async saveConfig(): Promise<void> {
        if (this._config) {
            await writeFile(this._configFilePath, JSON.stringify(this._config, undefined, 4));
        }
    }

    public async loadConfig(): Promise<void> {
        const contents = await readFile(this._configFilePath, { encoding: "utf-8" });
        const config = parseConfig(JSON.parse(contents));
        this.updateConfig(null, config);
    }

    public async updateConfig(event: IpcMainEvent | null, config: IAppConfig): Promise<void> {
        if (this._config && config) {

            // Server Settings
            if (config.serverConfig.serverList.length > 0) {
                this._config.serverConfig.serverList = config.serverConfig.serverList.slice();
            }
            else {
                this._config.serverConfig.serverList = [defaultServer];
            }

            // Display Settings
            this._config.appearance = {
                bgColor: config.appearance.bgColor ?? defaultAppearance.bgColor
            };

            const firstServer = config.serverConfig.serverList[0];
            if (firstServer) {
                await setup(firstServer);
            }
        }
        event && event.sender.send("config:updated-app-config", this._config);
    }

    get config(): IAppConfig {
        return this._config;
    }
}

function parseConfig(config: unknown): AppConfigWithVersion {
    if (typeof config === "object" && config !== null && config !== undefined) {
        if ("version" in config && config.version === app.getVersion()) {
            return config as unknown as AppConfigWithVersion;
        }
        else {
            return {
                serverConfig: ("serverConfig" in config) ? (config.serverConfig as IServerConfig) : {
                    serverList: [defaultServer]
                },
                appearance: {
                    bgColor: ("appearance" in config && typeof config.appearance === "object" && config.appearance !== null && "bgColor" in config.appearance) ?
                        "" + config.appearance.bgColor : "#808080"
                },
                version: app.getVersion()
            };
        }
    }
    return defaultConfig;
}