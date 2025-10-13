import { getWorksheets, getXlsxStream, } from "xlstream";
import path, { extname } from 'path';
import { ExcelRow, JSONWorkBook } from "../types/types.js";


export async function workbookToJson(
    inputPath: string,
    sheetNames: string[] = [], // Process specific sheets else process all
    skipRows: number[] | number | undefined
): Promise<JSONWorkBook> {
    const workBookName = path.basename(inputPath, extname(inputPath));
    const result: Map<string, ExcelRow[]> = new Map();

    const sheetsToStream = (await getWorksheets({ filePath: inputPath }))
        .filter(s => !sheetNames.length || sheetNames.includes(s.name))
    
    const skipSet:Set<number> = skipRows !== undefined
        ? new Set(Array.isArray(skipRows) ? skipRows : [skipRows])
        : new Set<number>();
    
    for (const sheetObject of sheetsToStream) {
        const sheetName: string = sheetObject.name;
        result.set(sheetName, []);

        const stream = await getXlsxStream({
            filePath: inputPath,
            sheet: sheetName,
            ignoreEmpty:true,
            withHeader: true
        })

        let headers: string[] = [];
        let rowIndex = 0;

        for await (const row of stream) {
            if (skipSet.has(rowIndex)) {
                rowIndex++;
                continue;
            }

            const { formatted, header } = row;

            if (headers.length === 0) {
                if (header && header.length > 0) headers = header
                else if (formatted.obj) headers = Object.keys(formatted.obj);
                else {
                    const maxCols = Math.max(...Object.values(formatted).map((value: any) => value.length || 0));
                    headers = Array.from({ length: maxCols }, (_, i) =>
                        String.fromCharCode(65 + i)
                    ); // Generate A,B,C... if no headers
                }
            }

            if (!headers.length) {
                rowIndex++;
                continue;
            }

            // Build row Object
            const rowObj: ExcelRow = headers.reduce((acc, key, colIndex) => {
                acc[key] = formatted.obj?.[key] ?? formatted[colIndex] ?? null;
                return acc;
            }, {} as ExcelRow);

            rowObj._index = rowIndex++;
            rowObj._sheetName = sheetName;
            rowObj._valid = null;
            rowObj._errorCols = [];

            result.get(sheetName)!.push(rowObj);
        }
    }
    //console.log(`Sheets: ${result}`);
    return { workBookName, sheets:result };
}