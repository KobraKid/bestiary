import React, { useCallback, useState } from "react";
import { convertHtmlToReact } from "@hedgedoc/html-to-react";
import { IEntryMetadata } from "../../model/Entry";
import { IGroupConfig } from "../../model/Config";
import { ICollectionMetadata } from "../../model/Collection";
import "../styles/details.scss";

export interface IEntryProps {
    /**
     * The entry to display
     */
    entry: IEntryMetadata,
    /**
     * The collection this entry is part of
     */
    collection?: ICollectionMetadata,
    /**
     * Callback for when this entry is clicked
     */
    onClick?: () => void
}

export const Entry: React.FC<IEntryProps> = (props: IEntryProps) => {
    const { entry, collection, onClick } = props;

    return (
        <div className={collection ? "preview" : "details"}>
            {collection &&
                <div className="group-tabs">
                    {collection.config?.groups.map(group =>
                        <Group key={group.id} {...group} entry={entry} collection={collection} />
                    )}
                </div>
            }
            <div onClick={onClick}>
                {convertHtmlToReact(entry.layout)}
            </div>
            {entry.style && convertHtmlToReact(entry.style)}
        </div>
    );
};

export const Group: React.FC<Partial<IGroupConfig & IEntryProps>> = (props: Partial<IGroupConfig & IEntryProps>) => {
    const { id, name, backgroundColor, color, entries, entry, collection } = props;

    const [checked, setChecked] = useState<boolean>(entries?.includes(entry?.bid ?? "") ?? false);

    const onUpdateCollectedStatus = useCallback(() => {
        if (collection && (id !== undefined) && entry) {
            window.config.updateEntryCollectedStatus(collection, id, entry.bid);
        }
    }, []);

    const style: Partial<React.CSSProperties> = checked
        ? {
            backgroundColor: backgroundColor,
            color: color
        }
        : {
            backgroundColor: `${backgroundColor}90`,
            color: color,
        };

    return (
        <div className="group-tab" style={style}>
            <input type="checkbox" checked={checked} onChange={e => {
                setChecked(e.target.checked);
                onUpdateCollectedStatus();
            }} />
            <span>{name}</span>
        </div>
    );
};