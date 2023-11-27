import React, { useState } from "react";
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
                    {collection.config?.groups.map(group => <Group key={group.id} {...group} />)}
                </div>
            }
            <div onClick={onClick}>
                {convertHtmlToReact(entry.layout)}
            </div>
            {entry.style && convertHtmlToReact(entry.style)}
        </div>
    );
};

export const Group: React.FC<Partial<IGroupConfig>> = (props: Partial<IGroupConfig>) => {
    const { name, backgroundColor, color } = props;

    const [checked, setChecked] = useState<boolean>(false);

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
            <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} />
            <span>{name}</span>
        </div>
    );
};