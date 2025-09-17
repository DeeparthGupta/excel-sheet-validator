import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-theme-alpine.css";
import "../styles/dataGrid.css"
import { useEffect, useRef } from 'react';

ModuleRegistry.registerModules([ AllCommunityModule ]);


function DataTableComponent({ rows, tableRef, excludedFields, onCellValueChanged, searchQuery, onHasMatch }) {
	const apiRef = useRef(null)
	
	const displayColumns = rows.length > 0
	? Object.keys(rows[0]).filter(key => !excludedFields.includes(key))
	: [];
	
	const firstColumn = displayColumns[0];
	const noFirstColumn = displayColumns.slice(1);
	
	const agColumns = [
		{	
			headerName: "_valid",
			field: "_valid",
			hide: true,
		},
		
		...(firstColumn ? [{
			headerName: firstColumn,
			field: firstColumn,
			editable: false,
			filter: false,
			flex: 1,
			hide: false,
		}] : []),
		
		...noFirstColumn.map(column => ({
			headerName: column,
			field: column,
			editable: true,
			flex:1,
			filter: true,
			cellClass: params =>
				params.data._valid === false
			&& params.data._errors.length > 0
			&& params.data._errors.includes(params.colDef.field)
			? "cell-error"
			: undefined,
		})),
		
	];
	
	const useAutoHeight = rows.length < 10;
	
	const setRowStyle = params => {
		if (params.data._valid === true) return { backgroundColor: "#77e977ff" };
		if (params.data._valid === false) return { backgroundColor: "#f0b6b6ff" };
		return "";
	}
	
	// Updates filter when search query changes
	useEffect(() => {
		if (apiRef.current) {
			apiRef.current.setQuickFilter(searchQuery || "");
		}
	}, [searchQuery, apiRef])
	
	// Retports any matches
	const handleFilterChanged = () => {
		if (apiRef.current && onHasMatch) {
			onHasMatch(apiRef.current.getDisplayedRowCount() > 0);
		}
	}

	// Applies filters once grid is ready
	const handleGridReady = params => {
		apiRef.current = params.api
        if (typeof tableRef === "function") tableRef(params.api);
        else if (tableRef && typeof tableRef === "object") tableRef.current = params.api;
        params.api.setQuickFilter(searchQuery || "");
        if (onHasMatch) onHasMatch(params.api.getDisplayedRowCount() > 0);
    };

	return (
		<div className="ag-theme-alpine data-grid-base">
			<AgGridReact
				//ref={tableRef}
				rowData={rows}
				columnDefs={agColumns}
				getRowStyle={setRowStyle}
				onCellValueChanged={onCellValueChanged}
				onFilterChanged={handleFilterChanged}
				onGridReady={handleGridReady}
				getRowId={params => String(params.data._index)}
				domLayout={useAutoHeight ? 'autoHeight' : undefined}
			/>			
		</div>
	);
}

export default DataTableComponent;