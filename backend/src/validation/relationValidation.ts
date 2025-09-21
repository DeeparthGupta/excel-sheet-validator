import { ExcelRow, RelationSetting, Sheet, RelationConfig } from "../types/types.js";


export default function validateInterSheetRelations(
    mainSheetName: string,
    sheets: Map<string,Sheet>,
    config: RelationConfig
): Map<string, Sheet>{
    const extraMainRows: ExcelRow[] = [];
    const mainSheet = sheets.get(mainSheetName);
    // Return unmodified sheets. Todo: Throw exception instead
    if (!mainSheet) return sheets;
    
    for (const [sheetName, sheet] of sheets) {
        if (sheetName !== mainSheetName) {
            const result = validateSheetRelation(
                mainSheet,
                sheet,
                config.sheetname ?? { min: 0, max: -1 },
            );
            extraMainRows.push(...result["extraRows"]);
        }
    }
    if (extraMainRows && extraMainRows.length > 0) mainSheet.rows.push(...extraMainRows);
    return sheets;
}

export function validateSheetRelation(
    mainSheet: Sheet,
    childSheet: Sheet,
    relation: RelationSetting,
): {}{
    let errorCount: number = 0
    const result = {};
    const newMainRows: ExcelRow[] = [];
    const mainKeys = pluckfromRows(mainSheet.rows, mainSheet.keyColumn);
    const childIdRowMap = indexByRowID(childSheet.rows, childSheet.keyColumn); 
    
    // Mark all the orphaned chidlren as invalid
    const mainIDSet = new Set(mainKeys.map(String));
    for (const [childKey, childRows] of childIdRowMap.entries()) {
        if (!mainIDSet.has(childKey)) {
            childRows.forEach(childRow => {
                childRow._valid = false;
                childRow._errors.push(childSheet.keyColumn);
            });

            // Add empty rows corresponding to the orphaned children
            const emptyMainRow: ExcelRow = {
                [mainSheet.keyColumn]: childKey,
                _index: mainSheet.rows.length,
                _sheetName: mainSheet.name,
                _valid: false,
                _errors: [mainSheet.keyColumn]
            }
            
            // Add to the main rows at the end after processing.
            newMainRows.push(emptyMainRow);
            // Prevent duplicate empty rows if multiple children share the same orphan key
            mainIDSet.add(childKey)
        }
    }

    for (const row of mainSheet.rows) {
        const mainKey = row[mainSheet.keyColumn];
        const relatedChildRows = childIdRowMap.get(mainKey) ?? [];
        const relatedChildRowCount = relatedChildRows.length;

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
                if (!mainSheet.problemChildren) mainSheet.problemChildren = new Map<string, number>();
                mainSheet.problemChildren.set(childSheet.name, errorCount);
            }
        }
    }
    result["errorCount"] = errorCount;
    result["extraMainRows"] = newMainRows;
    return result;    
}

function indexByRowID(rows: ExcelRow[], rowID:string): Map<string, ExcelRow[]> {
    const map = new Map<string, ExcelRow[]>();
    for (const row of rows) {
        if (!map.has(row[rowID])) map.set(row[rowID], []);
        map.get(row[rowID])!.push(row);
    }
    return map;
};

function pluckfromRows<K extends keyof ExcelRow>(
    rows: ExcelRow[],
    key: K
): ExcelRow[K][]{
    return rows.map(r => r[key]);
}