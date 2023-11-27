import React, { useState } from "react";
import { convertHtmlToReact } from "@hedgedoc/html-to-react";
import { IEntryMetadata } from "../../model/Entry";
import { IGroupConfig } from "../../model/Config";
import "../styles/details.scss";

export interface IEntryProps {
    /**
     * The entry to display
     */
    entry: IEntryMetadata,
    /**
     * Whether this entry is being displayed from a collection
     */
    fromCollection?: boolean,
    /**
     * Callback for when this entry is clicked
     */
    onClick?: () => void
}

export const Entry: React.FC<IEntryProps> = (props: IEntryProps) => {
    const { entry, fromCollection, onClick } = props;

    return (
        <div className={fromCollection ? "preview" : "details"}>
            {fromCollection &&
                <div className="group-tabs">
                    <Group name="Recruited" backgroundColor="#0088FF" color="white" />
                    <Group name="5💖" backgroundColor="#22CC22" color="white" />
                    <Group name="Max Level" backgroundColor="#AACC00" color="black" />
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