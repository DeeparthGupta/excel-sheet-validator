type RowData = Record<string, any>;
type UniquenessMap = Map<string, Map<any, Set<number>>>

interface rowMetaData {
    id: number;
    valid: boolean;
    errors: string;
}

export class Sheet{
    name: string;
    rows: Record<string, any>[];
    columnConstraints?: Map<string, any>;
    private _validRowCount: number = 0;
    private _invalidRowCount: number = 0;
    private _uniquenessMap: UniquenessMap = new Map(); 

    constructor(name: string, rows: Record<string, any>[], columnConstraints: Map<string, any>) {
        this.name = name;
        this.rows = rows;
        this.columnConstraints = columnConstraints;
    }

    get rowCount() {
        return this.rows.length;
    }
    
    get validRowCount() {
        return this._validRowCount;
    }

    get invalidRowCount() {
        return this._invalidRowCount;
    }

    
    
}