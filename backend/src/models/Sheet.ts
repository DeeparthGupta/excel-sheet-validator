type RowID = bigint;
type ColumnID = string;
type RowData = Record<string, any>;
type UniquenessMap = Map<ColumnID, Map<any, Set<RowID>>>;
type ErrorMap = Map<RowID, Map<ColumnID, string>>;

interface ColumnData {
    displayName: string;
    constraints: {
        [key: string]: any;
    };
}

interface RowReference{
    sheetId: string;
    rowID: RowID;
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

    private validRowCount: number = 0;
    private invalidRowCount: number = 0;

    private uniquenessMap: UniquenessMap = new Map();
    private errorMap: ErrorMap = new Map(); 

    private columnCounter: number = 1;
    private rowCounter: RowID = 1n;

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
    
    get validRows() {
        return this.validRowCount;
    }

    get invalidRows() {
        return this.invalidRowCount;
    }

    addColumn(column: ColumnData): void {
        const columnId: string = `col${this.columnCounter++}`;
        // Ensure a constraints array always exists
        column.constraints = column.constraints ?? [];
        this.columns.set(columnId,column)
    }
    
    // Remove column by ID
    removeColumn(columnId: ColumnID): void {
        this.columns.delete(columnId);
    }

    addColumnConstraint(colID: string, constraint: any) {
        const column = this.columns.get(colID);
        if (!column) {
            console.log(`Column ${colID} does not exist`);
            return;
        }
        column.constraints.push(constraint);
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
        // Swap and pop for O(1) deletion
        [constraintArr[idx], constraintArr[lastIdx]] = [constraintArr[lastIdx], constraint[idx]];
        constraintArr.pop();

    }
    
    addRow(row: RowData): void {
        const rowID: RowID = this.graveyard.length > 0
            ? this.graveyard.pop()!
            : this.rowCounter++
            ;
        this.rows.set(rowID, row);
    }

    removeRow(rowID: RowID): void {
        this.rows.delete(rowID);
        this.errorMap.delete(rowID);
        this.graveyard.push(rowID);
    }

    // ========= Validation =========

    generateUniqunessMap(colID: ColumnID): void{
        if (this.uniquenessMap.size > 0) return;
        else {
            
        }
    }
}