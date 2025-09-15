import { Tabs, Tab, Box } from "@mui/material";
import DataTableComponent from "./DataTableComponent";
const { useState } = require("react");

function SheetTabs({data, gridRefs, excludedFields, onCellValueChanged, filter}) {
    const sheetNames = Object.keys(data);
    const [activeTab, setActiveTab] = useState(0);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    return (
        <Box sx={{ width: "100%"}}>
            <Tabs 
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="Sheet-Tabs"
            >
                {sheetNames.map(name =>( 
                    <Tab key={name} label={name} />
                ))}
            </Tabs>
            <Box sx={{ mt: 2 }}>
                {sheetNames.map((name, idx) => (
                    <div
                        key={name}
                        style={{
                            display: idx === activeTab ? "block" : "none",
                            width: "100%",
                        }}
                    >
                        <DataTableComponent
                            rows={data[name]}
                            tableRef={el => { gridRefs.current[name] = el; }}
                            excludedFields={excludedFields}
                            onCellValueChanged={params => onCellValueChanged(params, name)}
                        />
                    </div>
                ))}
            </Box>
        </Box>
    );
}

export default SheetTabs