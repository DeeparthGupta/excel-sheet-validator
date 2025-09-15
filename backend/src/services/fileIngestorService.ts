import { getWorksheets, getXlsxStream, } from "xlstream";
import path, { extname } from 'path';

export type ExcelRow = Record<string, any> & {
  _index: number;
  _sheetName: string;
  _valid: boolean | null;
  _errors: string[];
};

export type jsonWorkbook = {
    workBookName: string;
    sheets: Map<string, ExcelRow[]>
}

export async function workbookToJson(
    inputPath: string,
    sheetNames: string[] = [] // Process specific sheets else process all
): Promise<jsonWorkbook> {
    const workBookName = path.basename(inputPath, extname(inputPath));
    const result: Map<string, ExcelRow[]> = new Map();

    const sheetsToSteam = (await getWorksheets({ filePath: inputPath }))
        .filter(s => !sheetNames.length || sheetNames.includes(s.name))
    
    for (const sheetObject of sheetsToSteam) {
        const sheetName: string = sheetObject.name;
        result[sheetName] = [];

        const stream = await getXlsxStream({
            filePath: inputPath,
            sheet: sheetName,
            withHeader: true
        })

        let headers: string[] = [];
        let rowIndex = 0;

        for await (const row of stream) {
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

            if (!headers.length) continue;

            // Build row Object
            const rowObj: ExcelRow = headers.reduce((acc, key, colIndex) => {
                acc[key] = formatted.obj.key ?? formatted[colIndex] ?? null;
                return acc;
            }, {} as ExcelRow);

            rowObj._index = rowIndex++;
            rowObj._sheetName = sheetName;
            rowObj._valid = null;
            rowObj._errors = [];

            result[sheetName].push(rowObj);
        }
    }
    return { workBookName, sheets:result };
}