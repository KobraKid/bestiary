import React, { PropsWithChildren, useCallback, useContext, useEffect, useId, useState } from "react";
import { IAppConfig, IAppearanceConfig, IServerInstance, IServerConfig } from "../../model/Config";
import "../styles/options.scss";
import { AppContext } from "../context";
import { IPackageMetadata } from "../../model/Package";

interface IOptionsProps {
    show: boolean;
    onHide: () => void;
}

const defaultConfig = {
    serverConfig: { serverList: [] },
    appearance: { bgColor: "#808080" }
};

export const Options: React.FC<IOptionsProps> = (props: IOptionsProps) => {
    const { show, onHide } = props;
    const { config } = useContext(AppContext);

    const [newConfig, setNewConfig] = useState<IAppConfig>(defaultConfig);

    const onSave = useCallback(() => {
        window.config.saveAppConfig(newConfig);
        onHide();
    }, [newConfig, onHide]);

    const setServerList = useCallback((serverList: IServerInstance[]) => {
        setNewConfig(prevConfig => ({
            ...prevConfig,
            serverConfig: {
                ...prevConfig.serverConfig,
                serverList: serverList
            }
        }));
    }, []);

    const setBgColor = useCallback((color: string) => {
        setNewConfig(prevConfig => ({
            ...prevConfig,
            appearance: {
                ...prevConfig.appearance,
                bgColor: color
            }
        }));
    }, []);

    useEffect(() => { if (config) { setNewConfig(config); } }, [config, show]);

    if (!show || !config) { return null; }

    return (
        <div className="options-mask">
            <div className="close">
                <button title="Close" className="close-button" onClick={onHide}>✖</button>
            </div>
            <div className="options">
                <ServerConfigSection {...newConfig.serverConfig} setServerList={setServerList} />
                <AppearanceConfigSection {...newConfig.appearance} setBgColor={setBgColor} />
            </div>
            <div className="save">
                <button className="save-button" onClick={() => onSave()}>✔ Save</button>
            </div>
        </div>
    );
};

interface IServerConfigProps extends IServerConfig {
    setServerList: React.Dispatch<IServerInstance[]>
}

const ServerConfigSection: React.FC<IServerConfigProps> = (props: IServerConfigProps) => {
    const { serverList, setServerList } = props;

    const setName = useCallback((name: string, index: number) => {
        const newServerList = [...serverList];
        if (index >= 0 && index < newServerList.length) {
            newServerList[index]!.name = name;
            setServerList(newServerList);
        }
    }, [serverList]);

    const setUrl = useCallback((url: string, index: number) => {
        const newServerList = [...serverList];
        if (index >= 0 && index < newServerList.length) {
            newServerList[index]!.url = url;
            newServerList[index]!.connectionKey = `${index}|${url}`;
            setServerList(newServerList);
        }
    }, [serverList]);

    const setUsername = useCallback((username: string, index: number) => {
        const newServerList = [...serverList];
        if (index >= 0 && index < newServerList.length) {
            newServerList[index]!.username = username;
            setServerList(newServerList);
        }
    }, [serverList]);

    const setPassword = useCallback((password: string, index: number) => {
        const newServerList = [...serverList];
        if (index >= 0 && index < newServerList.length) {
            newServerList[index]!.password = password;
            setServerList(newServerList);
        }
    }, [serverList]);

    const setVisiblePackages = useCallback((visiblePackages: string[], index: number) => {
        const newServerList = [...serverList];
        if (index >= 0 && index < newServerList.length) {
            newServerList[index]!.visiblePackages = visiblePackages.slice();
            setServerList(newServerList);
        }
    }, [serverList]);

    const addServer = useCallback(() => {
        setServerList([...serverList].concat([{
            connectionKey: "" + serverList.length,
            name: "",
            url: "",
            username: "",
            password: "",
            visiblePackages: []
        }]));
    }, [serverList]);

    const removeServer = useCallback((index: number) => {
        const newServerList = [...serverList];
        newServerList.splice(index, 1);
        setServerList(newServerList);
    }, [serverList]);

    return (
        <>
            <div className="option-section">Server Settings</div>
            {serverList.map((server, index) =>
                <React.Fragment key={server.connectionKey}>
                    {index > 0 &&
                        <button
                            className="options-remove-server"
                            onClick={() => removeServer(index)}>➖</button>
                    }
                    <ServerInstance
                        {...server}
                        setName={name => setName(name, index)}
                        setUrl={url => setUrl(url, index)}
                        setUsername={username => setUsername(username, index)}
                        setPassword={password => setPassword(password, index)}
                        setVisiblePackages={visiblePackages => setVisiblePackages(visiblePackages, index)} />
                </React.Fragment>
            )}
            <button className="options-add-server" onClick={addServer}>➕</button>
        </>
    );
};

interface IServerInstanceProps extends IServerInstance {
    setName: React.Dispatch<string>,
    setUrl: React.Dispatch<string>,
    setUsername: React.Dispatch<string>,
    setPassword: React.Dispatch<string>,
    setVisiblePackages: React.Dispatch<string[]>
}

const ServerInstance: React.FC<IServerInstanceProps> = (props: IServerInstanceProps) => {
    const {
        name, url, username, password, setName, visiblePackages,
        setUrl, setUsername, setPassword, setVisiblePackages
    } = props;
    const nameId = useId();
    const urlId = useId();
    const usernameId = useId();
    const passwordId = useId();

    const [pkgList, setPkgList] = useState<IPackageMetadata[]>([]);

    const loadPackages = useCallback((server: IServerInstance) => {
        window.pkg.loadPackagesForServer({
            connectionKey: server.connectionKey,
            name: server.name,
            url: server.url,
            username: server.username,
            password: server.password,
            visiblePackages: []
        }).then(pkgList => {
            setPkgList(pkgList);
        });
    }, []);

    const togglePkgVisibility = useCallback((ns: string) => {
        const newVisiblePackages = visiblePackages.slice();
        if (newVisiblePackages.includes(ns)) {
            newVisiblePackages.splice(newVisiblePackages.indexOf(ns), 1);
            setVisiblePackages(newVisiblePackages);
        }
        else {
            setVisiblePackages(newVisiblePackages.concat(ns));
        }
    }, [visiblePackages, setVisiblePackages]);

    return (
        <div className="options-server-instance">
            {/* Server Name */}
            <label>Server Name:</label>
            <input id={nameId} value={name} onChange={e => setName(e.target.value)} />
            <HelpSection>Enter a name for this server. The name can be anything and is only used to help you identify which server is currently connected.</HelpSection>
            {/* Server URL */}
            <label htmlFor={urlId}>Server URL:</label>
            <div className="options-server-group">
                <input
                    id={urlId}
                    placeholder="mongodb://127.0.0.1:27017/bestiary"
                    value={url}
                    onChange={e => setUrl(e.target.value)} />
                <button onClick={() =>
                    setUrl("mongodb://127.0.0.1:27017/bestiary")}>
                    Local
                </button>
                <button onClick={() =>
                    setUrl("mongodb+srv://<username>:<password>@bestiary.scnanv0.mongodb.net/?retryWrites=true&w=majority")}>
                    Default
                </button>
            </div>
            <HelpSection>
                Enter the server URL to connect to.
                Use <span style={{ fontFamily: "monospace" }}>&lt;username&gt;</span> and <span style={{ fontFamily: "monospace" }}>&lt;password&gt;</span> as placeholders for the username and password to use when connecting.
                Click the local and default buttons to populate this field with standard URLs.
            </HelpSection>
            {/* Server Username */}
            <label htmlFor={usernameId}>Username:</label>
            <input
                id={usernameId}
                value={username}
                onChange={e => setUsername(e.target.value)} />
            <HelpSection>Enter the username to use when connecting to the server.</HelpSection>
            {/* Server Password */}
            <label htmlFor={passwordId}>Password:</label>
            <input
                id={passwordId}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)} />
            <HelpSection>Enter the password to use when connecting to the server.</HelpSection>
            <div className="options-server-pkgs">
                <div>
                    <span>Click on a package to toggle its visibility. Note: if all packages are set to hidden, they will instead all be shown.</span>
                    <br/>
                    <button className="options-server-load-pkgs" onClick={() => loadPackages(props)}>Load Packages</button>
                </div>
                <div className="options-server-pkg-list">
                    {pkgList.map(pkg => {
                        const included = visiblePackages.includes(pkg.ns);
                        return (<div key={pkg.ns} onClick={() => togglePkgVisibility(pkg.ns)}>
                            <img
                                className={`options-server-pkg-icon${included ? "" : " options-server-pkg-hidden"}`}
                                src={pkg.icon} />
                            <div className="options-server-pkg-name">{included ? "" : "(Hidden) "}{pkg.name}</div>
                        </div>);
                    })}
                </div>
            </div>
        </div>
    );
};

interface IAppearanceConfigProps extends IAppearanceConfig {
    setBgColor: React.Dispatch<string>
}

const AppearanceConfigSection: React.FC<IAppearanceConfigProps> = (props: IAppearanceConfigProps) => {
    const { bgColor, setBgColor } = props;

    const bgColorId = useId();

    return (
        <>
            <div className="option-section">Display Settings</div>
            {/* Background Color */}
            <label htmlFor={bgColorId}>Background color:</label>
            <input
                id={bgColorId}
                type="color"
                value={bgColor}
                onChange={e => setBgColor(e.target.value)} />
            <HelpSection>This color will be used as the background color across the application.</HelpSection>
        </>
    );
};

const HelpSection: React.FC<PropsWithChildren> = (props: PropsWithChildren) => {
    const [helpVisible, setHelpVisible] = useState<boolean>(false);
    return (
        <>
            <button className="options-help-toggle" onClick={() => setHelpVisible(v => !v)}>🛈</button>
            {helpVisible && <div className="options-helptext">{props.children}</div>}
        </>
    );
};