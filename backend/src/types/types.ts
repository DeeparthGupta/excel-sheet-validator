export type UniquenessViolation = {
    field: string;
    value: any;
    indices: number[];
};

export interface ExcelRow {
    [key: string] : any;
    _index: number;
    _sheetName: string;
    _valid: boolean | null;
    _errors: string[];
};

export interface JSONWorkBook {
    workBookName: string;
    sheets: Map<string, ExcelRow[]>
}

export interface RelationConfig {
    mainSheet: TableKey,
    oneToOne ?: TableRelation,
    oneToMany ?: TableRelation,
    zeroToMany ?: TableRelation
};

interface TableRelation{
    mainTable: TableKey,
    childTable: TableKey,
    relationship: "oneToOne" | "oneToMany",
    connectionMandatory: boolean
}

export interface TableKey {
    name: string,
    keyColumn: string
}

export type Sheet = {
    name: string;
    keyColumn: string;
    rows: ExcelRow[];
}

export type RelationSetting = {
    min: number;
    max: number
}