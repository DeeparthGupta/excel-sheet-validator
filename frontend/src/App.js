import { useEffect, useRef, useState } from "react";
import FileUploadComponent from "./components/FileUploadComponent";
import DBUploadComponent from "./components/DBUploadComponent";
import { revalidate, retrieveData, dataDiff } from "./utils";
import SheetTabs from "./components/SheetTabs";


function App() {
	const [result, setResult] = useState("");
	const [uploading, setUploading] = useState(false);
	const [data, setData] = useState({});
	const [filename, setFileName] = useState("");
	const gridRefs = useRef({});

	const keyColumnMapping = {
		"Main Table": "RowNumber",
		"contactPerson (oneToOne)": "MaintableRowNumber",
		"BankAccounts (oneToMany)": "MaintableRowNumber",
		"Addresses (ZeroToMany)": "MaintableRowNumber"
	}

	const relationPresets = {
		oneToOne: { min: 1, max: 1 },
		oneToMany: { min: 1, max: -1 },
		zeroToMany: { min: 0, max: -1 },
		zeroOrOne: { min: 0, max: 1 }
	}
	const uniqueColumns = {
		"Main Table": ["Number", "Email"],
		"Addresses (ZeroToMany)": ["Street", "Street2", "City", "State", "Pincode", "Country"],
		"contactPerson (oneToOne)": ["Contact Person Name", "Mobile Number", "Email Address"],
		"BankAccounts (oneToMany)":["Bank Account IFSC","Account Number","IBAN"]
	}

	const tempRelationConfig = {
		"Addresses (ZeroToMany)": relationPresets.oneToMany,
		"contactPerson (oneToOne)": relationPresets.oneToOne,
		"BankAccounts (oneToMany)": relationPresets.oneToMany
	}
	
	const targetServer = process.env.REACT_APP_TARGET_SERVER || "http://localhost:3001";
	const excludedFields = ["_valid", "_index", "_errors", "_sheetName"];


	const handleCellValueChange = async (params, sheetName) => {
		const editedRow = params.data;
		const { success, message } = await revalidate(editedRow, filename, uniqueColumns, targetServer, sheetName, tempRelationConfig);
		setResult(message);
		if (success) {
			const { data: newData, message: retrievalMessage } = await retrieveData(filename, targetServer);
			const changedRows = dataDiff(data, newData);
			//console.log(`Changed Rows: ${JSON.stringify(changedRows, null, 2)}`);

			Object.keys(changedRows).forEach(sheet => {
				const gridRef = gridRefs.current[sheet];
				if (gridRef && gridRef.api && changedRows.length > 0) {
					gridRef.api.applyTransaction({ update: changedRows });
				}
			});
			
			setResult(retrievalMessage);
			setData(newData);
		}
	};

/* 	const filterGrid = (model = null) => {
		if (gridRef.current && gridRef.current.api) {
			gridRef.current.api.setFilterModel(model);
			setFilter(model);
		}
	};

	const isSameModel = (model) => JSON.stringify(filter) === JSON.stringify(model); */

	const relationConfigTranslation = Object.fromEntries(
		Object.entries(tempRelationConfig).map(([sheet, preset]) => {
			return [sheet, { ...preset }];
		})	
	);

	// Get uploaded file data using the filename sent in response to upload
	useEffect(() => {
		if (filename) {
			(async () => {
				const { fileName, data, message } = await retrieveData(filename, targetServer);
				console.log(`Filename: ${fileName}\n`);
				console.log(`Data: ${JSON.stringify(data, null, 2)}`);
				setData(data);
				setResult(message);
			})();
		}
	}, [filename, targetServer]);


	return (
		<div style={{ maxWidth: "100%", display:"flex" }}>
			<h2>Upload Excel File</h2>
			<FileUploadComponent
				targetServer={targetServer}
				setUploading={setUploading}
				setFileName={setFileName}
				uploading={uploading}
				setResult={setResult}
				keyColumnMapping={keyColumnMapping}
				uniqueColumns={uniqueColumns}
				relations={relationConfigTranslation}
			/>
			<pre style={{ background: "#f4f4f4", padding: 16, marginTop: 24 }}>{result}</pre>
			<DBUploadComponent
				filename={filename}
				targetServer={targetServer}
			/>
			{Object.keys(data).length > 0 && (
				<div style={{ marginTop: 24 }}>
					<SheetTabs
						data={data}
						gridRefs={gridRefs}
						excludedFields={excludedFields}
						onCellValueChanged={handleCellValueChange}
					/>
				</div>
			)}
		</div>
	);
}

export default App;