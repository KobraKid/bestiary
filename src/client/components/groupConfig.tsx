import React, { useCallback, useEffect, useState } from "react";
import { IPackageMetadata } from "../../model/Package";
import { IGroupMetadata } from "../../model/Group";
import { ICollection, CollectionType, GroupForConfig, CollectionForConfig } from "../../model/Config";
import { Collection } from "./entry";
import "../styles/groupConfig.scss";

export const GroupConfigView: React.FC = () => {
    const [pkg, setPkg] = useState<IPackageMetadata>();
    const [group, setGroup] = useState<IGroupMetadata>();
    const [config, setConfig] = useState<GroupForConfig>();

    const onCancel = useCallback(() => {
        setConfig(undefined);
        setGroup(undefined);
    }, []);

    const onUpdateConfig = useCallback((pkg: IPackageMetadata, group: IGroupMetadata, config: GroupForConfig) => {
        window.config.updateGroupConfig(pkg, group, config);
        onCancel();
    }, []);

    const onUpdateCollection = useCallback((id: number, newCollection: Partial<CollectionForConfig>) => {
        setConfig(prevConfig => {
            if (prevConfig) {
                const newConfig = structuredClone(prevConfig);
                for (const collection of newConfig.collections) {
                    if (collection.id === id) {
                        collection.name = newCollection.name ?? collection.name;
                        collection.backgroundColor = newCollection.backgroundColor ?? collection.backgroundColor;
                        collection.color = newCollection.color ?? collection.color;
                        collection.min = newCollection.min ?? collection.min;
                        if (collection.min != null && collection.min < 0) { collection.min = 0; }
                        collection.max = newCollection.max ?? collection.max;
                        if (collection.min != null && collection.max != null && collection.min > collection.max) { collection.max = collection.min + 1; }
                        if (collection.type === "boolean") {
                            delete collection.min;
                            delete collection.max;
                        }
                        else {
                            collection.min = newCollection.min ?? collection.min ?? 0;
                            collection.max = newCollection.max ?? collection.max ?? 1;
                        }
                        if (newCollection.type && newCollection.type !== collection.type) {
                            collection.type = newCollection.type;
                            if (collection.type === "boolean") {
                                collection.buckets = { "collected": [] };
                            }
                            else {
                                collection.buckets = {};
                                for (let i = collection.min!; i <= collection.max!; i++) {
                                    collection.buckets["" + i] = [];
                                }
                            }
                        }
                        if ((newCollection.min != null) || (newCollection.max != null)) {
                            for (let i = collection.min!; i <= collection.max!; i++) {
                                collection.buckets["" + i] = collection.buckets["" + i] || [];
                            }
                            for (const bucket of Object.keys(collection.buckets)) {
                                if ((parseInt(bucket) < (collection.min ?? 0)) || (parseInt(bucket) > (collection.max ?? 1))) {
                                    delete collection.buckets[bucket];
                                }
                            }
                        }
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
                const newCollection: CollectionForConfig = {
                    id: newConfig.collections.length,
                    name: `Collection ${newConfig.collections.length + 1}`,
                    backgroundColor: bg,
                    color: fg,
                    type: "boolean",
                    buckets: { "collected": [] }
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
                                onUpdateCollection={(newCollection: Partial<ICollection>) =>
                                    onUpdateCollection(collection.id, newCollection)}
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

interface ICollectionSettingsProps extends CollectionForConfig {
    onUpdateCollection: (newCollection: Partial<ICollection>) => void,
    onRemoveCollection: () => void,
    onMoveCollectionUp: () => void,
    onMoveCollectionDown: () => void
}

export const CollectionSettings: React.FC<ICollectionSettingsProps> = (props: ICollectionSettingsProps) => {
    const { onUpdateCollection, onRemoveCollection, onMoveCollectionUp, onMoveCollectionDown } = props;

    const [name, setName] = useState<string>(props.name);
    const [type, setType] = useState<CollectionType>(props.type);
    const [min, setMin] = useState<number>(props.min ?? 0);
    const [max, setMax] = useState<number>(props.max ?? 1);
    const [backgroundColor, setBgColor] = useState<string>(props.backgroundColor);
    const [color, setColor] = useState<string>(props.color);

    const updateCollection = (newCollection: Partial<ICollection>) => {
        onUpdateCollection(newCollection);
    };

    return (
        <div className="collection-settings">
            <div className="preview">
                <Collection name={name} type={type} min={min} max={max} backgroundColor={backgroundColor} color={color} />
            </div>
            <div className="toolbar">
                <button title="Move up" onClick={onMoveCollectionUp}>🔼</button>
                <button title="Move down" onClick={onMoveCollectionDown}>🔽</button>
                <button title="Remove" onClick={onRemoveCollection}>❌</button>
            </div>
            <label>Name:&nbsp;</label>
            <input type="text" name="name" value={name}
                onBlur={() => updateCollection({ name })}
                onChange={e => setName(e.target.value)} />
            <label>Type:&nbsp;</label>
            <select name="type" value={type} onChange={e => {
                setType(e.target.value as CollectionType);
                updateCollection({ type: e.target.value as CollectionType })
            }}>
                <option value="boolean">Boolean</option>
                <option value="number">Numeric</option>
            </select>
            {(
                (type === "boolean" && (props.buckets["collected"]?.length ?? 0) > 0) ||
                (type === "number" && Object.keys(props.buckets).findIndex(b => (props.buckets[b]?.length ?? 0) > 0) >= 0)
            ) &&
                <div className="warning">
                    Warning: changing the type of this collection will remove all collected entries
                </div>
            }
            {type === "number" &&
                <>
                    <label>Min value:&nbsp;</label>
                    <input type="number" name="min" value={min} min={0} max={max} onChange={e => {
                        const value = parseInt(e.target.value);
                        setMin(value);
                        updateCollection({ min: value });
                    }} />
                    <label>Max value:&nbsp;</label>
                    <input type="number" name="max" value={max} min={min} onChange={e => {
                        const value = parseInt(e.target.value);
                        setMax(value);
                        updateCollection({ max: value });
                    }} />
                </>
            }
            <label>Background Color:&nbsp;</label>
            <input type="color" name="bgColor" value={backgroundColor} onChange={e => {
                setBgColor(e.target.value);
                updateCollection({ backgroundColor: e.target.value });
            }} />
            <label>Text Color:&nbsp;</label>
            <input type="color" name="color" value={color} onChange={e => {
                setColor(e.target.value);
                updateCollection({ color: e.target.value });
            }} />
        </div>
    );
};