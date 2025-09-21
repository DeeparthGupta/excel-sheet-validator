import { ExcelRow, RelationSetting, Sheet, RelationConfig, Workbook } from "../types/types.js";


export default function validateInterSheetRelations(
    mainSheetName: string,
    sheets: Workbook,
    config: RelationConfig
): Map<string, Sheet>{
    //const extraMainRows: ExcelRow[] = [];
    const allOrphanKeys: Set<number> = new Set();
    const mainSheet = sheets.get(mainSheetName);
    // Return unmodified sheets. Todo: Throw exception instead
    if (!mainSheet) {
        console.log("Main Sheet name not found.");
        return sheets;
    }
    
    for (const [sheetName, sheet] of sheets.entries()) {
        if (sheetName !== mainSheetName) {
            const result = validateSheetRelation(
                mainSheet,
                sheet,
                config[sheetName] ?? { min: 0, max: -1 },
            );
            result["orphanKeys"].forEach((key: number) => allOrphanKeys.add(key));
        }
    }
    if (allOrphanKeys.size > 0) {
        const extraMainRows: ExcelRow[] = [];
        allOrphanKeys.forEach(key => {
            const emptyMainRow: ExcelRow = {
                [mainSheet.keyColumn]: key,
                _index: mainSheet.rows.length + extraMainRows.length,
                _sheetName: mainSheet.name,
                _valid: false,
                _errors: [mainSheet.keyColumn]
            };
            extraMainRows.push(emptyMainRow)
        });
        mainSheet.rows.push(...extraMainRows);
    }
    return sheets;
}

export function validateSheetRelation(
    mainSheet: Sheet,
    childSheet: Sheet,
    relation: RelationSetting,
): {[key: string]: any }{
    let errorCount: number = 0
    const result:{[key:string]:any} = {};
    const orphanedKeys = new Set<number>();
    const mainKeys = pluckfromRows(mainSheet.rows, mainSheet.keyColumn);
    const childIdRowMap = indexByRowID(childSheet.rows, childSheet.keyColumn); 
    
    // Mark all the orphaned chidlren as invalid
    const mainIDSet = new Set(mainKeys.map(Number));
    for (const [childKey, childRows] of childIdRowMap.entries()) {
        const childKeyNum = Number(childKey)
        if (!mainIDSet.has(childKeyNum)) {
            childRows.forEach(childRow => {
                childRow._valid = false;
                childRow._errors.push(childSheet.keyColumn);
            });
            // Add orphaned row keys to the return
            orphanedKeys.add(childKeyNum);
            // Prevent duplicate empty detections if multiple children share the same orphan key
            mainIDSet.add(childKey)
        }
    }

    for (const row of mainSheet.rows) {
        const mainKey = Number(row[mainSheet.keyColumn]);
        const relatedChildRows = childIdRowMap.get(mainKey) ?? [];
        const relatedChildRowCount = relatedChildRows.length;
        // Adding row count of related children to the main row
        row[childSheet.name] = String(relatedChildRowCount);

        if (relatedChildRowCount < relation.min) {
            row._valid = false;
            // Set all the chidlren to invalid too?
            /* if (relatedChildRowCount) {
                relatedChildRows.forEach(childRow => childRow._valid = false);
            } */
            continue;
        }

        else if ((relation.max !== -1) && relatedChildRowCount > relation.max) {
            row._valid = false;
            // Set all the children to invalid too?
            //relatedChildRows.forEach(childRow => childRow._valid = false);
            continue;
        }

        else {
            errorCount = relatedChildRows.filter(childRow => childRow._valid === false).length;
            if (errorCount > 0){
                row._valid = false;
            }
            row[`${childSheet.name}_errors`] = errorCount
        }
    }
    //result["errorCount"] = errorCount;
    result["orphanKeys"] = orphanedKeys;
    return result;    
}

function indexByRowID(rows: ExcelRow[], rowID: string): Map<number, ExcelRow[]> {
    const map = new Map<number, ExcelRow[]>();
    for (const row of rows) {
        const key = Number(row[rowID]);
        if (isNaN(key)) continue;

        if (!map.has(key)) map.set(key, []);
        
        map.get(key)!.push(row);
    }
    return map;
};

function pluckfromRows<K extends keyof ExcelRow>(
    rows: ExcelRow[],
    key: K
): ExcelRow[K][]{
    return rows.map(r => r[key]);
}