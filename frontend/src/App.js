import React, { useEffect, useRef, useState } from "react";
import "frappe-datatable/dist/frappe-datatable.min.css";
import DataTable from "frappe-datatable";

function App() {
	const fileInputRef = useRef();
	const tableRef = useRef();
  	const [result, setResult] = useState("");
  	const [uploading, setUploading] = useState(false);
  	const [data, setData] = useState([]);
	const [columns, setColumns] = useState([]);
	const [filename, setFileName] = useState("");
	const [rows, setRows] = useState([]);
	const [filteredRows, setFilteredRows] = useState([]);
	const [showFilter, setShowFilter] = useState(null);
	const [uploadTarget, setuploadTarget] = useState("postgres");
	const [uploadDbResult, setUploadDbResult] = useState("");


  	const fileUpload = async () => {
		const file = fileInputRef.current.files[0];
		if (!file) {
	  		alert("Please select a file.");
	  		return;
		}
		const formData = new FormData();
		formData.append("file", file);

		setUploading(true);
		setResult("Uploading...");

		try {
	  		const response = await fetch("http://localhost:3001/upload", {
				method: "POST",
				body: formData,
	  		});
			const responseData = await response.json();

			if (response.ok && responseData.fileName) {
				setFileName(responseData.fileName);
				console.log(`File Name: ${responseData.fileName}`);
			}

		} catch (err) {
	  		setResult("Upload failed: " + err);
		} finally {
			setUploading(false);
			setResult("Upload Successful");
		}
  	};

	const retrieveData = async (filename) => {
		try {
			const response = await fetch(`http://localhost:3001/retrieve?filename=${filename}`);
			const responseData = await response.json();

			if (response.ok && responseData.data.length > 0) {
				setData(responseData.data);
				setResult("Data retrieved");
			} else {
				setResult("Failed to retrieve data:" + response.error);
			}
		} catch (err) {
			setResult("Unable to retrieve data:" + err);
		}
	}

	const processDataForFrappe = (data,hiddenColumns) => {
		const columns = Object.keys(data[0] || {})
			.filter(key => !hiddenColumns.includes(key))
			.map((key) => ({
				name: key,
				editable: true,
				id: key,
			}));

		const rows = data.map(row =>
			columns.map(col =>
				String(row[col.id] ?? "")
			)
		);
		
		console.log("Columns:", JSON.stringify(columns,null,2));
		console.log("Rows:", JSON.stringify(rows,null,2));

		setColumns(columns);
		setRows(rows);
		setFilteredRows(rows)
	}

	const filterRows = (isValid) => {
        setShowFilter(isValid);
        const filtered = data
            .filter(row => row.valid === isValid)
            .map(row =>
                columns.map(col =>
                    String(row[col.id] ?? "")
                )
            );
        setFilteredRows(filtered);
	};
	
	const showAllRows = () => {
        setShowFilter(null);
        setFilteredRows(rows);
	};
	
	const dbSelection = (e) => {
		setuploadTarget(e.target.value);
	}

	const uploadToDB = async () => {
		const endpoint = uploadTarget === "postgres"
			? "http://localhost:3001/uploadpostgres"
			: "http://localhost:3001/uploadmongodb";
		
		try {
			const response = await fetch(`${endpoint}?filename=${filename}`);
			if (response.ok) {
                setUploadDbResult(`Upload to ${uploadTarget} successful: ${data.message || ""}`);
            } else {
                setUploadDbResult(`Upload failed: ${data.error}`);
            }
		} catch (err) {
			setUploadDbResult(`Failed to sent do DB: ${err}`);
		}
	}

	useEffect(() => {
		if (filename) {
			retrieveData(filename);
		}
	}, [filename]);
	
	useEffect(() => {
		if (data.length > 0) {
			processDataForFrappe(data, ["index", "errors", "valid"]);
		}
	}, [data]);

	useEffect(() => {
		if (columns.length > 0 && tableRef.current) {
			tableRef.current.innerHTML = "";

			new DataTable(tableRef.current, {
				columns: columns,
				data:filteredRows
			});
		}
	},[filteredRows,columns]);


	return (
		<div style={{ maxWidth: 600, display:"flex" }}>
			<h2>Upload Excel File</h2>
			<input type="file" ref={fileInputRef} disabled={uploading} accept=".xlsx" />
			<button onClick={fileUpload} disabled={uploading} style={{ marginLeft: 8, border:"1px solid #000" }}>
				{uploading ? "Uploading..." : "Upload"}
			</button>
			<pre style={{ background: "#f4f4f4", padding: 16, marginTop: 24 }}>{result}</pre>
			<div style={{margin: "16px 0"}}>
						<label>
							<input 
								type="radio"
                        		name="uploadTarget"
                        		value="postgres"
                        		checked={uploadTarget === "postgres"}
								onChange={dbSelection}
							/>
							Upload to Postgres
						</label>
						<label style={{marginLeft: 16}}>
							<input
								type="radio"
								name="uploadTarget"
								value="mongo"
								checked={uploadTarget === "mongo"}							
								onChange={dbSelection}
							/>
							Upload to MongoDB
						</label>
					</div>
					<button
						onClick={uploadToDB}
						style={{ marginLeft: 16, border: "1px solid #000" }}
						disabled={!filename}
					>Upload to DB</button>
					{uploadDbResult && (
                		<pre style={{ background: "#f4f4f4", padding: 8, marginTop: 12 }}>{uploadDbResult}</pre>
           			)}
			{data.length > 0 && (
				<div style={{ marginTop: 24 }}>
					<h4>Sheet Contents</h4>
					<div ref={tableRef} />
					<div style={{ marginBottom: 12 }}>
                        <button onClick={showAllRows} disabled={showFilter === null} style={{ marginRight: 8 }}>Show All</button>
                        <button onClick={() => filterRows(true)} disabled={showFilter === true} style={{ marginRight: 8 }}>Show Valid</button>
                        <button onClick={() => filterRows(false)} disabled={showFilter === false}>Show Invalid</button>
					</div>					
				</div>
			)}
		</div>
	);
}

export default App;