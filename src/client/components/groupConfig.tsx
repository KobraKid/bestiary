import React, { useCallback, useEffect, useState } from "react";
import { IPackageMetadata } from "../../model/Package";
import { IGroupMetadata } from "../../model/Group";
import { IGroupConfig, ICollection } from "../../model/Config";
import { Collection } from "./entry";
import "../styles/groupConfig.scss";

export const GroupConfigView: React.FC = () => {
    const [pkg, setPkg] = useState<IPackageMetadata>();
    const [group, setGroup] = useState<IGroupMetadata>();
    const [config, setConfig] = useState<IGroupConfig>();

    const onCancel = useCallback(() => {
        setConfig(undefined);
        setGroup(undefined);
    }, []);

    const onUpdateConfig = useCallback((pkg: IPackageMetadata, group: IGroupMetadata, config: IGroupConfig) => {
        window.config.updateGroupConfig(pkg, group, config);
        onCancel();
    }, []);

    const onUpdateCollection = useCallback((id: number, name: string, bgColor: string, color: string) => {
        setConfig(prevConfig => {
            if (prevConfig) {
                const newConfig = structuredClone(prevConfig);
                for (const collection of newConfig.collections) {
                    if (collection.id === id) {
                        collection.name = name;
                        collection.backgroundColor = bgColor;
                        collection.color = color;
                        break;
                    }
                }
                return newConfig;
            }
            return prevConfig;
        });
    }, []);

    const onAddCollection = useCallback(() => {
        setConfig(prevConfig => {
            if (prevConfig) {
                const newConfig = structuredClone(prevConfig);
                const r = Math.floor(Math.random() * 0xFF);
                const g = Math.floor(Math.random() * 0xFF);
                const b = Math.floor(Math.random() * 0xFF);
                const bg = `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
                const fg = ((r + b + g) / 3) < 0x80 ? "#FFFFFF" : "#000000";
                const newCollection: ICollection = {
                    id: newConfig.collections.length,
                    name: `Collection ${newConfig.collections.length + 1}`,
                    backgroundColor: bg,
                    color: fg,
                    entries: [],
                    max: 0
                };
                newConfig.collections.push(newCollection);
                return newConfig;
            }
            return prevConfig;
        });
    }, []);

    const onRemoveCollection = useCallback((id: number) => {
        setConfig(prevConfig => {
            if (prevConfig) {
                const newConfig = structuredClone(prevConfig);
                newConfig.collections = newConfig.collections.filter(collection => collection.id !== id);
                return newConfig;
            }
            return prevConfig;
        });
    }, []);

    const onMoveCollectionUp = useCallback((id: number) => {
        setConfig(prevConfig => {
            if (prevConfig) {
                const newConfig = structuredClone(prevConfig);
                const index = newConfig.collections.findIndex(collection => collection.id === id);
                if (index > 0 && index < newConfig.collections.length) {
                    const group = newConfig.collections[index];
                    newConfig.collections[index] = newConfig.collections[index - 1]!;
                    newConfig.collections[index - 1] = group!;
                    newConfig.collections[index]!.id++;
                    newConfig.collections[index - 1]!.id--;
                }
                return newConfig;
            }
            return prevConfig;
        });
    }, []);

    const onMoveCollectionDown = useCallback((id: number) => {
        setConfig(prevConfig => {
            if (prevConfig) {
                const newConfig = structuredClone(prevConfig);
                const index = newConfig.collections.findIndex(collection => collection.id === id);
                if (index >= 0 && index < newConfig.collections.length - 1) {
                    const group = newConfig.collections[index];
                    newConfig.collections[index] = newConfig.collections[index + 1]!;
                    newConfig.collections[index + 1] = group!;
                    newConfig.collections[index]!.id--;
                    newConfig.collections[index + 1]!.id++;
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
        window.menu.onConfigureGroup((configPkg, configCollection, loadedConfig) => {
            setPkg(configPkg);
            setGroup(configCollection);
            setConfig(loadedConfig);
        });
    });

    useEffect(() => {
        document.addEventListener("keydown", onKeyDown, false);

        return () => { document.removeEventListener("keydown", onKeyDown, false); };
    }, [onKeyDown]);

    if (!config || !group || !pkg) { return null; }

    return (
        <div className="group-config-mask" onClick={onCancel}>
            <div className="group-config" onClick={(e) => e.stopPropagation()}>
                <h2>{pkg.name} - {group.name}</h2>
                <div className="collection-grid-container">
                    <div className="collection-grid">
                        {config.collections.map(collection =>
                            <CollectionSettings {...collection} key={collection.id + collection.name}
                                onUpdateCollection={(name, bgColor, color) =>
                                    onUpdateCollection(collection.id, name, bgColor, color)}
                                onRemoveCollection={() => onRemoveCollection(collection.id)}
                                onMoveCollectionUp={() => onMoveCollectionUp(collection.id)}
                                onMoveCollectionDown={() => onMoveCollectionDown(collection.id)} />
                        )}
                        <div className="collection-insert">
                            <button onClick={onAddCollection}>➕ Insert</button>
                        </div>
                    </div>
                </div>
                <div className="collection-buttons">
                    <button onClick={() => onUpdateConfig(pkg, group, config)}>✔️ Accept</button>
                    <button onClick={onCancel}>❌ Cancel</button>
                </div>
            </div>
        </div>
    );
};

interface ICollectionSettingsProps extends ICollection {
    onUpdateCollection: (name: string, bgColor: string, color: string) => void,
    onRemoveCollection: () => void,
    onMoveCollectionUp: () => void,
    onMoveCollectionDown: () => void
}

export const CollectionSettings: React.FC<ICollectionSettingsProps> = (props: ICollectionSettingsProps) => {
    const { onUpdateCollection, onRemoveCollection, onMoveCollectionUp, onMoveCollectionDown } = props;

    const [name, setName] = useState<string>(props.name);
    const [bgColor, setBgColor] = useState<string>(props.backgroundColor);
    const [color, setColor] = useState<string>(props.color);

    const updateCollection = (name: string, bgColor: string, color: string) => {
        onUpdateCollection(name, bgColor, color);
    };

    return (
        <div className="collection-settings">
            <div className="preview">
                <Collection name={name} backgroundColor={bgColor} color={color} />
            </div>
            <div className="toolbar">
                <button onClick={onMoveCollectionUp}>🔼</button>
                <button onClick={onMoveCollectionDown}>🔽</button>
                <button onClick={onRemoveCollection}>❌</button>
            </div>
            <label>Name:&nbsp;</label>
            <input type="text" name="name" value={name}
                onBlur={() => updateCollection(name, bgColor, color)}
                onChange={e => setName(e.target.value)} />
            <label>Background Color:&nbsp;</label>
            <input type="color" name="bgColor" value={bgColor} onChange={e => {
                setBgColor(e.target.value);
                updateCollection(name, e.target.value, color);
            }} />
            <label>Text Color:&nbsp;</label>
            <input type="color" name="color" value={color} onChange={e => {
                setColor(e.target.value);
                updateCollection(name, bgColor, e.target.value);
            }} />
        </div>
    );
};