import React, { useCallback, useEffect, useState } from "react";
import { IPackageMetadata } from "../../model/Package";
import { ICollectionMetadata } from "../../model/Collection";
import { ICollectionConfig, IGroupConfig } from "../../model/Config";
import { Group } from "./entry";
import "../styles/group.scss";

export const GroupSettingsView: React.FC = () => {
    const [pkg, setPkg] = useState<IPackageMetadata>();
    const [collection, setCollection] = useState<ICollectionMetadata>();
    const [config, setConfig] = useState<ICollectionConfig>();

    const onCancel = useCallback(() => {
        setConfig(undefined);
        setCollection(undefined);
    }, []);

    const onUpdateConfig = useCallback((collection: ICollectionMetadata, config: ICollectionConfig) => {
        window.config.updateCollectionConfig(collection, config);
        onCancel();
    }, []);

    const onUpdateGroup = useCallback((id: number, name: string, bgColor: string, color: string) => {
        setConfig(prevConfig => {
            if (prevConfig) {
                const newConfig = structuredClone(prevConfig);
                for (const group of newConfig.groups) {
                    if (group.id === id) {
                        group.name = name;
                        group.backgroundColor = bgColor;
                        group.color = color;
                        break;
                    }
                }
                return newConfig;
            }
            return prevConfig;
        });
    }, []);

    const onAddGroup = useCallback(() => {
        setConfig(prevConfig => {
            if (prevConfig) {
                const newConfig = structuredClone(prevConfig);
                const r = Math.floor(Math.random() * 0xFF);
                const g = Math.floor(Math.random() * 0xFF);
                const b = Math.floor(Math.random() * 0xFF);
                const bg = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
                const fg = ((r + b + g) / 3) < 0x80 ? "#FFFFFF" : "#000000";
                const newGroup: IGroupConfig = {
                    id: newConfig.groups.length,
                    name: `Group ${newConfig.groups.length + 1}`,
                    backgroundColor: bg,
                    color: fg,
                    entries: []
                };
                newConfig.groups.push(newGroup);
                return newConfig;
            }
            return prevConfig;
        });
    }, []);

    const onRemoveGroup = useCallback((id: number) => {
        setConfig(prevConfig => {
            if (prevConfig) {
                const newConfig = structuredClone(prevConfig);
                newConfig.groups = newConfig.groups.filter(group => group.id !== id);
                return newConfig;
            }
            return prevConfig;
        });
    }, []);

    const onMoveGroupUp = useCallback((id: number) => {
        setConfig(prevConfig => {
            if (prevConfig) {
                const newConfig = structuredClone(prevConfig);
                const index = newConfig.groups.findIndex(group => group.id === id);
                if (index > 0 && index < newConfig.groups.length) {
                    const group = newConfig.groups[index];
                    newConfig.groups[index] = newConfig.groups[index - 1]!;
                    newConfig.groups[index - 1] = group!;
                    newConfig.groups[index]!.id++;
                    newConfig.groups[index - 1]!.id--;
                }
                return newConfig;
            }
            return prevConfig;
        });
    }, []);

    const onMoveGroupDown = useCallback((id: number) => {
        setConfig(prevConfig => {
            if (prevConfig) {
                const newConfig = structuredClone(prevConfig);
                const index = newConfig.groups.findIndex(group => group.id === id);
                if (index >= 0 && index < newConfig.groups.length - 1) {
                    const group = newConfig.groups[index];
                    newConfig.groups[index] = newConfig.groups[index + 1]!;
                    newConfig.groups[index + 1] = group!;
                    newConfig.groups[index]!.id--;
                    newConfig.groups[index + 1]!.id++;
                }
                return newConfig;
            }
            return prevConfig;
        });
    }, []);

    const onKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === "Escape") {
            onCancel();
        }
    }, [onCancel]);

    useEffect(() => {
        window.menu.onConfigureCollection((configPkg, configCollection, loadedConfig) => {
            setPkg(configPkg);
            setCollection(configCollection);
            setConfig(loadedConfig);
        });
    });

    useEffect(() => {
        document.addEventListener("keydown", onKeyDown, false);

        return () => { document.removeEventListener("keydown", onKeyDown, false); };
    }, [onKeyDown]);

    if (!config || !collection || !pkg) { return null; }

    return (
        <div className="group-mask" onClick={onCancel}>
            <div className="group-config" onClick={(e) => e.stopPropagation()}>
                <h2>{pkg.name} - {collection.name}</h2>
                <div className="group-grid-container">
                    <div className="group-grid">
                        {config.groups.map(group =>
                            <GroupSettings {...group} key={group.id + group.name}
                                onUpdateGroup={(name, bgColor, color) =>
                                    onUpdateGroup(group.id, name, bgColor, color)}
                                onRemoveGroup={() => onRemoveGroup(group.id)}
                                onMoveGroupUp={() => onMoveGroupUp(group.id)}
                                onMoveGroupDown={() => onMoveGroupDown(group.id)} />
                        )}
                        <div className="group-insert">
                            <button onClick={onAddGroup}>➕ Insert</button>
                        </div>
                    </div>
                </div>
                <div className="group-buttons">
                    <button onClick={() => onUpdateConfig(collection, config)}>✔️ Accept</button>
                    <button onClick={onCancel}>❌ Cancel</button>
                </div>
            </div>
        </div>
    );
};

interface IGroupSettingsProps extends IGroupConfig {
    onUpdateGroup: (name: string, bgColor: string, color: string) => void,
    onRemoveGroup: () => void,
    onMoveGroupUp: () => void,
    onMoveGroupDown: () => void
}

export const GroupSettings: React.FC<IGroupSettingsProps> = (props: IGroupSettingsProps) => {
    const { onUpdateGroup, onRemoveGroup, onMoveGroupUp, onMoveGroupDown } = props;

    const [name, setName] = useState<string>(props.name);
    const [bgColor, setBgColor] = useState<string>(props.backgroundColor);
    const [color, setColor] = useState<string>(props.color);

    const updateGroup = (name: string, bgColor: string, color: string) => {
        onUpdateGroup(name, bgColor, color);
    };

    return (
        <div className="group-settings">
            <div className="preview">
                <Group name={name} backgroundColor={bgColor} color={color} />
            </div>
            <div className="toolbar">
                <button onClick={onMoveGroupUp}>🔼</button>
                <button onClick={onMoveGroupDown}>🔽</button>
                <button onClick={onRemoveGroup}>❌</button>
            </div>
            <label>Name:&nbsp;</label>
            <input type="text" name="name" value={name}
                onBlur={() => updateGroup(name, bgColor, color)}
                onChange={e => setName(e.target.value)} />
            <label>Background Color:&nbsp;</label>
            <input type="color" name="bgColor" value={bgColor} onChange={e => {
                setBgColor(e.target.value);
                updateGroup(name, e.target.value, color);
            }} />
            <label>Text Color:&nbsp;</label>
            <input type="color" name="color" value={color} onChange={e => {
                setColor(e.target.value);
                updateGroup(name, bgColor, e.target.value);
            }} />
        </div>
    );
};