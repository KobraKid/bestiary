import React, { FormEvent, useCallback, useEffect, useState } from "react";
import { IPackageMetadata } from "../../model/Package";
import { ICollectionMetadata } from "../../model/Collection";
import { ICollectionConfig, IGroupConfig } from "../../model/Config";
import { Group } from "./entry";
import "../styles/group.scss";

export const GroupSettingsView: React.FC = () => {
    const [pkg, setPkg] = useState<IPackageMetadata>();
    const [collection, setCollection] = useState<ICollectionMetadata>();
    const [config, setConfig] = useState<ICollectionConfig>();

    const onUpdateGroup = useCallback(() => {
        // setConfig(undefined);
    }, []);

    const onCancel = useCallback(() => {
        setConfig(undefined);
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

    if (!config) { return null; }

    return (
        <div className="group-mask" onClick={onCancel}>
            <div className="group-config" onClick={(e) => e.stopPropagation()}>
                <h2>{pkg?.name} - {collection?.name}</h2>
                {config.groups.map(group =>
                    <GroupSettings key={group.id} {...group} onUpdateGroup={onUpdateGroup} />
                )}
            </div>
        </div>
    );
};

interface IGroupSettingsProps extends IGroupConfig {
    onUpdateGroup: () => void
}

export const GroupSettings: React.FC<IGroupSettingsProps> = (props: IGroupSettingsProps) => {
    const { onUpdateGroup } = props;

    const [name, setName] = useState<string>(props.name);
    const [bgColor, setBgColor] = useState<string>(props.backgroundColor);
    const [color, setColor] = useState<string>(props.color);

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        onUpdateGroup();
    };

    return (
        <div>
            <div className="preview">
                <Group name={name} backgroundColor={bgColor} color={color} />
            </div>
            <form onSubmit={handleSubmit} className="group-form">
                <label>Name:&nbsp;
                    <input type="text" value={name} onChange={e => setName(e.target.value)} />
                </label>
                <br />
                <label>Background Color:&nbsp;
                    <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} />
                </label>
                <br />
                <label>Text Color:&nbsp;
                    <input type="color" value={color} onChange={e => setColor(e.target.value)} />
                </label>
                <br />
                <input type="submit" value="Update" />
            </form>
        </div>
    );
};