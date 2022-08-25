import { Attribute, AttributeType } from "./Attribute";
import IEntry from "./Entry";

export function buildModel(): Attribute[][] {
    return [[['name', 'string']]];
}

export function copyModel(model: Attribute[]): Attribute[] {
    return Object.assign([], model);
}

export function parseImportedDataToDataModel(data: IEntry[]): Attribute[] {
    let model: Attribute[] = [];
    data.forEach(entry => {
        let attributes = entry.attributes;
        Object.keys(attributes).forEach(key => {
            if (model.find(attr => attr[0] === key)) { return; } // This attribute already exists on the model

            let val = attributes![key as keyof typeof attributes] as any;
            let attributeType = parseImportedAttributeToDataModel(val);
            if (Array.isArray(attributeType) && attributeType.length < 1) {
                console.log(`Couldn't parse ${key}`);
            }
            else {
                model.push([key, attributeType]);
            }
        });
    });
    console.log(model);
    return model;
}

export function parseImportedAttributeToDataModel(val: any): AttributeType {
    if (typeof val === 'string') {
        return 'string';
    }
    else if (typeof val === 'number') {
        return 'number';
    }
    else if (typeof val === 'boolean') {
        return 'boolean';
    }
    else if (Array.isArray(val)) {
        return val.map(arrayVal => parseImportedAttributeToDataModel(arrayVal));
    }
    else {
        return [];
    }
}