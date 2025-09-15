import { ExcelRow } from "../types/types.js";
import { RelationConfig } from "../types/types.js";

function indexByRowID(rows: ExcelRow[], rowID:string) {
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
    const oneToOneRows = config.oneToOne ? sheets.get(config.oneToOne.name) ?? [] : [];
    const oneToManyRows = config.oneToMany ? sheets.get(config.oneToMany.name) ?? [] : [];
    const zeroToManyRows = config.zeroToMany ? sheets.get(config.zeroToMany.name) ?? [] : [];

    const oneToOneMap = config.oneToOne ? indexByRowID(oneToOneRows, config.oneToOne.rowID) : new Map();
    const oneToManyMap = config.oneToMany ? indexByRowID(oneToManyRows, config.oneToMany.rowID): new Map();
    const zeroToManyMap = config.zeroToMany ? indexByRowID(zeroToManyRows, config.zeroToMany.rowID) : new Map();

    // Validate One to one relationship
    if (config.oneToOne) {
        for (const mainRow of mainRows) {
            const mainKey = mainRow[config.mainSheet.rowID];
            const childRows = oneToOneMap.get(mainKey) ?? [];
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
            const mainKey = oneToManyRows[config.mainSheet.rowID];
            const childRows = oneToManyMap.get(mainKey) ?? [];
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
        const mainKey = oneToManyRows[config.mainSheet.rowID];
        for (const mainRow of mainRows) {
            const childRows = zeroToManyMap.get(mainKey) ?? [];
            childRows.forEach(row => {
                if (row._valid === false) mainRow._valid = false;
            });
        }
    }

    // Update sheets
    sheets.set(config.mainSheet.name, mainRows);
    if (config.oneToOne) sheets.set(config.oneToOne.name, oneToOneRows);
    if (config.oneToMany) sheets.set(config.oneToMany.name, oneToManyRows);
    if (config.zeroToMany) sheets.set(config.zeroToMany.name, zeroToManyRows);

    return sheets;
}