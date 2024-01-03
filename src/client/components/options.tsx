import React, { useId, useState } from "react";
import "../styles/options.scss";

interface IOptionsProps {
    show: boolean;
    onHide: () => void;
}

export const Options: React.FC<IOptionsProps> = (props: IOptionsProps) => {
    const { show, onHide } = props;

    if (!show) {
        return null;
    }

    const serverUrlId = useId();
    const [serverUrl, setServerUrl] = useState<string>("mongodb://127.0.0.1:27017/bestiary");
    const [serverUrlHelpVisible, setServerUrlHelpVisible] = useState<boolean>(false);
    const usernameId = useId();
    const [username, setUsername] = useState<string>("");
    const [usernameHelpVisible, setUsernameHelpVisible] = useState<boolean>(false);
    const passwordId = useId();
    const [password, setPassword] = useState<string>("");
    const [passwordHelpVisible, setPasswordHelpVisible] = useState<boolean>(false);

    const bgColorId = useId();
    const [bgColor, setBgColor] = useState<string>("#808080");
    const [bgColorHelpVisible, setBgColorHelpVisible] = useState<boolean>(false);

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
                        value={serverUrl}
                        onChange={e => setServerUrl(e.target.value)} />
                    <button onClick={() =>
                        setServerUrl("mongodb://127.0.0.1:27017/bestiary")}>
                        Local
                    </button>
                    <button onClick={() =>
                        setServerUrl("mongodb+srv://<username>:<password>@bestiary.scnanv0.mongodb.net/?retryWrites=true&w=majority")}>
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
                <input id={usernameId} value={username} onChange={e => setUsername(e.target.value)} />
                <button onClick={() => setUsernameHelpVisible(v => !v)}>🛈</button>
                {usernameHelpVisible &&
                    <div className="options-helptext">
                        Enter the username to use when connecting to the server.
                    </div>
                }
                {/* Server Password */}
                <label htmlFor={passwordId}>Password:</label>
                <input id={passwordId} type="password" value={password} onChange={e => setPassword(e.target.value)} />
                <button onClick={() => setPasswordHelpVisible(v => !v)}>🛈</button>
                {passwordHelpVisible &&
                    <div className="options-helptext">
                        Enter the password to use when connecting to the server.
                    </div>
                }

                <div className="option-section">Display Settings</div>
                {/* Background Color */}
                <label htmlFor={bgColorId}>Background color:</label>
                <input id={bgColorId} type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} />
                <button onClick={() => setBgColorHelpVisible(v => !v)}>🛈</button>
                {bgColorHelpVisible &&
                    <div className="options-helptext">
                        This color will be used as the background color across the application.
                    </div>
                }
            </div>
            <div className="save">
                <button className="save-button">✔ Save</button>
            </div>
        </div>
    );
};