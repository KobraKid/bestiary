import React, { useCallback, useContext, useEffect, useState } from "react";
import { IPackageMetadata } from "../../../model/Package";
import { PackageContext } from "../../context";
import { Task } from "./task";

import "../../styles/compiler.scss";

enum CompileState {
    NOT_COMPILING,
    CONFIGURING_COMPILE,
    COMPILING
}

export const enum RecompileOption {
    NEW = "New",
    ALL = "All",
    RECOMP_VALS = "Recompute Sorting/Grouping Values"
}

export const CompileView: React.FC = () => {
    const { pkg } = useContext(PackageContext);
    const [compileState, setCompileState] = useState<CompileState>(CompileState.NOT_COMPILING);
    const [compileAllGroups, setCompileAllGroups] = useState<boolean>(true);
    const [groupsToCompile, setGroupsToCompile] = useState<boolean[]>([]);
    const [recompileOption, setRecompileOption] = useState<RecompileOption>(RecompileOption.NEW);

    const onClose = useCallback(() => {
        setCompileState(CompileState.NOT_COMPILING);
        window.menu.actionComplete();
    }, []);

    const onCompile = useCallback((pkg: IPackageMetadata, allGroups: boolean, recompileOption: RecompileOption, groupSettings: boolean[]) => {
        setCompileState(CompileState.COMPILING);
        window.task.compilePackage(pkg, allGroups, recompileOption, groupSettings);
    }, []);

    useEffect(() => {
        setGroupsToCompile(pkg.groups.map(() => false));
        setRecompileOption(RecompileOption.NEW);
    }, [pkg]);

    useEffect(() => {
        window.menu.onShowCompile(() => setCompileState(CompileState.CONFIGURING_COMPILE));
    }, []);

    return (
        <Task hasPreTaskSetup={compileState === CompileState.CONFIGURING_COMPILE}>
            {compileState === CompileState.CONFIGURING_COMPILE &&
                <div className="compile-config">
                    <h2>Compilation Setup</h2>
                    <h3>Select groups to compile</h3>
                    <div>
                        <input
                            type="checkbox"
                            checked={compileAllGroups}
                            onChange={e => {
                                setCompileAllGroups(e.target.checked);
                                if (e.target.checked) { setGroupsToCompile(pkg.groups.map(() => false)); }
                            }} />All
                    </div>
                    {!compileAllGroups &&
                        <div className="compile-group-list">
                            {pkg.groups.map((group, i) =>
                                <div key={group.ns} className="compile-group-list-item">
                                    <input
                                        type="checkbox"
                                        checked={groupsToCompile[i]}
                                        onChange={e => setGroupsToCompile(prev => [
                                            ...prev.slice(0, i),
                                            e.target.checked,
                                            ...prev.slice(i + 1)
                                        ])} />
                                    <div className="compile-group-list-name">{group.name}</div>
                                </div>
                            )}
                        </div>
                    }
                    <h3>Select entries to compile</h3>
                    <div>
                        <select value={recompileOption} onChange={e => setRecompileOption(e.target.value as RecompileOption)}>
                            <option value={RecompileOption.ALL}>All entries</option>
                            <option value={RecompileOption.NEW}>Only new entries</option>
                            <option value={RecompileOption.RECOMP_VALS}>Recompute Sorting/Grouping Values</option>
                        </select>
                    </div>
                    <div className="compile-buttons">
                        <button onClick={() => onCompile(pkg, compileAllGroups, recompileOption, groupsToCompile)}>✔️ Accept</button>
                        <button onClick={onClose}>❌ Cancel</button>
                    </div>
                </div>
            }
        </Task>
    );
};