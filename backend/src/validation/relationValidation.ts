import { ExcelRow } from "../types/types.js";
import { RelationConfig } from "../types/types.js";

export default function validateInterSheetRelations(
    sheets: Map<string, ExcelRow[]>,
    config: RelationConfig
): Map<string, ExcelRow[]>{
    const mainRows = sheets.get(config.mainSheet) ?? [];
    const oneToOneRows = config.oneToOne ? sheets.get(config.oneToOne) ?? [] : [];
    const oneToManyRows = config.oneToMany ? sheets.get(config.oneToMany) ?? [] : [];
    const zeroToManyRows = config.zeroToMany ? sheets.get(config.zeroToMany) ?? [] : [];

    const indexByRowID = (rows: ExcelRow[]) => {
        const map = new Map<string, ExcelRow[]>();
        for (const row of rows) {
            if (!map.has(row.rowID)) map.set(row.rowID, []);
            map.get(row.rowID)!.push(row);
        }
        return map;
    };

    const oneToOneMap = indexByRowID(oneToOneRows);
    const oneToManyMap = indexByRowID(oneToManyRows);
    const zeroToManyMap = indexByRowID(zeroToManyRows);

    // Validate One to one relationship
    if (config.oneToOne) {
        for (const mainRow of mainRows) {
            const childRows = oneToOneMap.get(mainRow.rowID) ?? [];
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
            const childRows = oneToManyMap.get(mainRow.rowID) ?? [];
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
            const childRows = zeroToManyMap.get(mainRow.rowID) ?? [];
            childRows.forEach(row => {
                if (row._valid === false) mainRow._valid = false;
            });
        }
    }

    // Update sheets
    sheets.set(config.mainSheet, mainRows);
    if (config.oneToOne) sheets.set(config.oneToOne, oneToOneRows);
    if (config.oneToMany) sheets.set(config.oneToMany, oneToManyRows);
    if (config.zeroToMany) sheets.set(config.zeroToMany, zeroToManyRows);

    return sheets;
}