//import { createWriteStream } from "fs";
import { promises as fs } from "fs";
import { getXlsxStream } from "xlstream";
//import path from "path";  

export async function convertExcelToJson(
    inputPath: string,
    deleteSource: boolean = false,
    outputDir?: string
): Promise<{ outputPath: string, data: Record<string, any>[] }> {
    //const fileName = path.basename(inputPath, path.extname(inputPath)) + "-injested" + `-${Date.now()}` +".json";
    //const outputPath = path.join(outputDir, fileName);

    const stream = await getXlsxStream({
        filePath: inputPath,
        sheet: 0,
        withHeader: true
    });

    return new Promise((resolve, reject) => {
        //const ws = createWriteStream(outputPath, { encoding: "utf-8" });
        let headers: string[] = [];
        let isFirst = true;
        let rowIndex = 0;
        let data:Record<string,any>[] = [];

        //ws.write("["); // start JSON array

        stream.on("data", ({ formatted, header }) => {
            if (headers.length === 0) {
                if (header && header.length > 0) {
                    headers = header;
                }
                else if (formatted.obj) {
                    headers = Object.keys(formatted.obj)
                }
            }

            if (!headers.length) {
                return;
            }

            const rowObj: Record<string, any> = headers.reduce((acc, key) => {
                acc[key] = formatted.obj[key] ?? null;
                return acc;
            }, {});
            
            // Add extra keys
            rowObj._index = rowIndex++;
            rowObj._valid = null;
            rowObj._errors = [];

            //ws.write((isFirst ? "" : ",") + JSON.stringify(rowObj));
            isFirst = false;

            data.push(rowObj);
        });

        stream.on("end", async () => {
            //ws.end("]"); // end JSON array
            try {
                if (deleteSource) await fs.unlink(inputPath); // delete source file
                //resolve({outputPath, data}); //Return path and data to json file
                return data;
            } catch (err) {
                reject(err);
            }
        });

        stream.on("error", (err) => reject(err));
        //ws.on("error", (err) => reject(err));
    });
}
