import { createWriteStream } from "fs";
import { promises as fs } from "fs";
import { getXlsxStream } from "xlstream";
import path from "path";


export async function convertExcelToJson(
    inputPath: string,
    outputDir: string,
    deleteSource: boolean = false
): Promise<string> {
    const fileName = path.basename(inputPath, path.extname(inputPath)) + "_injested" + ".json";;
    const outputPath = path.join(outputDir, fileName);

    const stream = await getXlsxStream({
        filePath: inputPath,
        sheet: 0,
        withHeader: true
    });

    return new Promise((resolve, reject) => {
        const ws = createWriteStream(outputPath, { encoding: "utf-8" });
        let headers: string[] = [];
        let isFirst = true;
        let rowIndex = 0

        ws.write("["); // start JSON array

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

            rowObj.index = rowIndex++;

            ws.write((isFirst ? "" : ",") + JSON.stringify(rowObj));
            isFirst = false;
        });

        stream.on("end", async () => {
            ws.end("]"); // end JSON array
            try {
                if (deleteSource) await fs.unlink(inputPath); // delete source file
                resolve(outputPath); //Return path to json file
            } catch (err) {
                reject(err);
            }
        });

        stream.on("error", (err) => reject(err));
        ws.on("error", (err) => reject(err));
    });
}
