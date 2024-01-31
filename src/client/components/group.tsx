import React, { useCallback, useContext, useEffect, useState } from "react";
import parse from "html-react-parser";
import { IGroupMetadata, IGroupSettings, ISortSettings } from "../../model/Group";
import { PackageContext } from "../context";
import { Entry } from "./entry";
import "../styles/group.scss";

export interface IGroupProps {
    group: IGroupMetadata,
}

interface IPageProps {
    currentPage: number,
    totalPages: number,
    prevPage: () => void,
    nextPage: () => void
}

const emptyGroupOption: IGroupSettings = { "name": "None", "path": "", "buckets": [] };
const emptySortOption: ISortSettings = { "name": "None", "path": "", "sortType": "string", "direction": 1 };

export const Group: React.FC<IGroupProps & IPageProps> = (props: IGroupProps & IPageProps) => {
    const { group, currentPage, totalPages, prevPage, nextPage } = props;
    const { selectEntry, updateGroup } = useContext(PackageContext);

    const [groupOption, setGroupOption] = useState<IGroupSettings>(group.groupSettings.at(0) || emptyGroupOption);
    const [sortOption, setSortOption] = useState<ISortSettings>(group.sortSettings.at(0) || emptySortOption);

    useEffect(() => {
        setGroupOption(group.groupSettings.at(0) || emptyGroupOption)
        setSortOption(group.sortSettings.at(0) || emptySortOption)
    }, [group.ns]);

    const updateGroupOption = useCallback((optionName: string, sortOption: ISortSettings) => {
        const option = group.groupSettings.find(option => option.name === optionName) || emptyGroupOption;
        setGroupOption(option);
        updateGroup(sortOption, option);
    }, [group.ns]);

    const updateSortOption = useCallback((optionName: string, groupOption: IGroupSettings) => {
        const option = group.sortSettings.find(option => option.name === optionName) || emptySortOption;
        setSortOption(prevOption => {
            const newOption: ISortSettings = { ...option };
            if (!newOption.direction) {
                newOption.direction = 1;
            }
            if (option.name === prevOption.name) {
                newOption.direction = (prevOption.direction === 1) ? -1 : 1;
            }
            updateGroup(newOption, groupOption);
            return newOption;
        });
    }, [group.ns]);

    return (
        <>
            <div className="group-options">
                {(group.groupSettings.length > 0 && false) && // TODO
                    <div className="group-group-options">
                        <span>Group by: </span>
                        <select
                            value={groupOption.name}
                            onChange={e => updateGroupOption(e.target.value, sortOption)}
                        >
                            {group.groupSettings.map(option => <option key={option.name} label={option.name} value={option.name} />)}
                        </select>
                    </div>
                }
                {(group.sortSettings.length > 0) &&
                    <div className="group-sort-options">
                        <span>Sort by: </span>
                        <select
                            value={sortOption.name}
                            onChange={e => updateSortOption(e.target.value, groupOption)}
                        >
                            {group.sortSettings.map(option => <option key={option.name} label={option.name} value={option.name} />)}
                        </select>
                        {sortOption.path.length > 0 &&
                            <button onClick={() => updateSortOption(sortOption.name, groupOption)}>
                                {sortOption.direction === 1 ? "🔼 Ascending" : "🔽 Descending"}
                            </button>
                        }
                    </div>
                }
                <div className="group-collections">
                    {group.config?.collections.map(collection =>
                        <div key={collection.id} style={{
                            backgroundColor: collection.backgroundColor,
                            color: collection.color,
                            border: (collection.type === "boolean" && collection.buckets["collected"]?.length === collection.available) ?
                                "1px solid gold"
                                : undefined
                        }}>
                            {(collection.type === "boolean" && collection.available != null) ?
                                `${collection.name} (${collection.buckets["collected"]?.length ?? 0} / ${collection.available})`
                                : collection.name}
                        </div>
                    )}
                </div>
            </div>
            <div className="group-grid">
                {
                    group.entries.map(entry =>
                        <Entry key={entry.bid} entry={entry} group={group} onClick={() => selectEntry(group.ns, entry.bid)} />
                    )
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