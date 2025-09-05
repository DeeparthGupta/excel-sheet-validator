import React, { useEffect, useRef, useState } from "react";
import "frappe-datatable/dist/frappe-datatable.min.css";
import DataTable from "frappe-datatable";

function App() {
	const targetServer = "http://localhost:3001";
	const fileInputRef = useRef();
	const tableDivRef = useRef();
	const tableRef = useRef();
  	const [result, setResult] = useState("");
  	const [uploading, setUploading] = useState(false);
  	const [data, setData] = useState([]);
	const [columns, setColumns] = useState([]);
	const [filename, setFileName] = useState("");
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
	  		const response = await fetch(`${targetServer}/upload`, {
				method: "POST",
				body: formData,
	  		});
			const responseData = await response.json();

			if (response.ok && responseData.fileName) {
				setFileName(responseData.fileName);
				//console.log(`File Name: ${responseData.fileName}`);
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
			const response = await fetch(`${targetServer}/retrieve?filename=${filename}`);
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
		const columns = [
			{ name: "Customer Name", id: "Customer Name" },
			{ name: "Number", id: "Number" },
			{ name: "Email", id: "Email" },
			{ name: "Time", id: "Time" },
		]/* Object.keys(data[0] || {})
			.filter(key => !hiddenColumns.includes(key))
			.map((key) => ({
				name: key,
				id: key,
			})); */

		/*const rows = data .map(row =>
			columns.map(col =>
				String(row[col.id] ?? "")
			)
		) */;
		
		//console.log("Columns:", JSON.stringify(columns,null,2));
		//console.log("Rows:", JSON.stringify(rows,null,2));

		setColumns(columns);
		setFilteredRows(data)
	}

	const filterRows = (isValid) => {
        setShowFilter(isValid);
		const filtered = data.filter(row => row._valid === isValid);     
		setFilteredRows(filtered);
	};
	
	const showAllRows = () => {
        setShowFilter(null);
		setFilteredRows(data);
	};
	
	const dbSelection = (e) => {
		setuploadTarget(e.target.value);
	}

	const uploadToDB = async () => {
		const endpoint = uploadTarget === "postgres"
			? `${targetServer}/uploadpostgres`
			: `${targetServer}/uploadmongodb`;
		
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


	const applyStyleToRow = (rowData, rowIndex) => {
		
		// Clear all styles
		/* columns.forEach((_, colIndex) => {
			tableRef.current.style.setStyle(`.dt-cell--row-${Number(rowIndex)}.dt-cell--col-${colIndex}`, {
				background: 'transparent'
			});
			console.log(`Cleared cell ${colIndex} of row ${rowIndex}`)
		});

		tableRef.current.style.setStyle(`.dt-cell--row-${Number(rowIndex)}`, {
			background: 'transparent'
		});
		console.log(`Cleared row ${rowIndex}`) */

		// Set styles
		if (rowData._valid) {
			tableRef.current.style.setStyle(`.dt-cell--row-${Number(rowIndex)}`, {
				background: 'transparent'
			});
			tableRef.current.style.setStyle(`.dt-cell--row-${Number(rowIndex)}`, {
				background: '#77e977ff'
			});
			//console.log(`Set row ${rowIndex} colors`);
		} else if (!rowData._valid) {
			tableRef.current.style.setStyle(`.dt-cell--row-${Number(rowIndex)}`, {
				background: '#transparent'
			});
			tableRef.current.style.setStyle(`.dt-cell--row-${Number(rowIndex)}`, {
				background: '#f0b6b6ff'
			});
			//console.log(`Set row ${rowIndex} to red`);
			rowData._errors.forEach(key => {
				const columnIndex = columns.findIndex(col => col.id === key);
				const cellSelector = `.dt-cell--row-${Number(rowIndex)}.dt-cell--col-${columnIndex}`;
				const cells = document.querySelectorAll(cellSelector);
				cells.forEach(cell => cell.style.background = '#f72424ff');
			});
		}
		
	}


	const applyStyles = (tableData) => {
		tableData.forEach((rowData, rowIndex) => {
			applyStyleToRow(rowData, rowIndex);
		});
	}

	/* const updateData = (modRow) =>{
		const index = data.findIndex(row => row.Number === modRow.Number);
		if (index !== -1) {
			const dataCopy = [...data];
			dataCopy[index] = modRow;
			return dataCopy;
		}
	} */

	const revalidate = async (modRow) => {
		console.log(`Filename: ${filename}`);
		try {
			const response = await fetch(`${targetServer}/update`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					filename: filename,
					row: modRow
				})
			});
			const result = await response.json();
			if (response.status === 200) {
				setResult(result.message);
				await retrieveData(filename);
			} else {
				setResult(`Update failed: ${result.error}`);
			}
		} catch (err) {
			setResult(`Error sending update: ${err}`)
		}
	};

	// Get uploaded file data using the filename sent in response to upload
	useEffect(() => {
		if (filename) {
			retrieveData(filename);
		}
	}, [filename]);

	// Process the data into headers and array
	useEffect(() => {
		if (data.length > 0) {
			processDataForFrappe(data, []);
		}
	}, [data]);

	// Create and populate the table
	useEffect(() => {
		if (columns.length > 0 && tableDivRef.current) {
			if (tableRef.current){
				tableRef.current.refresh(filteredRows, columns);
				setTimeout(() => applyStyles(filteredRows), 0);
			} else {
				tableRef.current = new DataTable(tableDivRef.current, {
					columns: columns,
					data: filteredRows,
					serialNoColumn: false,
					getEditor(colIndex, rowIndex, value, parent, column, row, rowdata) {
						const $input = document.createElement('input');
						$input.type = 'text';
						$input.value = value;
						parent.appendChild($input)

						return {
							initValue(value) {
								$input.value = value;
								$input.focus();
							},
							setValue(value) {
								$input.value = value;

								/* console.log(`Row: ${JSON.stringify(row, null, 2)} \n 
								Value: ${$input.value} \n 
								Column: ${JSON.stringify(column, null, 2)} \n 
								Data: ${JSON.stringify(rowdata, null, 2)} \n
								ColIndex: ${colIndex} RowIndex: ${rowIndex}`); */
							},
							getValue(value) {
								const rowCopy = { ...rowdata };
								rowCopy[column["id"]] = $input.value;
								revalidate(rowCopy);
								return $input.value;
								
							}
						}
					}
				});
				setTimeout(() => applyStyles(filteredRows), 0);
			}	

		}
	}, [filteredRows, columns]);

	/* useEffect(() => {
		if(tableRef.current && filteredRows > 0){
			applyStyles(filteredRows);
		}
	},[filteredRows]); */


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
					<div ref={tableDivRef} />
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