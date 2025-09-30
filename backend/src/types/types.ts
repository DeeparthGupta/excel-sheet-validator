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
    _errorCols: string[];
};

export interface JSONWorkBook {
    workBookName: string;
    sheets: Map<string, ExcelRow[]>
}

export interface RelationConfig {
    [sheetname: string]: RelationSetting;    
};

export type RelationSetting = {
    min: number;
    max: number;
}

export interface Sheet {
    name: string;
    keyColumn: string;
    rows: ExcelRow[];
    problemChildren?: Map<string, number>;
}

export interface WorkbookMapping{
    [sheetName: string]: [keyColumn: string]
}

export type Workbook = Map<string,Sheet>