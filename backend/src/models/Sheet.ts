type RowID = bigint;
type ColumnID = string;
type RowData = Record<string, any>;
type UniquenessMap = Map<string, Map<any, Set<number>>>;
type ErrorMap = Map<RowID, string[]>;

interface ColumnData {
    displayName: string;
    constraints?: any[];
}

interface RowReference{
    sheetId: string;
    rowID: number;
}

interface SerializedRow {
    [key: string]: any;
    sheetID: string;
    id: number;
    valid: boolean;
    errors: string[];
}


export class Sheet{
    sheetID: string; // ULID to identify sheet anywhere
    sheetName: string;
    columns: Map<ColumnID, ColumnData> = new Map();
    rows: Map<RowID, RowData> = new Map();
    graveyard: RowID[] = []; 
    errors?: ErrorMap;

    private _validRowCount: number = 0;
    private _invalidRowCount: number = 0;
    private _uniquenessMap: UniquenessMap = new Map();
    private _errorMap: ErrorMap = new Map();
    private _columnCounter: number = 1;
    private _rowCounter: RowID = 1n;

    constructor(id: string, name: string, columns?: ColumnData[], rows?: RowData[]) {
        this.sheetID = id;
        this.sheetName = name;

        if (columns && columns.length > 0) {
            columns.forEach((column: ColumnData) => {
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

    addColumn(column: ColumnData): void {
        const columnId:string = `col${this._columnCounter++}`;
        this.columns.set(columnId,column)
    }
    
    removeColumn(columnId: ColumnID): void {
        this.columns.delete(columnId);
    }

    addColumnConstraint(colID: string, constraint: any) {
        if (!this.columns.has(colID)) {
            console.log('No such column exists');
            return;
        } else {
            this.columns.get(colID)?.constraints?.push(constraint);
        }
    }

    removeColumnConstraint(colID: string, constraint: any) {
        const constraintArr = this.columns.get(colID)?.constraints;
        if (!constraintArr) {
            console.log(`Column ${colID} does not exist or does not have any constraints`);
            return;
        }
        
        const idx = constraintArr.indexOf(constraint)
        if (idx !== -1) {
            console.log(`Colum ${colID} does not have the ${constraint.name} constraint.`);
            return;
        }

        const lastIdx = constraintArr.length - 1;
        // Swap + pop for O(1) deletion
        [constraintArr[idx], constraintArr[lastIdx]] = [constraintArr[lastIdx], constraint[idx]];
        constraintArr.pop();

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