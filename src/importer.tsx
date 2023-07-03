import React from 'react';
import * as ReactDOM from 'react-dom';

enum BuiltInImports {
    dqtact = 'Dragon Quest Tact'
}

const Importer: React.FC = () => {
    return (
        <>
            {Object.keys(BuiltInImports).map(value =>
                <div key={value} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                    <button style={{ display: 'flex' }} onClick={() => window.importer.importBuiltIn(value)}>
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
