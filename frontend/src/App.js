import { useEffect, useState } from "react";
import FileUploadComponent from "./components/FileUploadComponent";
import DataTableComponent from "./components/DataTableComponent";
import DBUploadComponent from "./components/DBUploadComponent";
import { revalidate, retrieveData, processDataForFrappe } from "./utils";

function App() {
	const [result, setResult] = useState("");
	const [uploading, setUploading] = useState(false);
	const [data, setData] = useState([]);
	const [columns, setColumns] = useState([]);
	const [filename, setFileName] = useState("");
	const [filteredRows, setFilteredRows] = useState([]);
	const [showFilter, setShowFilter] = useState(null);
	
	const targetServer = process.env.REACT_APP_TARGET_SERVER || "http://localhost:3001";

	const filterRows = (isValid) => {
		setShowFilter(isValid);
		const filtered = data.filter(row => row._valid === isValid);     
		setFilteredRows(filtered);
	};

	const showAllRows = () => {
		setShowFilter(null);
		setFilteredRows(data);
	};
	
	const handleRevalidation = async (modrow) => {
		const { success, message } = await revalidate(modrow, filename, targetServer);
		setResult(message);
		if (success) {
			const { data, message: retrievalMessage } = await retrieveData(filename, targetServer);
			setData(data);
			setResult(retrievalMessage);
		}
	};

	// Get uploaded file data using the filename sent in response to upload
	useEffect(() => {
		if (filename) {
			(async () => {
				const { data, message } = await retrieveData(filename, targetServer);
				setData(data);
				setResult(message);
			})();
		}
	}, [filename, targetServer]);

	// Process the data into headers and array
	useEffect(() => {
		if (data.length > 0 && Array.isArray(data)) {
			const { columns, filteredRows } = processDataForFrappe(data, []);
			setColumns(columns);
			setFilteredRows(filteredRows);
		}
	}, [data]);


	return (
		<div style={{ maxWidth: 600, display:"flex" }}>
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
			{Array.isArray(filteredRows) && filteredRows.length > 0 &&
			 Array.isArray(columns) && columns.length > 0 && (
				<div style={{ marginTop: 24 }}>
					<h4>Sheet Contents</h4>
					<DataTableComponent
						rows={filteredRows}
						columns={columns}
						revalidate={handleRevalidation}
					/>
					<div style={{ marginBottom: 12 }}>
                        <button onClick={showAllRows} disabled={showFilter === null} style={{ marginRight: 8 }}>Show All</button>
                        <button onClick={() => filterRows(true)} disabled={showFilter === true} style={{ marginRight: 8 }}>Show Valid</button>
						<button onClick={() => filterRows(false)} disabled={showFilter === false} style={{ marginRight: 8 }}>Show Invalid</button>
					</div>					
				</div>
			)}
		</div>
	);
}

export default App;