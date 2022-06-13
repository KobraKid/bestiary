import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { readFileSync } from 'fs';
import { mkdir, readdir } from 'fs/promises';
import envPaths from 'env-paths';
import IPackage, { IPackageMetadata } from './interfaces/IPackage';

/**
 * Setup and logging
 */
const paths = envPaths("Bestiary", { suffix: "" });
console.log(`🐬 Bestiary ${process.env.npm_package_version}\n⚡ Electron: ${process.versions.electron}\n📦 Package directory: ${paths.data}\n`);

/**
 * Set up the main window
 */
function createWindow() {
  let win = new BrowserWindow({
    width: 1280,
    height: 720,
    title: `Bestiary ${process.env.npm_package_version}`,
    darkTheme: true,
    autoHideMenuBar: true,
    // frame: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  win.loadFile('index.html');
  win.webContents.openDevTools({ mode: 'detach' });
}

/**
 * Load a single package
 */
function parsePackage(pkgPath: string, isLoadAll: boolean = false): IPackage | null {
  let pkg = null;
  try {
    const data = readFileSync(pkgPath + '\\package.json', { encoding: "utf-8" });
    const parsedData = JSON.parse(data);
    if (parsedData?.metadata?.name) {
      if (isLoadAll) { console.log("✔ Loaded package \"" + JSON.parse(data).metadata.name + "\""); }
      pkg = parsedData;
      pkg.metadata.path = pkgPath;
    }
    else {
      if (isLoadAll) { console.log("❌ Error loading package at \"" + pkgPath + "\""); }
    }
  } catch (err: any) {
    if (isLoadAll) { console.log("❌ Error loading package at \"" + pkgPath + "\"", err); }
  }
  return pkg;
}

/**
 * Create the main window
 */
app.whenReady().then(async () => {
  createWindow();
});

/**
 * Load all packages
 */
ipcMain.handle('load-pkgs', async (): Promise<IPackageMetadata[]> => {
  // Ensure Data directory exists
  await mkdir(paths.data, { recursive: true });

  // Get all packages in Data directory
  const pkgs: IPackageMetadata[] = [];
  try {
    const files = await readdir(paths.data, { withFileTypes: true });
    for (const file of files) {
      if (file.isDirectory()) {
        const pkg = parsePackage(paths.data + '\\' + file.name, true);
        if (pkg !== null) {
          pkgs.push(pkg.metadata);
        }
      }
    }
  } catch (err: any) {
    console.log(err);
  }

  return pkgs;
});

ipcMain.handle('load-pkg', async (_event: any, pkgPath: string): Promise<IPackage | null> => parsePackage(pkgPath));
