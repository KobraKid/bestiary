import React, { useEffect, useState } from "react";

enum ImportState {
    NOT_IMPORTING,
    IMPORTING,
    IMPORT_COMPLETE,
    IMPORT_FAILED
}

export const ImportView: React.FC = () => {
    const [importState, setImportState] = useState<ImportState>(ImportState.NOT_IMPORTING);
    const [importTotalComplete, setImportTotalComplete] = useState<number>(0);
    const [importPctComplete, setImportPctComplete] = useState<number>(0);
    const [importMessage, setImportMessage] = useState<string>("");

    useEffect(() => {
        window.importer.importStart(() => {
            setImportState(ImportState.IMPORTING);
        });

        window.importer.importUpdate((update: string, pctComplete: number, totalPctCompletion: number) => {
            setImportMessage(update);
            setImportTotalComplete(totalPctCompletion);
            setImportPctComplete(pctComplete);
        });

        window.importer.importComplete(() => {
            setImportState(ImportState.IMPORT_COMPLETE);
            setTimeout(() => setImportState(ImportState.NOT_IMPORTING), 800);
        });

        window.importer.importFailed(() => {
            setImportState(ImportState.IMPORT_FAILED);
            setTimeout(() => setImportState(ImportState.NOT_IMPORTING), 800);
        });
    }, []);

    if (importState === ImportState.NOT_IMPORTING) { return null; }

    return (
        <div className='import-mask'>
            {importState === ImportState.IMPORTING &&
                <>
                    <div className='import-loading' />
                    <div className='import-message'>{importMessage}</div>
                    <div className='import-percent'>
                        <div className='import-percent-label'>
                            <div>{`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(importPctComplete * 100)}%`}</div>
                        </div>
                        <div className='import-percent-inner' style={{ width: `${importPctComplete * 100}%` }} />
                    </div>
                    <div className='import-percent'>
                        <div className='import-percent-label'>
                            <div>{`${Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(importTotalComplete * 100)}%`}</div>
                        </div>
                        <div className='import-percent-inner' style={{ width: `${importTotalComplete * 100}%` }} />
                    </div>
                </>
            }
            {importState === ImportState.IMPORT_COMPLETE &&
                <div className='import-loading-complete'>
                    <svg height='150' width='200'>
                        <path d='M180 0 L200 20 L70 150 L0 80 L20 60 L70 110 Z' stroke='#00CC00' fill='#00CC00' />
                    </svg>
                </div>
            }
            {importState === ImportState.IMPORT_FAILED &&
                <div className='import-loading-failed'>
                    <svg height='200' width='200'>
                        <path d='M0 20 L20 0 L100 80 L180 0 L200 20 L120 100 L200 180 L180 200 L100 120 L20 200 L0 180 L80 100 Z' stroke='#CC0000' fill='#CC0000' />
                    </svg>
                </div>
            }
        </div>
    );
};