import React, { useCallback, useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import './styles/importer.scss';
import { BuiltInImporter, getImporterName } from './importers/BuiltInImporters';

enum ImportState {
    NOT_IMPORTING,
    IMPORTING,
    IMPORTING_COMPLETE
}

const Importer: React.FC = () => {
    const [importState, setImportState] = useState<ImportState>(ImportState.NOT_IMPORTING);

    useEffect(() => {
        window.importer.importComplete(() => {
            setImportState(ImportState.IMPORTING_COMPLETE);
            setTimeout(() => setImportState(ImportState.NOT_IMPORTING), 800);
        });
    }, []);

    const importClick = useCallback((value: string) => {
        setImportState(ImportState.IMPORTING);
        window.importer.importBuiltIn(value);
    }, []);

    return (
        <>
            {(importState !== ImportState.NOT_IMPORTING) &&
                <div className='import-mask'>
                    {importState === ImportState.IMPORTING &&
                        <div className='import-loading' />
                    }
                    {importState === ImportState.IMPORTING_COMPLETE &&
                        <div className='import-loading-complete'>
                            <svg height='150' width='200'>
                                <path d='M180 0 L200 20 L70 150 L0 80 L20 60 L70 110 Z' stroke='#00CC00' fill='#00CC00' />
                            </svg>
                        </div>
                    }
                </div>
            }
            {Object.keys(BuiltInImporter).map(value =>
                <div key={value} className='import-list'>
                    <button className='import-button' onClick={() => importClick(value)}>
                        <svg width='24' height='24'>
                            <rect width='24' height='8' y='8' style={{ fill: 'white' }} />
                            <rect width='8' height='24' x='8' style={{ fill: 'white' }} />
                        </svg>
                    </button>
                    {getImporterName(value as BuiltInImporter)}
                </div>
            )}
        </>
    );
}

ReactDOM.render(<Importer />, document.getElementById('app'));
