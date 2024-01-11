import chalk from "chalk";
import path from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import { paths } from "./electron";
import { existsSync } from "fs";
import { IAppConfig } from "../model/Config";
import { IpcMainEvent } from "electron";

export class Config {
    private readonly _configFilePath: string;
    private _config: IAppConfig;

    constructor() {
        this._configFilePath = path.join(paths.config, "config.json");
        this._config = {
            server: "mongodb+srv://<username>:<password>@bestiary.scnanv0.mongodb.net/?retryWrites=true&w=majority",
            username: "Bestiary",
            password: "Bestiary",
            bgColor: "#808080"
        };
        mkdir(paths.config, { recursive: true }).then(() => {
            if (!existsSync(this._configFilePath)) {
                console.log(chalk.blue("Creating app config"));
                this.saveConfig().then(() => this.loadConfig());
            }
            else {
                this.loadConfig();
            }
        }).catch(err => {
            console.log(chalk.white.bgRed("❌ Error loading app config", err));
        });
    }

    public async saveConfig(): Promise<void> {
        if (this._config) {
            await writeFile(this._configFilePath, JSON.stringify(this._config));
        }
    }

    public async loadConfig(): Promise<void> {
        await readFile(this._configFilePath, { encoding: "utf-8" }).then(contents => {
            const config = JSON.parse(contents);
            this.updateConfig(null, config);
        }).catch(err => {
            console.log(chalk.white.bgRed("❌ Error loading app config", err));
        });
    }

    public updateConfig(event: IpcMainEvent | null, config: IAppConfig): void {
        if (this._config) {
            // Server Settings
            if (config.server?.length > 0) { this._config.server = config.server; }
            else { this._config.server = "mongodb+srv://<username>:<password>@bestiary.scnanv0.mongodb.net/?retryWrites=true&w=majority"; }
            if (config.username?.length > 0) { this._config.username = config.username; }
            else { this._config.username = "Bestiary"; }
            if (config.password?.length > 0) { this._config.password = config.password; }
            else { this._config.password = "Bestiary"; }
            // Display Settings
            if (config.bgColor?.length > 0) { this._config.bgColor = config.bgColor; }
            else { this._config.bgColor = "#808080"; }

            event && event.sender.send("config:updated-app-config", this._config);
        }
    }

    get config(): IAppConfig {
        return this._config;
    }
}