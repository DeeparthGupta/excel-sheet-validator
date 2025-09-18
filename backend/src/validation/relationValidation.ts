import { chdir } from "process";
import { ExcelRow, Sheet, TableKey } from "../types/types.js";
import { RelationConfig } from "../types/types.js";

function indexByRowID(rows: ExcelRow[], rowID:string): Map<string, ExcelRow[]> {
    const map = new Map<string, ExcelRow[]>();
    for (const row of rows) {
        if (!map.has(row[rowID])) map.set(row[rowID], []);
        map.get(row[rowID])!.push(row);
    }
    return map;
};

export default function validateInterSheetRelations(
    sheets: Map<string, ExcelRow[]>,
    config: RelationConfig
): Map<string, ExcelRow[]>{
    const mainRows = sheets.get(config.mainSheet.name) ?? [];
    const oneToOneRows = config.oneToOne ? sheets.get(config.oneToOne.childTable.name) ?? [] : [];
    const oneToManyRows = config.oneToMany ? sheets.get(config.oneToMany.childTable.name) ?? [] : [];
    const zeroToManyRows = config.zeroToMany ? sheets.get(config.zeroToMany.childTable.name) ?? [] : [];

    const oneToOneMap = config.oneToOne ? indexByRowID(oneToOneRows, config.oneToOne.childTable.keyColumn) : new Map();
    const oneToManyMap = config.oneToMany ? indexByRowID(oneToManyRows, config.oneToMany.childTable.keyColumn): new Map();
    const zeroToManyMap = config.zeroToMany ? indexByRowID(zeroToManyRows, config.zeroToMany.childTable.keyColumn) : new Map();

    //debug
    /* console.log("Main row IDs:", mainRows.map(r => r[config.mainSheet.rowID]));
    if (config.oneToMany) {
        console.log("OneToMany map keys:", Array.from(oneToManyMap.keys()));
    }
    if (config.zeroToMany) {
        console.log("ZeroToMany map keys:", Array.from(zeroToManyMap.keys()));
    }
    if (config.oneToOne) {
        console.log("OneToOne map keys:", Array.from(oneToOneMap.keys()));
    } */

    // Validate One to one relationship
    if (config.oneToOne) {
        for (const mainRow of mainRows) {
            const mainKey = mainRow[config.mainSheet.keyColumn];
            //console.log(`Looking up child rows for mainKey:`, mainKey);
            const childRows = oneToOneMap.get(mainKey) ?? [];
            const childCount = childRows.length;
            // Get number of child rows in the corresponding sheet with the name rowID
            mainRow[config.oneToOne.childTable.keyColumn] = childCount;
            if (childRows.length !== 1) {
                mainRow._valid = false;
                childRows.forEach(row => {
                    row._valid = false;
                });
            }
            else if (childRows[0]?._valid === false) {
                mainRow._valid = false;
            }
        }
    }

    // Validate One to Many relationship
    if (config.oneToMany) {
        for (const mainRow of mainRows) {
            const mainKey = mainRow[config.mainSheet.keyColumn];
            //console.log(`Looking up child rows for mainKey:`, mainKey);
            const childRows = oneToManyMap.get(mainKey) ?? [];
            const childCount = childRows.length;
            mainRow[config.oneToMany.childTable.keyColumn] = childCount;
            if (childRows.length < 1) {
                mainRow._valid = false;
                childRows.forEach(row => {
                    row._valid = false;
                });
            }
            childRows.forEach(row => {
                if (row._valid === false) mainRow._valid = false;
            })
        }
    }

    // Propagate errors from Zero to many sheet
    if (config.zeroToMany) {
        for (const mainRow of mainRows) {
            const mainKey = mainRow[config.mainSheet.keyColumn];
            //console.log(`Looking up child rows for mainKey:`, mainKey);
            const childRows = zeroToManyMap.get(mainKey) ?? [];
            const childCount = childRows.length;
            mainRow[config.zeroToMany.childTable.keyColumn] = childCount;
            childRows.forEach(row => {
                if (row._valid === false) mainRow._valid = false;
            });
        }
    }
    
    /* console.log(`\n Main Rows: ${JSON.stringify(mainRows,null,2)}`);
    console.log(`\n Num of main rows: ${mainRows.length}`); */
    // Update sheets
    sheets.set(config.mainSheet.name, mainRows);
    if (config.oneToOne) sheets.set(config.oneToOne.childTable.name, oneToOneRows);
    if (config.oneToMany) sheets.set(config.oneToMany.childTable.name, oneToManyRows);
    if (config.zeroToMany) sheets.set(config.zeroToMany.childTable.name, zeroToManyRows);

    return sheets;
}

function validateSheetRelation(
    mainSheet: Sheet,
    childSheet: Sheet,
    relation: "oneToOne" | "oneToMany",
    connection: boolean
): void{
    /* const mainKeys = pluckfromRows(mainSheet.rows, mainSheet.keyColumn);
    const childKeys = pluckfromRows(childSheet.rows, childSheet.keyColumn); */
    const mainIdRowMap = indexByRowID(mainSheet.rows, mainSheet.keyColumn);
    const childIdRowMap = indexByRowID(childSheet.rows, childSheet.keyColumn);

    if (connection) {
        /* if (mainKeys.length < childKeys.length) {
            const missingKeys = mainKeys.filter(e => !childKeys.includes(e));
            missingKeys.forEach()
        } */
        
        
        
        for (const row of mainSheet.rows) {
            const mainKey = row[mainSheet.keyColumn];
            const relatedChildRows = childIdRowMap.get(mainKey) ?? [];
            const relatedChildRowCount = relatedChildRows.length;

            if (relatedChildRowCount < 1) {
                row._valid = false;
            } 
            else if (relation === "oneToOne" && relatedChildRowCount > 1) {
                row._valid = false;
                for (const child of relatedChildRows) {
                    child._valid = false;
                }
            }
        }
    }
    
}

function pluckfromRows<K extends keyof ExcelRow>(
    rows: ExcelRow[],
    key: K
): ExcelRow[K][]{
    return rows.map(r => r[key]);
}