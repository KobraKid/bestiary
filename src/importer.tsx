import React, { useCallback, useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import './styles/importer.scss';

enum BuiltInImports {
    dqtact = 'Dragon Quest Tact'
}

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
                            <svg height='200' width='200'>
                            <path d='M190 0 L200 10 L50 200 L0 150 L10 140 L50 180 Z' stroke='#00CC00' fill='#00CC00' />
                            </svg>
                        </div>
                    }
                </div>
            }
            {Object.keys(BuiltInImports).map(value =>
                <div key={value} className='import-list'>
                    <button style={{ display: 'flex' }} onClick={() => importClick(value)}>
                        <svg width='24' height='24'>
                            <rect width='24' height='8' y='8' style={{ fill: 'rgb(0, 255, 0)' }} />
                            <rect width='8' height='24' x='8' style={{ fill: 'rgb(0, 255, 0)' }} />
                        </svg>
                    </button>
                    {BuiltInImports[value as keyof typeof BuiltInImports]}
                </div>
            )}
        </>
    );
}

ReactDOM.render(<Importer />, document.getElementById('app'));
