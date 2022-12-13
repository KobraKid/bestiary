import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { EntryContext, PackageContext } from '../context';
import { ILayoutProps } from '../model/Layout';
import { getValueOrLiteral } from './base';

export interface IFormulaLayoutProps extends ILayoutProps {
    label: string
    expression: string,
    vars: string[]
}

interface IVarDefinitions {
    /** The variable scope sent to the main process for formula evaluation */
    scope: {
        [key: string]: string | number
    },
    /** Information about each variable */
    vars: {
        [key: string]: {
            name: string,
            value: string | number,
            min: number,
            max: number,
            step: number
        }
    }
}

export const Formula = () => {
    const { pkg } = useContext(PackageContext);
    const { entry, layout } = useContext(EntryContext);

    const label = useMemo(() => getValueOrLiteral(entry, pkg, (layout as IFormulaLayoutProps).label), []);
    const expression = useMemo(() => getValueOrLiteral(entry, pkg, (layout as IFormulaLayoutProps).expression), []);
    const vars = useMemo(() => getValueOrLiteral(entry, pkg, (layout as IFormulaLayoutProps).vars), []);
    const [varDefinitions, setVarDefinitions] = useState<IVarDefinitions>(() => {
        const __scope = {};
        const __vars = {};
        if (Array.isArray(vars)) {
            for (let i = 0; i < vars.length; i++) {
                const varDef = vars[i]?.toString().split('||');
                if (Array.isArray(varDef) && varDef.length >= 3 && varDef.length <= 6) {
                    const label = getValueOrLiteral(entry, pkg, varDef[0]!.trim());
                    const name = getValueOrLiteral(entry, pkg, varDef[1]!.trim());
                    const initialValue = getValueOrLiteral(entry, pkg, varDef[2]!.trim());
                    const min = getValueOrLiteral(entry, pkg, varDef[3]?.trim() ?? 1);
                    const max = getValueOrLiteral(entry, pkg, varDef[4]?.trim() ?? 100);
                    const step = getValueOrLiteral(entry, pkg, varDef[5]?.trim() ?? 1);
                    Object.assign(__scope, { [label.toString()]: initialValue });
                    Object.assign(__vars, {
                        [label.toString()]: {
                            name: name, value: initialValue, min: min, max: max, step: step
                        }
                    })
                }
            }
        }
        return { scope: __scope, vars: __vars };
    });

    const updateVarValue = useCallback((key: string, value: string, scope: IVarDefinitions) => {
        let newScope: IVarDefinitions = Object.assign({}, scope);
        newScope.vars[key as keyof typeof scope.vars]!.value = value;
        newScope.scope[key as keyof typeof scope.scope] = value;
        setVarDefinitions(newScope);
    }, []);

    const [value, setValue] = useState<number>(0);
    useEffect(() => {
        window.formula.eval(expression.toString(), varDefinitions.scope).then(setValue);
    }, [expression, varDefinitions]);

    return (
        <>
            {label}: {value}
            {Object.keys(varDefinitions.vars).map(key => {
                const varDef = varDefinitions.vars[key as keyof typeof varDefinitions.vars];
                if (!varDef) { return null; }
                return (
                    <React.Fragment key={key}>
                        <label>{varDef.name}</label>
                        <input type="range"
                            value={varDef.value} min={varDef.min} max={varDef.max} step={varDef.step}
                            onChange={e => updateVarValue(key, e.target.value, varDefinitions)} />
                    </React.Fragment>
                );
            })}
        </>
    )
}