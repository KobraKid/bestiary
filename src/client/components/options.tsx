import React, { useCallback, useContext, useEffect, useId, useReducer, useState } from "react";
import { IAppConfig } from "../../model/Config";
import "../styles/options.scss";
import { AppContext } from "../context";

interface IOptionsProps {
    show: boolean;
    onHide: () => void;
}

enum UpdateConfigActionType {
    SERVER,
    USERNAME,
    PASSWORD,
    BGCOLOR
}

interface IUpdateConfigAction {
    type: UpdateConfigActionType,
    value: string,
}

export const Options: React.FC<IOptionsProps> = (props: IOptionsProps) => {
    const { show, onHide } = props;
    const { config } = useContext(AppContext);

    const configReducer = useCallback((state: IAppConfig, action: IUpdateConfigAction) => {
        switch (action.type) {
            case UpdateConfigActionType.SERVER:
                return { ...state, server: action.value };
            case UpdateConfigActionType.USERNAME:
                return { ...state, username: action.value };
            case UpdateConfigActionType.PASSWORD:
                return { ...state, password: action.value };
            case UpdateConfigActionType.BGCOLOR:
                return { ...state, bgColor: action.value };
        }
    }, []);
    const [newConfig, newConfigDispatch] = useReducer<(state: IAppConfig, action: IUpdateConfigAction) => IAppConfig>(configReducer, {
        server: "", username: "", password: "", bgColor: ""
    });

    const serverUrlId = useId();
    const [serverUrlHelpVisible, setServerUrlHelpVisible] = useState<boolean>(false);
    const usernameId = useId();
    const [usernameHelpVisible, setUsernameHelpVisible] = useState<boolean>(false);
    const passwordId = useId();
    const [passwordHelpVisible, setPasswordHelpVisible] = useState<boolean>(false);

    const bgColorId = useId();
    const [bgColorHelpVisible, setBgColorHelpVisible] = useState<boolean>(false);

    const onSave = useCallback((newConfig: IAppConfig) => {
        window.config.saveAppConfig(newConfig);
        onHide();
    }, []);

    useEffect(() => {
        if (config) {
            newConfigDispatch({ type: UpdateConfigActionType.SERVER, value: config.server });
            newConfigDispatch({ type: UpdateConfigActionType.USERNAME, value: config.username });
            newConfigDispatch({ type: UpdateConfigActionType.PASSWORD, value: config.password });
            newConfigDispatch({ type: UpdateConfigActionType.BGCOLOR, value: config.bgColor });
        }
    }, [config]);

    if (!show) {
        return null;
    }

    return (
        <div className="options-mask">
            <div className="close">
                <button title="Close" className="close-button" onClick={onHide}>✖</button>
            </div>
            <div className="options">
                <div className="option-section">Server Settings</div>
                {/* Server URL */}
                <label htmlFor={serverUrlId}>Server URL:</label>
                <div className="options-server-group">
                    <input
                        id={serverUrlId}
                        placeholder="mongodb://127.0.0.1:27017/bestiary"
                        value={newConfig.server}
                        onChange={e => newConfigDispatch({ type: UpdateConfigActionType.SERVER, value: e.target.value })} />
                    <button onClick={() =>
                        newConfigDispatch({ type: UpdateConfigActionType.SERVER, value: "mongodb://127.0.0.1:27017/bestiary" })}>
                        Local
                    </button>
                    <button onClick={() =>
                        newConfigDispatch({ type: UpdateConfigActionType.SERVER, value: "mongodb+srv://<username>:<password>@bestiary.scnanv0.mongodb.net/?retryWrites=true&w=majority" })}>
                        Default
                    </button>
                </div>
                <button onClick={() => setServerUrlHelpVisible(v => !v)}>🛈</button>
                {serverUrlHelpVisible &&
                    <div className="options-helptext">
                        Enter the server URL to connect to.
                        Use <span style={{ fontFamily: "monospace" }}>&lt;username&gt;</span> and <span style={{ fontFamily: "monospace" }}>&lt;password&gt;</span> as placeholders for the username and password to use when connecting.
                        Click the local and default buttons to populate this field with standard URLs.
                    </div>
                }
                {/* Server Username */}
                <label htmlFor={usernameId}>Username:</label>
                <input
                    id={usernameId}
                    value={newConfig.username}
                    onChange={e => newConfigDispatch({ type: UpdateConfigActionType.USERNAME, value: e.target.value })} />
                <button onClick={() => setUsernameHelpVisible(v => !v)}>🛈</button>
                {usernameHelpVisible &&
                    <div className="options-helptext">
                        Enter the username to use when connecting to the server.
                    </div>
                }
                {/* Server Password */}
                <label htmlFor={passwordId}>Password:</label>
                <input
                    id={passwordId}
                    type="password"
                    value={newConfig.password}
                    onChange={e => newConfigDispatch({ type: UpdateConfigActionType.PASSWORD, value: e.target.value })} />
                <button onClick={() => setPasswordHelpVisible(v => !v)}>🛈</button>
                {passwordHelpVisible &&
                    <div className="options-helptext">
                        Enter the password to use when connecting to the server.
                    </div>
                }

                <div className="option-section">Display Settings</div>
                {/* Background Color */}
                <label htmlFor={bgColorId}>Background color:</label>
                <input
                    id={bgColorId}
                    type="color"
                    value={newConfig.bgColor}
                    onChange={e => newConfigDispatch({ type: UpdateConfigActionType.BGCOLOR, value: e.target.value })} />
                <button onClick={() => setBgColorHelpVisible(v => !v)}>🛈</button>
                {bgColorHelpVisible &&
                    <div className="options-helptext">
                        This color will be used as the background color across the application.
                    </div>
                }
            </div>
            <div className="save">
                <button className="save-button" onClick={() => onSave(newConfig)}>✔ Save</button>
            </div>
        </div>
    );
};