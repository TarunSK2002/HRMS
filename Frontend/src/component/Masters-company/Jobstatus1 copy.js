import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Grid,
  Button,
  Typography,
  Box,
  FormControl,
  Select,
  InputLabel,
  MenuItem,
  Card,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DoneOutlineIcon from "@mui/icons-material/DoneOutline";
import { toast } from "react-toastify";
import { postRequest } from "../../serverconfiguration/requestcomp";
import { ServerConfig } from "../../serverconfiguration/serverconfig";
import { REPORTS, SAVE } from "../../serverconfiguration/controllers";
import Navbar from "../Home Page-comapny/Navbar1";
import Sidenav from "../Home Page-comapny/Sidenav1";

const JobStatusFormMaster = () => {
  const [branch, setBranch] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [modifiedRows, setModifiedRows] = useState({});
  const [pnCompanyId, setPnCompanyId] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewData, setViewData] = useState(null);
  const [openView, setOpenView] = useState(false);
  const databaseName = sessionStorage.getItem("databaseName"); // ✅ Dynamic DB name

  const getStatusLabel = (char) => {
    switch (char) {
      case "A": return "Active";
      case "I": return "Inactive";
      case "P": return "Pending";
      default: return "";
    }
  };

  const getStatusChar = (label) => {
    switch (label) {
      case "Active": return "A";
      case "Inactive": return "I";
      case "Pending": return "P";
      default: return "";
    }
  };

  const fetchCompanyData = async () => {
    const isloggedin = sessionStorage.getItem("user");
    const companyData = await postRequest(ServerConfig.url, REPORTS, {
      query: `SELECT * FROM [${databaseName}].[dbo].[paym_Company]
        WHERE company_user_id='${isloggedin}'`,

    });
    if (companyData.data.length > 0) setPnCompanyId(companyData.data[0].pn_CompanyID);
  };

  const fetchBranchData = async () => {
    if (pnCompanyId) {
      const branchData = await postRequest(ServerConfig.url, REPORTS, {
       query: `SELECT * FROM [${databaseName}].[dbo].[paym_Branch]
        WHERE pn_CompanyID='${pnCompanyId}'`,

      });
      setBranch(branchData.data);
    }
  };

  const fetchJobStatusData = async () => {
    if (!pnCompanyId) return;
    const jobStatusData = await postRequest(ServerConfig.url, REPORTS, {
      query: `SELECT pn_JobStatusID, BranchID, v_JobStatusName, status
        FROM [${databaseName}].[dbo].[paym_JobStatus]
        WHERE pn_CompanyID='${pnCompanyId}'`,

    });
    const formattedData = jobStatusData.data.map((item) => ({
      pn_JobStatusID: item.pn_JobStatusID,
      BranchID: item.BranchID,
      v_JobStatusName: item.v_JobStatusName,
      status: getStatusLabel(item.status),
      isNew: false,
    }));
    setGridData(formattedData);
    setOriginalData(JSON.parse(JSON.stringify(formattedData)));
    setModifiedRows({});
  };

  const fetchAllData = async () => {
    await fetchCompanyData();
    await fetchBranchData();
    await fetchJobStatusData();
  };

  useEffect(() => { fetchAllData(); }, [pnCompanyId]);

  const isRowModified = useCallback((rowData) => {
    if (rowData.isNew) return false;
    const originalRow = originalData.find(r => r.pn_JobStatusID === rowData.pn_JobStatusID);
    if (!originalRow) return false;
    return originalRow.BranchID !== rowData.BranchID ||
           originalRow.v_JobStatusName !== rowData.v_JobStatusName ||
           originalRow.status !== rowData.status;
  }, [originalData]);

  const handleCellValueChanged = useCallback((params) => {
    const rowData = params.data;
    if (!rowData.isNew) {
      setModifiedRows(prev => ({ ...prev, [rowData.pn_JobStatusID]: isRowModified(rowData) }));
    }
    params.api.refreshCells({ rowNodes: [params.node], force: true });
  }, [isRowModified]);

  const handleAddRow = () => {
    const lastRow = gridData[gridData.length - 1];
    if (lastRow && (!lastRow.BranchID || !lastRow.v_JobStatusName || !lastRow.status)) {
      toast.warning("Please fill all fields in the current row before adding a new one.");
      return;
    }
    setGridData(prev => [...prev, { pnCompanyId, BranchID: "", v_JobStatusName: "", status: "", isNew: true }]);
  };

  const handleSaveAll = async () => {
    const newRows = gridData.filter(r => r.isNew);
    if (!newRows.length) { toast.error("No new rows to save"); return; }
    for (const row of newRows) {
      if (!row.BranchID || !row.v_JobStatusName || !row.status) {
        toast.error("Please fill all fields before saving");
        return;
      }
    }
    const queries = newRows.map(row => 
      `INSERT INTO [${databaseName}].[dbo].[paym_JobStatus]
 (pn_CompanyID, BranchID, v_JobStatusName, status)
 VALUES ('${row.pnCompanyId}', '${row.BranchID}', '${row.v_JobStatusName}', '${getStatusChar(row.status)}')`

    );
    await Promise.all(queries.map(q => postRequest(ServerConfig.url, SAVE, { query: q })));
    toast.success("Saved successfully");
    fetchAllData();
  };

  const handleUpdateRow = async (rowData) => {
    const query = `UPDATE [${databaseName}].[dbo].[paym_JobStatus]
               SET BranchID='${rowData.BranchID}', 
                   v_JobStatusName='${rowData.v_JobStatusName}', 
                   status='${getStatusChar(rowData.status)}'
               WHERE pn_JobStatusID='${rowData.pn_JobStatusID}'`;

    await postRequest(ServerConfig.url, SAVE, { query });
    setModifiedRows(prev => { const copy = { ...prev }; delete copy[rowData.pn_JobStatusID]; return copy; });
    toast.success("Updated successfully");
    fetchAllData();
  };

  const handleDeleteRow = async (rowData) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
   const query = `DELETE FROM [${databaseName}].[dbo].[paym_JobStatus]
               WHERE pn_JobStatusID='${rowData.pn_JobStatusID}'`;

    await postRequest(ServerConfig.url, SAVE, { query });
    toast.info("Deleted successfully");
    fetchAllData();
  };

  const handleViewRow = (rowData) => { setViewData(rowData); setOpenView(true); };

  const columnDefs = useMemo(() => [
    {
      headerName: "Branch",
      field: "BranchID",
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: { values: branch.map(b => b.BranchName) },
      valueGetter: params => branch.find(b => b.pn_BranchID === params.data.BranchID)?.BranchName || "",
      valueSetter: params => {
        const selected = branch.find(b => b.BranchName === params.newValue);
        if (selected) { params.data.BranchID = selected.pn_BranchID; return true; }
        return false;
      },
    },
    { headerName: "Job Status Name", field: "v_JobStatusName", editable: true },
    { headerName: "Status", field: "status", editable: true, cellEditor: "agSelectCellEditor", cellEditorParams: { values: ["Active","Inactive","Pending"] } },
    {
      headerName: "Actions",
      field: "actions",
      cellRenderer: (params) => (
        <Box sx={{ display: "flex", gap: 1 }}>
          {/* <IconButton color="success" onClick={() => handleUpdateRow(params.data)} disabled={!modifiedRows[params.data.pn_JobStatusID]}><DoneOutlineIcon /></IconButton> */}
          <Button variant="outlined" size="small" onClick={() => handleViewRow(params.data)}>View</Button>
          <Button variant="outlined" size="small" onClick={() => handleUpdateRow(params.data)} disabled={!modifiedRows[params.data.pn_JobStatusID]}>Edit</Button>
          <IconButton color="error" onClick={() => handleDeleteRow(params.data)}><DeleteOutlineIcon /></IconButton>
        </Box>
      ),
    }
  ], [branch, modifiedRows]);

  const filteredData = useMemo(() => gridData.filter(row => 
    (!statusFilter || row.status === statusFilter) &&
    (!branchFilter || String(row.BranchID) === String(branchFilter))
  ), [gridData, statusFilter, branchFilter]);

  return (
    <Grid container sx={{ minHeight: "100vh", backgroundColor: "#f0f4f8" }}>
      <Navbar />
      <Grid item xs={12} sx={{ display: "flex" }}>
        <Sidenav />
        <Grid item xs={12} sm={10} sx={{ p: 5, margin: "100px auto" }}>
          {/* AppBar */}
          <AppBar position="static" sx={{ mb: 3, borderRadius: 2, background: "linear-gradient(90deg, #6a11cb, #2575fc)" }}>
            <Toolbar>
              <Typography variant="h5" sx={{ fontWeight: "bold", color: "#fff" }}>Job Status Master</Typography>
            </Toolbar>
          </AppBar>

          {/* Filters */}
          <Card sx={{ p: 3, mb: 3, borderRadius: 3, background: "linear-gradient(90deg, #6a11cb, #2575fc)" }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: "#fff" }}>Branch</InputLabel>
                  <Select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} sx={{ bgcolor: "#fff", color: "#000" }}>
                    <MenuItem value="">All Branches</MenuItem>
                    {branch.map(b => <MenuItem key={b.pn_BranchID} value={b.pn_BranchID}>{b.BranchName}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: "#fff" }}>Status</InputLabel>
                  <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ bgcolor: "#fff", color: "#000" }}>
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Inactive">Inactive</MenuItem>
                    <MenuItem value="Pending">Pending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4} sx={{ textAlign: { md: "right" } }}>
                <Button onClick={handleAddRow} sx={{ mr: 2, background: "#ff4b1f", color: "#fff" }}>Add Job Status</Button>
                <Button onClick={handleSaveAll} sx={{ background: "linear-gradient(45deg,#1fddff,#45f3ff)", color: "#000" }}>Save All</Button>
              </Grid>
            </Grid>
          </Card>

          {/* AG Grid */}
          <Box className="ag-theme-alpine" sx={{ borderRadius: 3, overflow: "hidden", boxShadow: 3, mb: 3 }}>
            <AgGridReact
              rowData={filteredData}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              defaultColDef={{ flex: 1, minWidth: 120, resizable: true }}
              pagination
              paginationPageSize={10}
              animateRows
              onCellValueChanged={handleCellValueChanged}
              getRowStyle={(params) => ({
                backgroundColor: params.node.rowIndex % 2 === 0 ? "#e0f7fa" : "#ffffff",
              })}
            />
          </Box>

          {/* View Dialog */}
          <Dialog open={openView} onClose={() => setOpenView(false)} PaperProps={{ sx: { borderRadius: 3, background: "linear-gradient(135deg, #f6d365, #fda085)", p: 3 } }}>
            <DialogTitle sx={{ fontWeight: "bold", color: "#333" }}>Job Status Details</DialogTitle>
            <DialogContent>
              {viewData && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, height: "100px" }}>
                  <Typography><strong>Branch:</strong> {branch.find(b => b.pn_BranchID === viewData.BranchID)?.BranchName || ""}</Typography>
                  <Typography><strong>Job Status Name:</strong> {viewData.v_JobStatusName}</Typography>
                  <Typography><strong>Status:</strong> {viewData.status}</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenView(false)} sx={{ background: "linear-gradient(45deg,#ff416c,#ff4b2b)", color: "#fff", fontWeight: "bold", "&:hover": { opacity: 0.9 } }}>Close</Button>
            </DialogActions>
          </Dialog>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default JobStatusFormMaster;
