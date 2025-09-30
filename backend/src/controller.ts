import type { Request, Response } from "express";
import path from "path";
import { workbookToJson } from "./services/fileIngestorService.js";
import multer from "multer";
import { retrieveSheetFromWorkbook, retrieveWorkbookFromMemory, saveSheetInWorkbook, saveWorkbookToMemory } from "./services/SheetStorageService.js";
import { validateAllSheets, validateSheetData } from "./validation/validators.js";
import { fileURLToPath } from "url";
/* import { NoSQLDataSource, RDBMSDataSource } from "./db/data-sources.js";
import { CustomerPost } from "./db/CustomerPost.js";
import { CustomerMongo } from "./db/CustomerMongo.js"; */
import validateInterSheetRelations from "./validation/relationValidation.js";
import { ExcelRow, RelationConfig, RelationSetting, Sheet, Workbook } from "./types/types.js";
import fs from "fs";

/* export interface FileRequest extends Request {
  file: Express.Multer.File;
} */

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(currentDir, "..", "uploads");

// Multer setup to store files using file name
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir)
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage }).single("file");

export async function handleExcelUpload(req: Request, res: Response): Promise<void> {
    upload(req, res, async function (err: any) {
        const file = (req as Request & { file: Express.Multer.File }).file;
        if (!file) {
            res.status(400).json({ error: "No file uploaded" });
            return;
        }
        if (err) {
            res.status(500).json({ error: "File upload failed" });
            return;
        }

        try {
            const { workBookName, sheets } = await workbookToJson(file.path, []);
            const uniqueColumns = parseFormDataStrings(req.body, "uniqueColumns");
            const keyMaps = parseFormDataStrings(req.body, "keyMaps");
            const relations = parseFormDataStrings(req.body, "relations");
            const mainSheetName = req.body.mainSheet;

            const validatedSheets = validateAllSheets(sheets, uniqueColumns);  
            const testArtifactsDir = path.join(currentDir, "..", "testArtifacts");
            if (!fs.existsSync(testArtifactsDir)) {
                fs.mkdirSync(testArtifactsDir, { recursive: true });
            }
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const outFile = path.join(testArtifactsDir, `${workBookName}_${timestamp}-Intra.json`);
            const validatedSheetsObj = Object.fromEntries(validatedSheets)
            fs.writeFileSync(outFile, JSON.stringify(validatedSheetsObj, null, 2), "utf-8");

            if (relations && keyMaps) {
                //const mainSheetName: string = "Main Table";
                const sheetMap: Map<string, Sheet> = new Map();
                for (const [name, rows] of validatedSheets.entries()) {
                    sheetMap.set(name, {
                        name: name,
                        keyColumn: keyMaps[name],
                        rows:rows
                    });
                }
                
                const relationConfig: RelationConfig = Object.fromEntries(
                    Object.entries(relations).map(([sheetName, config]) => {
                        return [sheetName, config as RelationSetting];
                    })
                ); 

                //console.log(`Relation Config: ${JSON.stringify(relationConfig, null, 2)}`);
                
                const interValidatedSheets = validateInterSheetRelations(
                    mainSheetName, sheetMap, relationConfig
                );

                const outFile = path.join(testArtifactsDir, `${workBookName}_${timestamp}-PostValid.json`);
                const interValidatedSheetsObj = Object.fromEntries(interValidatedSheets)
                fs.writeFileSync(outFile, JSON.stringify(interValidatedSheetsObj, null, 2), "utf-8");

                saveWorkbookToMemory(workBookName, interValidatedSheets);
                const sheetNames = Array.from(interValidatedSheets.keys());
                const message = `${workBookName} ingested and validated. \n ${sheetNames.length} sheets found.`;
                //console.log(message);

                res.status(200).json({
                    message: message,
                    fileName: workBookName,
                    sheets: sheetNames
                });
                
                //console.log(`Saved sheets:`, Array.from(interValidatedSheets.keys()))

            } else {
                console.log("Relation config or KeyMaps are empty or undefined.");
                res.status(400).json({
                    error: "Relation config or KeyMaps are empty or undefined."
                })
            }
            

            //const data = retrieveObjectFromMemory(workBookName)
            //console.log(`Retrieved Keys: ${data ? Array.from(validatedSheets.keys()) : "No sheets seem to be saved"}`);

            // Write file to storage
            //await fs.writeFile(validatedFilePath, JSON.stringify(validatedData, null, 2), "utf-8");


        } catch (e) {
            res.status(500).json({
                error: "Injestion or validation failed",
                details: (e as Error).message
            });
        }

    });
}

export async function retrieveFileData(req: Request, res: Response) {
    const fileName = req.query.filename as string;
    const sheets = req.query.sheets as string[] | undefined | null;

    if (!fileName) {
        res.status(400).json({ error: "Invalid or missing file name" });
        return;
    }

    const data = retrieveWorkbookFromMemory(fileName);

    if (!data) {
        res.status(404).json({ error: "No data for given file name" });
        return;
    }

    let result: Workbook;

    if (!sheets || (Array.isArray(sheets) && sheets.length === 0)) {
        result = data
    } else {
        result = new Map<string, Sheet>();
        for (const sheetName of sheets) {
            const sheetData = data.get(sheetName);
            if (sheetData !== undefined) {
                result.set(sheetName, sheetData);
            }
        }
    }

    const outBoundData: Map<string, ExcelRow[]> = new Map();
    for (const [sheetName, sheetData] of result.entries()) {
        outBoundData.set(sheetName, sheetData.rows);
    }

    const dataObject = Object.fromEntries(outBoundData);
    //console.log(`Filename: ${fileName} \n dataObject: ${JSON.stringify(dataObject, null, 2)}`)
    const testArtifactsDir = path.join(currentDir, "..", "testArtifacts");
    if (!fs.existsSync(testArtifactsDir)) {
        fs.mkdirSync(testArtifactsDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outFile = path.join(testArtifactsDir, `${fileName}_${timestamp}-Inter.json`);
    fs.writeFileSync(outFile, JSON.stringify(dataObject, null, 2), "utf-8");
    res.status(200).json({
        message: "File data retrieved successfully.",
        filename: fileName,
        sheets: dataObject
    });
}

/* const rowToEntity = (row: any) => ({
    serial_number: row._index,
    customer_name: row["Customer Name"],
    number: row.Number ?? row.number,
    email: row.Email ?? row.email,
    time: row.Time ?? row.time,
}); */

export async function uploadToDatabase(req: Request, res: Response) {
    /* const fileName = req.query.filename as string;
    const db = req.path.includes("postgres") ? "postgres" : "mongodb";

    if (!fileName) {
        res.status(400).json({ error: "Invalid or missing file name" });
        return;
    }

    const data = retrieveObjectFromMemory(fileName);  

    if (!data) {
        res.status(404).json({ error: "Data not found" });
        return;
    }

    const validRecords = data.filter((row: any) => row._valid);

    if (!(validRecords.length > 0)) {
        res.status(400).json({ message: "No valid records to upload" });
        return;
    }

    try {
        let repo;
        if (db === "postgres") {
            if (!RDBMSDataSource.isInitialized) await RDBMSDataSource.initialize();
            repo = RDBMSDataSource.getRepository(CustomerMongo);
        }
        else {
            if (!NoSQLDataSource.isInitialized) await NoSQLDataSource.initialize();
            repo = NoSQLDataSource.getRepository(CustomerPost);
        }

        const entities = validRecords.map(rowToEntity).map(row => repo.create(row));
        await repo.insert(entities);
        
        res.status(200).json({
            message: `Successfully added ${entities.length} records to ${db}`
        })
    } catch (err) {
        res.status(500).json({
            error: "DB upload failed",
            details: (err as Error).message
        });
    } */
}

export async function revalidate(req: Request, res: Response) {
    //console.log("req.body:", req.body);
    const filename = req.body.filename;
    const mainSheetName = req.body.mainSheet;
    const sheetName = req.body.sheetName;
    const relationConfig = req.body.relationConfig;
    const uniqueColumns = req.body.uniqueColumns;
    const row = req.body.row;

    // Ensuring 

    if (!filename || !row || !sheetName) {
        res.status(400).json({ error: "Missing data or location" })
        return;
    }

    const sheet = retrieveSheetFromWorkbook(filename, sheetName);
    const mainSheet = retrieveSheetFromWorkbook(filename, mainSheetName);

    /* console.log(`Main Sheet: ${JSON.stringify(mainSheet, null, 2)} \n`);
    console.log(`Sheet: ${JSON.stringify(sheet, null, 2)} \n`);
    console.log(`Unique Columns: ${JSON.stringify(uniqueColumns, null, 2)} \n`) */;

    if (mainSheet && mainSheet !== undefined && sheet && sheet !== undefined && sheet.rows.length > 0 && row !== -1) {
        const sheetData = sheet.rows;
        const index = sheetData.findIndex(record => row._index === record._index);
        sheetData[index] = row;
        const validatedSheetRows = validateSheetData(sheetData as ExcelRow[], uniqueColumns[sheetName] ?? []);
        sheet.rows = validatedSheetRows;
        
        saveSheetInWorkbook(filename, sheetName, sheet)

        if (sheetName === mainSheetName) {
            mainSheet.rows.forEach(row => {
                // Check if the _error columns exist
                const errorColumns = Object.keys(row).filter(key => /_errors$/.test(key))
                const hasErrors = errorColumns.some(col => row[col] > 0);

                // Check if any of the unique colums exist
                const uniqueColumnKeys = uniqueColumns[mainSheetName]!;
                const missingKeys = uniqueColumnKeys.filter(key => !Object.keys(row).includes(key));

                row._valid = !hasErrors && missingKeys.length === 0;

                const rowID = Object.keys(row)[0] ?? "";
                row._errorCols = row._valid
                    ? []
                    : (missingKeys.length > 0 ? [rowID] : []);
            });

            res.status(200).json({ message: "Main sheet updated successfully" })
            return;
        }
        
        const sheetsToValidate: Workbook = new Map();
        sheetsToValidate.set(sheet.name, sheet);
        sheetsToValidate.set(mainSheet.name, mainSheet);


        //console.log("sheetsToValidate:", Array.from(sheetsToValidate.keys()));

        const interValidatedSheets = validateInterSheetRelations(mainSheetName, sheetsToValidate, relationConfig);
        for (const [sheetName, sheetData] of interValidatedSheets.entries()) {
            saveSheetInWorkbook(filename, sheetName, sheetData);
        }

        res.status(200).json({ message: "File changes saved" });
    } else {
        res.status(400).json({ error: "File data could not be modified" });
        console.log("Main Sheet issue?");
        return;
    }
}

function parseFormDataStrings(body: any, fieldname: string) {
    const formData = body[fieldname];
    let result;
    if (typeof formData === "string") {
        try {
            result = JSON.parse(formData);
        } catch (e) {
            console.log(`Unable to parse ${fieldname}`)
            return undefined
        }
    }
    return result;
}