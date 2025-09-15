import { useEffect, useRef, useState } from "react";
import FileUploadComponent from "./components/FileUploadComponent";
import DataTableComponent from "./components/DataTableComponent";
import DBUploadComponent from "./components/DBUploadComponent";
import { revalidate, retrieveData, dataDiff } from "./utils";


function App() {
	const [result, setResult] = useState("");
	const [uploading, setUploading] = useState(false);
	const [data, setData] = useState({});
	const [filename, setFileName] = useState("");
	const [filter, setFilter] = useState("all");
	const gridRef = useRef();
	
	const targetServer = process.env.REACT_APP_TARGET_SERVER || "http://localhost:3001";

	const excludedFields = ["_valid", "_index", "_errors", "_sheetName"];

	/* const allModel = null;
	const validModel = { _valid: { filterType: "set", values: [true] } };
	const invalidModel = { _valid: { filterType: "set", values: [false] } };
 */
	const handleCellValueChange = async params => {
		const editedRow = params.data;
		const { success, message } = await revalidate(editedRow, filename, targetServer);
		setResult(message);
		if (success) {
			const { data: newData, message: retrievalMessage } = await retrieveData(filename, targetServer);
			const changedRows = dataDiff(data, newData);
			//console.log(`Changed Rows: ${JSON.stringify(changedRows, null, 2)}`);

			if (gridRef.current && gridRef.current.api && changedRows.length > 0) {
				gridRef.current.api.applyTransaction({ update: changedRows });
				/* changedRows.forEach(row => {
					const node = gridRef.current.api.getRowNode(String(row._index));
					if (node) gridRef.current.api.refreshCells({ rowNodes: [node], force: true });
				}); */
				//gridRef.current.api.redrawRows();
			}

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

	// Get uploaded file data using the filename sent in response to upload
	useEffect(() => {
		if (filename) {
			(async () => {
				const { data, message } = await retrieveData(filename, targetServer);
				console.log(data);
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
			/>
			<pre style={{ background: "#f4f4f4", padding: 16, marginTop: 24 }}>{result}</pre>
			<DBUploadComponent
				filename={filename}
				targetServer={targetServer}
			/>
			{Array.isArray(data) && data.length > 0 &&(
				<div style={{ marginTop: 24 }}>
					<h4>Sheet Contents</h4>
					<DataTableComponent
						rows={data}
						tableRef={gridRef}
						excludedFields={excludedFields}
						onCellValueChanged={handleCellValueChange}
						filterMode={filter}
					/>
					<div style={{ marginBottom: 12 }}>
						<button
							onClick={() => setFilter("all")}
							disabled={filter === "all"}
							style={{ marginRight: 8 }}
						>
							Show All
						</button>
						<button
							onClick={() => setFilter("valid")}
							disabled={filter === "valid"}
							style={{ marginRight: 8 }}
						>
							Show Valid
						</button>
						<button
							onClick={() => setFilter("invalid")}
							disabled={filter === "invalid"}
							style={{ marginRight: 8 }}
						>
							Show Invalid
						</button>
					</div>					
				</div>
			)}
		</div>
	);
}

export default App;