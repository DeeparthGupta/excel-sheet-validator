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
    mainSheet: string;
    relations: {
        [sheetname: string]: RelationSetting;        
    }
};

export interface Sheet {
    name: string;
    keyColumn: string;
    rows: ExcelRow[];
}

export type RelationSetting = {
    min: number;
    max: number
}