import React, { PropsWithChildren, useCallback, useContext, useEffect, useId, useState } from "react";
import { IAppConfig, IAppearanceConfig, IServerInstance, IServerConfig } from "../../model/Config";
import "../styles/options.scss";
import { AppContext } from "../context";

interface IOptionsProps {
    show: boolean;
    onHide: () => void;
}

export const Options: React.FC<IOptionsProps> = (props: IOptionsProps) => {
    const { show, onHide } = props;
    const { config } = useContext(AppContext);

    const [newConfig, setNewConfig] = useState<IAppConfig>({
        serverConfig: { serverList: [] },
        appearance: { bgColor: "#00000" }
    });

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

    useEffect(() => { if (config) { setNewConfig(config); } }, [config]);

    if (!show || !config) { return null; }

    return (
        <div className="options-mask">
            <div className="close">
                <button title="Close" className="close-button" onClick={onHide}>✖</button>
            </div>
            <div className="options">
                <ServerConfigSection {...newConfig.serverConfig} setServerList={setServerList} />
                <AppearanceConfigSection {...newConfig.appearance} setBgColor={() => { }} />
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

    const setUrl = useCallback((url: string, index: number) => {
        const newServerList = [...serverList];
        if (index >= 0 && index < newServerList.length) { newServerList[index]!.url = url; }
        setServerList(newServerList);
    }, [serverList]);

    const setUsername = useCallback((username: string, index: number) => {
        const newServerList = [...serverList];
        if (index >= 0 && index < newServerList.length) { newServerList[index]!.username = username; }
        setServerList(newServerList);
    }, [serverList]);

    const setPassword = useCallback((password: string, index: number) => {
        const newServerList = [...serverList];
        if (index >= 0 && index < newServerList.length) { newServerList[index]!.password = password; }
        setServerList(newServerList);
    }, [serverList]);

    return (
        <>
            <div className="option-section">Server Settings</div>
            {serverList.map((server, index) =>
                <ServerInstance
                    key={server.url}
                    {...server}
                    setUrl={url => setUrl(url, index)}
                    setUsername={username => setUsername(username, index)}
                    setPassword={password => setPassword(password, index)} />
            )}
        </>
    );
};

interface IServerInstanceProps extends IServerInstance {
    setUrl: React.Dispatch<string>,
    setUsername: React.Dispatch<string>,
    setPassword: React.Dispatch<string>,
}

const ServerInstance: React.FC<IServerInstanceProps> = (props: IServerInstanceProps) => {
    const { url, username, password, setUrl, setUsername, setPassword } = props;
    const serverUrlId = useId();
    const usernameId = useId();
    const passwordId = useId();

    return (
        <>
            {/* Server URL */}
            <label htmlFor={serverUrlId}>Server URL:</label>
            <div className="options-server-group">
                <input
                    id={serverUrlId}
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
        </>
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
            <button onClick={() => setHelpVisible(v => !v)}>🛈</button>
            {helpVisible && <div className="options-helptext">{props.children}</div>}
        </>
    );
};