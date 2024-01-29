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
    const style = parse(entry.style ?? "");

    return (
        <div className={group ? "preview" : "details"} ref={entryRef}>
            {(group && entry.layout.length > 0) &&
                <div className="collection-tabs">
                    {group.config?.collections.map(collection =>
                        <Collection key={collection.id} {...collection} entry={entry} group={group} />
                    )}
                </div>
            }
            <div onClick={onClick}>{layout}</div>
            {style}
        </div>
    );
};

type CollectionProps = Partial<ICollection & IEntryProps>;

export const Collection: React.FC<CollectionProps> = (props: CollectionProps) => {
    if (props.type === "boolean") {
        return <BooleanCollection {...props} />;
    }
    else {
        return <NumberCollection {...props} />;
    }
};

const BooleanCollection: React.FC<CollectionProps> = (props: CollectionProps) => {
    const { id, name, backgroundColor, color, buckets, entry, group } = props;

    const [checked, setChecked] = useState<boolean>(!!buckets && (buckets["collected"]?.includes(entry?.bid ?? "") ?? false));

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
        <div className="collection-tab collection-tab-checkbox" style={style} onClick={() => {
            setChecked(checked => !checked);
            onUpdateCollectedStatus();
        }}>
            <input className="collection-checkbox" type="checkbox" checked={checked} onClick={e => e.stopPropagation()} onChange={e => {
                setChecked(e.target.checked);
                onUpdateCollectedStatus();
            }} />
            <span>{name}</span>
        </div>
    );
};

const NumberCollection: React.FC<CollectionProps> = (props: CollectionProps) => {
    const { id, name, backgroundColor, color, buckets, min, max, entry, group } = props;

    const [value, setValue] = useState<number>(parseInt(Object.keys(buckets ?? {}).find(key => buckets![key]?.includes(entry?.bid ?? "")) ?? "0", 10));

    const onUpdateBucket = useCallback((value: number) => {
        if (group && (id !== undefined) && entry) {
            window.config.updateEntryCollectedStatus(group, id, entry.bid, value);
        }
    }, []);

    const style: Partial<React.CSSProperties> = {
        backgroundColor: `${backgroundColor}${"FF"}`,
        color: color
    };

    return (
        <div className="collection-tab collection-tab-range" style={style}>
            <div className="collection-tab-range-label">
                <div className="collection-tab-range-value">{value}</div>
                <span>{name}</span>
            </div>
            <input className="collection-range" type="range" min={min} max={max} value={value} onChange={e => {
                const newVal = parseInt(e.target.value, 10);
                setValue(newVal);
                onUpdateBucket(newVal);
            }} />
        </div>
    );
};