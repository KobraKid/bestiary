import React, { ChangeEvent, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ICollectionMetadata, IGrouping, ISorting } from "../../model/Collection";
import { convertHtmlToReact } from "@hedgedoc/html-to-react";
import { PackageContext } from "../context";
import { Entry } from "./entry";
import { IEntryMetadata } from "../../model/Entry";
import "../styles/collection.scss";

export interface ICollectionProps {
    collection: ICollectionMetadata,
    updateCollection: (sortBy?: ISortProps, sortDescending?: boolean) => void
}

interface IPageProps {
    currentPage: number,
    totalPages: number,
    prevPage: () => void,
    nextPage: () => void
}

export const Collection: React.FC<ICollectionProps & IPageProps> = (props: ICollectionProps & IPageProps) => {
    const { collection, updateCollection, currentPage, totalPages, prevPage, nextPage } = props;

    const { selectEntry } = useContext(PackageContext);

    const [grouping, setGrouping] = useState<IGrouping | undefined>();
    const buckets: { name: string, value?: string, min?: number, max?: number }[] | undefined = useMemo(
        () => {
            if (grouping && grouping.buckets.length > 0 && typeof grouping.buckets[0]!.value === "number") {
                const sortedBuckets = [...grouping.buckets].sort((a, b) =>
                    (typeof a.value === "number" && typeof b.value === "number")
                        ? a.value - b.value
                        : (a.value as string).localeCompare(b.value as string));
                return grouping.buckets.map(bucket => {
                    const index = sortedBuckets.findIndex(sb => sb.name === bucket.name);
                    let max = Infinity;
                    if (index < sortedBuckets.length - 1) {
                        max = sortedBuckets[index + 1]!.value as number;
                    }
                    return {
                        name: bucket.name,
                        min: bucket.value as number,
                        max: max
                    };
                });
            }
            else {
                return grouping?.buckets.map(bucket => {
                    return {
                        name: bucket.name,
                        value: bucket.value as string
                    };
                });
            }
        },
        [grouping]);

    const onGroup = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
        setGrouping(collection.groupings.find(g => g.path === event.target.value));
    }, [collection]);

    const [sorting, setSorting] = useState<ISorting | undefined>();
    const [descending, setDescending] = useState<boolean>(true);

    const onSort = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
        setSorting(collection.sortings.find(s => s.path === event.target.value));
        setDescending(event.target.value.charAt(0) !== "^");
    }, [collection]);

    useEffect(() => {
        setGrouping(undefined);
        setSorting((collection.sortings?.length ?? -1) > 0 ? collection.sortings[0] : undefined);
        setDescending(true);
    }, [collection]);

    return (
        <>
            <div className="collection-grid">
                {(collection.groupings && collection.groupings.length > 0) &&
                    <div className="grouping-selection">
                        Group by:
                        <select name="groupings" value={grouping?.path} onChange={onGroup}>
                            <option value="">None</option>
                            {collection.groupings.map(grouping => <option key={grouping.path} value={grouping.path}>{grouping.name}</option>)}
                        </select>
                    </div>
                }
                {(collection.sortings && collection.sortings.length > 0) &&
                    <div className="grouping-selection">
                        Sort by:
                        <select name="sortings" value={sorting?.path} onChange={onSort}>
                            {collection.sortings.map(sorting => (
                                <React.Fragment key={sorting.path}>
                                    <option value={sorting.path}>{sorting.name} (Ascending)</option>
                                    <option value={`^${sorting.path}`}>{sorting.name} (Descending)</option>
                                </React.Fragment>
                            ))}
                        </select>
                    </div>
                }
                <br />
                {buckets
                    ? buckets.map(bucket =>
                        <Group key={bucket.name} collection={collection} updateCollection={updateCollection}
                            name={bucket.name} path={grouping?.path ?? ""} min={bucket.min} max={bucket.max} value={bucket.value} descending={descending} />)
                    : [...collection.entries ?? []].map(entry =>
                        <Entry key={entry.bid} entry={entry} collection={collection} onClick={() => selectEntry(collection.ns, entry.bid)} />)
                }
                {collection.style && convertHtmlToReact(collection.style)}
            </div>
            <div className="collection-page-select">
                <button onClick={prevPage} disabled={currentPage === 1}>◀</button>
                {`Page ${currentPage} of ${totalPages}`}
                <button onClick={nextPage} disabled={currentPage === totalPages}>▶</button>
            </div>
        </>
    );
};

interface IBucketProps {
    name: string,
    path: string,
    min?: number,
    max?: number,
    value?: string
}

interface ISortProps {
    name: string,
    path: string,
    descending: boolean
}

const Group: React.FC<ICollectionProps & IBucketProps & ISortProps> = (props: ICollectionProps & IBucketProps & ISortProps) => {
    const { collection, name: bucketName, path: bucketPath, min, max, value, path: sortPath, descending } = props;

    const { selectEntry } = useContext(PackageContext);

    return (
        <>
            <div className="collection-bucket">{bucketName}</div>
            {
                collection.entries
                    ?.filter(entry => filterEntry(entry, bucketPath, min, max, value))
                    ?.sort((a, b) => compareEntry(a, b, sortPath, descending))
                    ?.map(entry => <Entry key={entry.bid} entry={entry} collection={collection} onClick={() => selectEntry(collection.ns, entry.bid)} />)
            }
        </>
    );
};

function filterEntry(entry: IEntryMetadata, bucketPath: string, min: number | undefined, max: number | undefined, value: string | undefined): boolean {
    const bucketValue = entry.groupings?.find(grouping => grouping.path === bucketPath)?.bucketValue;
    if (min !== undefined) {
        const numValue = bucketValue as number;
        if (max != undefined) {
            return numValue >= min && numValue < max;
        }
        else {
            return numValue >= min;
        }
    }
    else if (value !== undefined) {
        const strValue = bucketValue as string;
        return strValue === value;
    }
    return false;
}

function compareEntry(entryA: IEntryMetadata, entryB: IEntryMetadata, sortPath: string | undefined, descending: boolean): number {
    if (!sortPath) { return 0; }
    const aVal = entryA.sortings?.find(s => s.path === sortPath)?.value;
    const bVal = entryB.sortings?.find(s => s.path === sortPath)?.value;
    if (aVal == undefined) {
        return descending ? 1 : -1;
    }
    else if (bVal == undefined) {
        return descending ? -1 : 1;
    }
    else if (typeof aVal === "number" && typeof bVal === "number") {
        return descending ? (bVal - aVal) : (aVal - bVal);
    }
    else {
        return descending ? (bVal.toString().localeCompare(aVal.toString())) : (aVal.toString().localeCompare(bVal.toString()));
    }
}