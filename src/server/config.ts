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
        mkdir(paths.config, { recursive: true }).then(() => {
            if (!existsSync(this._configFilePath)) {
                console.log(chalk.blue("Creating app config"));
                this._config = {
                    server: "mongodb+srv://<username>:<password>@bestiary.scnanv0.mongodb.net/?retryWrites=true&w=majority",
                    username: "Bestiary",
                    password: "Bestiary",
                    bgColor: "#808080"
                };
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
        await writeFile(this._configFilePath, JSON.stringify(this._config));
    }

    public async loadConfig(): Promise<void> {
        await readFile(this._configFilePath, { encoding: "utf-8" }).then(contents => {
            this._config = JSON.parse(contents);
        }).catch(err => {
            console.log(chalk.white.bgRed("❌ Error loading app config", err));
        });
    }

    public updateConfig(event: IpcMainEvent, config: IAppConfig): void {
        this._config = config;
        event.sender.send("config:updated-app-config", this._config);
    }

    get config(): IAppConfig {
        return this._config;
    }
}