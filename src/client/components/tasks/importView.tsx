import React, { useCallback, useEffect, useState } from "react";
import { Task } from "./task";

export const ImportView: React.FC = () => {
    const [importing, setImporting] = useState<boolean>();

    const afterImport = useCallback(() => setImporting(false), []);

    useEffect(() => {
        window.task.importPackage(() => {
            setImporting(true);
        });
    }, []);

    if (!importing) { return null; }
    return <Task onComplete={afterImport} onFailed={afterImport} />;
};