import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import parse, { DOMNode, domToReact } from "html-react-parser";
import { IEntryMetadata } from "../../model/Entry";
import { ICollection } from "../../model/Config";
import { IGroupMetadata } from "../../model/Group";
import { PackageContext } from "../context";
import "../styles/details.scss";

export interface IEntryProps {
    /**
     * The entry to display
     */
    entry: IEntryMetadata,
    /**
     * The group this entry is part of
     */
    group?: IGroupMetadata,
    /**
     * Callback for when this entry is clicked
     */
    onClick?: () => void
}

export const Entry: React.FC<IEntryProps> = (props: IEntryProps) => {
    const { entry, group, onClick } = props;

    const { selectEntry } = useContext(PackageContext);

    const entryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        entryRef.current?.scrollTo(0, 0);
    }, [entry]);

    const layout = parse(entry.layout, {
        replace: (domNode) => {
            if (domNode.type === "tag" && domNode.name === "a") {
                const linkedGroup = domNode.attribs["data-linked-group"];
                const linkedEntry = domNode.attribs["data-linked-entry"];
                if (linkedGroup !== undefined && linkedEntry !== undefined) {
                    return (
                        <div {...domNode.attribs}
                            style={{ width: "fit-content", cursor: "pointer" }}
                            onClick={() => selectEntry(linkedGroup, linkedEntry)} >
                            {domToReact(domNode.children as DOMNode[])}
                        </div>
                    );
                }
            }
            return; // no replacement
        }
    });

    return (
        <div className={group ? "preview" : "details"} ref={entryRef}>
            {group &&
                <div className="collection-tabs">
                    {group.config?.collections.map(collection =>
                        <Collection key={collection.id} {...collection} entry={entry} group={group} />
                    )}
                </div>
            }
            <div onClick={onClick}>{layout}</div>
            {entry.style && parse(entry.style)}
        </div>
    );
};

export const Collection: React.FC<Partial<ICollection & IEntryProps>> = (props: Partial<ICollection & IEntryProps>) => {
    const { id, name, backgroundColor, color, entries, entry, group } = props;

    const [checked, setChecked] = useState<boolean>(entries?.includes(entry?.bid ?? "") ?? false);

    const onUpdateCollectedStatus = useCallback(() => {
        if (group && (id !== undefined) && entry) {
            window.config.updateEntryCollectedStatus(group, id, entry.bid);
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
        <div className="collection-tab" style={style}>
            <input type="checkbox" checked={checked} onChange={e => {
                setChecked(e.target.checked);
                onUpdateCollectedStatus();
            }} />
            <span>{name}</span>
        </div>
    );
};