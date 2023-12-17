import React, { ChangeEvent, useCallback, useContext, useEffect, useMemo, useState } from "react";
import parse from "html-react-parser";
import { IGroupMetadata, IGrouping, ISorting } from "../../model/Group";
import { PackageContext } from "../context";
import { Entry } from "./entry";
import { IEntryMetadata } from "../../model/Entry";
import "../styles/group.scss";

export interface IGroupProps {
    group: IGroupMetadata,
    updateGroup: (sortBy?: ISortProps, sortDescending?: boolean) => void
}

interface IPageProps {
    currentPage: number,
    totalPages: number,
    prevPage: () => void,
    nextPage: () => void
}

export const Group: React.FC<IGroupProps & IPageProps> = (props: IGroupProps & IPageProps) => {
    const { group, updateGroup, currentPage, totalPages, prevPage, nextPage } = props;

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
        setGrouping(group.groupings.find(g => g.path === event.target.value));
    }, [group]);

    const [sorting, setSorting] = useState<ISorting | undefined>();
    const [descending, setDescending] = useState<boolean>(true);

    const onSort = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
        setSorting(group.sortings.find(s => s.path === event.target.value));
        setDescending(event.target.value.charAt(0) !== "^");
    }, [group]);

    useEffect(() => {
        setGrouping(undefined);
        setSorting((group.sortings?.length ?? -1) > 0 ? group.sortings[0] : undefined);
        setDescending(true);
    }, [group]);

    return (
        <>
            <div className="group-grid">
                {(group.groupings && group.groupings.length > 0) &&
                    <div className="grouping-selection">
                        Group by:
                        <select name="groupings" value={grouping?.path} onChange={onGroup}>
                            <option value="">None</option>
                            {group.groupings.map(grouping => <option key={grouping.path} value={grouping.path}>{grouping.name}</option>)}
                        </select>
                    </div>
                }
                {(group.sortings && group.sortings.length > 0) &&
                    <div className="grouping-selection">
                        Sort by:
                        <select name="sortings" value={sorting?.path} onChange={onSort}>
                            {group.sortings.map(sorting => (
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
                        <Bucket key={bucket.name} group={group} updateGroup={updateGroup}
                            name={bucket.name} path={grouping?.path ?? ""} min={bucket.min} max={bucket.max} value={bucket.value} descending={descending} />)
                    : [...group.entries ?? []].map(entry =>
                        <Entry key={entry.bid} entry={entry} group={group} onClick={() => selectEntry(group.ns, entry.bid)} />)
                }
                {group.style && parse(group.style)}
            </div>
            <div className="group-page-select">
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

const Bucket: React.FC<IGroupProps & IBucketProps & ISortProps> = (props: IGroupProps & IBucketProps & ISortProps) => {
    const { group, name: bucketName, path: bucketPath, min, max, value, path: sortPath, descending } = props;

    const { selectEntry } = useContext(PackageContext);

    return (
        <>
            <div className="group-bucket">{bucketName}</div>
            {
                group.entries
                    ?.filter(entry => filterEntry(entry, bucketPath, min, max, value))
                    ?.sort((a, b) => compareEntry(a, b, sortPath, descending))
                    ?.map(entry => <Entry key={entry.bid} entry={entry} group={group} onClick={() => selectEntry(group.ns, entry.bid)} />)
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