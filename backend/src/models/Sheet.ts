type RowID = bigint;
type ColumnID = string;
type RowData = Record<string, any>;
type UniquenessMap = Map<string, Map<any, Set<number>>>;
type ErrorMap = Map<RowID, string[]>;

type ColumnData = {
    displayName: string;
    type?: any;
}

interface RowReference{
    sheetId: string;
    rowID: number;
}

interface SerializedRow {
    [key: string]: any;
    id: number;
    valid: boolean;
    errors: string[];
}


export class Sheet{
    sheetID: string;
    sheetName: string;
    columns: Map<ColumnID, ColumnData> = new Map();
    rows: Map<RowID, RowData> = new Map();
    graveyard: RowID[] = []; 
    columnConstraints?: Map<ColumnID, any>;
    errors?: ErrorMap;

    private _validRowCount: number = 0;
    private _invalidRowCount: number = 0;
    private _uniquenessMap: UniquenessMap = new Map();
    private _errorMap: ErrorMap = new Map();
    private _columnCounter: number = 1;
    private _rowCounter: RowID = 1n;

    constructor(id: string, name: string, columns?: ColumnData[] | string[], rows?: RowData[]) {
        this.sheetID = id;
        this.sheetName = name;

        if (columns && columns.length > 0) {
            columns.forEach((column: ColumnData | string) => {
                this.addColumn(column);
            });
        }

        if (rows && rows.length > 0) {
            rows.forEach(row => {
                this.addRow(row);
            })
        }
    }

    get rowCount() {
        return this.rows.size;
    }
    
    get validRowCount() {
        return this._validRowCount;
    }

    get invalidRowCount() {
        return this._invalidRowCount;
    }

    addColumn(column: ColumnData | string): void {
        const columnId:string = `col${this._columnCounter++}`;
        if (typeof column === 'string'){
            const columnObj: ColumnData = {
                displayName: column, 
                type: null
            };
            this.columns.set(columnId, columnObj);
            return;
        }
        this.columns.set(columnId,column)
    }
    
    removeColumn(columnId: ColumnID): void {
        this.columns.delete(columnId);
        if (this.columnConstraints) {
            this.columnConstraints.delete(columnId);
        }
    }
    
    addRow(row: RowData): void {
        const rowID: RowID = this.graveyard.length > 0
            ? this.graveyard.pop()!
            : this._rowCounter++
            ;
        this.rows.set(rowID, row);
    }

    removeRow(rowID: RowID): void {
        this.rows.delete(rowID);
        if (this._errorMap) this._errorMap.delete(rowID);
        this.graveyard.push(rowID);
    }

    generateUniqunessMap(): void{
        if (this._uniquenessMap.size > 0) return;
        else {
            
        }
    }
}