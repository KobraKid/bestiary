import { BrowserWindow, IpcMainInvokeEvent, KeyboardEvent, MenuItem } from "electron";
import path from "path";
import { BuiltInImporter } from "./importers/BuiltInImporters";
import importDqTact from "./importers/dqtact";
import { importRocketSlime } from "./importers/dqheroesrocketslime";

export function onImportClicked(_menuItem: MenuItem, _browserWindow: BrowserWindow, _event: KeyboardEvent): void {
    let win = new BrowserWindow({
        width: 720,
        height: 480,
        center: true,
        title: `Bestiary Importer`,
        darkTheme: true,
        autoHideMenuBar: true,
        fullscreenable: false,
        webPreferences: {
            sandbox: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('importer.html');
    win.webContents.openDevTools({ mode: 'right' });
}

export function importBuiltIn(pkgName: string, event: IpcMainInvokeEvent): void {
    switch (pkgName) {
        case BuiltInImporter.dqtact:
            importDqTact(event);
            break;
        case BuiltInImporter.dqheroesrocketslime:
            importRocketSlime(event);
            break;
    }
}
