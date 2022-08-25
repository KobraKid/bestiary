export const attributeTypes = ['string', 'number', 'boolean'] as const;
export type AttributeType = typeof attributeTypes[number] | Array<AttributeType | typeof attributeTypes[number]>;
export type Attribute = [name: string, type: AttributeType];

export type AttributeValue = string | number | boolean | Array<string | number | boolean | AttributeValue>;
export type AttributeData = { [name: string]: AttributeValue };