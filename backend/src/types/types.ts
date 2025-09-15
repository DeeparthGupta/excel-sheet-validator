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
    mainSheet: SheetRelation,
    oneToOne ?: SheetRelation,
    oneToMany ?: SheetRelation,
    zeroToMany ?: SheetRelation
};

export interface SheetRelation {
    name: string,
    rowID: string
}