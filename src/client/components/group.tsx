import React, { ChangeEvent, useCallback, useContext, useState } from "react";
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

    const updateGroupOption = useCallback((event: ChangeEvent<HTMLSelectElement>, sortOption: ISortSettings) => {
        const option = group.groupSettings.find(option => option.name === event.target.value) || emptyGroupOption;
        setGroupOption(option);
        updateGroup(sortOption, option);
    }, []);

    const updateSortOption = useCallback((event: ChangeEvent<HTMLSelectElement>, groupOption: IGroupSettings) => {
        const option = group.sortSettings.find(option => option.name === event.target.value) || emptySortOption;
        setSortOption(option);
        updateGroup(option, groupOption);
    }, []);

    return (
        <>
            <div className="group-options">
                <div className="group-group-options">
                    <span>Group by: </span>
                    <select
                        value={groupOption.name}
                        onChange={e => updateGroupOption(e, sortOption)}
                    >
                        {group.groupSettings.map(option => <option key={option.path} label={option.name} value={option.name} />)}
                    </select>
                </div>
                <div className="group-sort-options">
                    <span>Sort by: </span>
                    <select
                        value={sortOption.name}
                        onChange={e => updateSortOption(e, groupOption)}
                    >
                        {group.sortSettings.map(option => <option key={option.path} label={option.name} value={option.name} />)}
                    </select>
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