import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Grid,
  Button,
  Typography,
  Box,
  IconButton,
  AppBar,
  Toolbar,
  MenuItem,
  Paper,
  FormControl,
  Select,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DoneOutlineIcon from "@mui/icons-material/DoneOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { toast } from "react-toastify";
import { postRequest } from "../../serverconfiguration/requestcomp";
import { ServerConfig } from "../../serverconfiguration/serverconfig";
import { REPORTS, SAVE } from "../../serverconfiguration/controllers";
import Navbar from "../Home Page-comapny/Navbar1";
import Sidenav from "../Home Page-comapny/Sidenav1";

const DivisionMaster = () => {
  const [company, setCompany] = useState([]);
  const [branch, setBranch] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [modifiedRows, setModifiedRows] = useState({});
  const [pnCompanyId, setPnCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [openView, setOpenView] = useState(false);
  const [viewData, setViewData] = useState(null);
  const databaseName = sessionStorage.getItem("databaseName"); // ✅ get DB name dynamically

  // 🔽 Status utility
  const getStatusLabel = (char) => {
    switch (char) {
      case "A":
        return "Active";
      case "I":
        return "Inactive";
      case "P":
        return "Pending";
      default:
        return "";
    }
  };

  const getStatusChar = (label) => {
    switch (label) {
      case "Active":
        return "A";
      case "Inactive":
        return "I";
      case "Pending":
        return "P";
      default:
        return "";
    }
  };

  // 🔽 Fetch data
  const fetchCompanyData = async () => {
    const isloggedin = sessionStorage.getItem("user");
    const companyData = await postRequest(ServerConfig.url, REPORTS, {
      query: `SELECT * FROM [${databaseName}].[dbo].[paym_Company] WHERE company_user_id = '${isloggedin}'`,
    });
    setCompany(companyData.data);
    if (companyData.data.length > 0) {
      setPnCompanyId(companyData.data[0].pn_CompanyID);
      setCompanyName(companyData.data[0].CompanyName);
    }
  };

  const fetchBranchData = async () => {
    if (pnCompanyId) {
      const branchData = await postRequest(ServerConfig.url, REPORTS, {
        query: `SELECT * FROM [${databaseName}].[dbo].[paym_Branch] WHERE pn_CompanyID = '${pnCompanyId}'`,
      });
      setBranch(branchData.data);
    }
  };

  const fetchDivisionData = async () => {
    if (pnCompanyId) {
      const divisionData = await postRequest(ServerConfig.url, REPORTS, {
        query: `SELECT pn_CompanyID, BranchID, pn_DivisionID, v_DivisionName, status 
         FROM [${databaseName}].[dbo].[paym_Division]
         WHERE pn_CompanyID='${pnCompanyId}'`,

      });
      const formatted = divisionData.data.map((item) => ({
        pnCompanyId: item.pn_CompanyID,
        BranchID: item.BranchID,
        pn_DivisionID: item.pn_DivisionID,
        v_DivisionName: item.v_DivisionName,
        status: getStatusLabel(item.status),
      }));
      setGridData(formatted);
      setOriginalData(JSON.parse(JSON.stringify(formatted)));
      setModifiedRows({});
    }
  };

  const fetchAllData = async () => {
    await fetchCompanyData();
    await fetchBranchData();
    await fetchDivisionData();
  };

  useEffect(() => {
    fetchAllData();
  }, [pnCompanyId]);

  // 🔽 Check if row is modified
  const isRowModified = useCallback(
    (rowData) => {
      if (rowData.isNew) return false;
      const originalRow = originalData.find(
        (item) => item.pn_DivisionID === rowData.pn_DivisionID
      );
      if (!originalRow) return false;
      return (
        String(originalRow.BranchID) !== String(rowData.BranchID) ||
        String(originalRow.v_DivisionName) !== String(rowData.v_DivisionName) ||
        String(originalRow.status) !== String(rowData.status)
      );
    },
    [originalData]
  );

  const handleCellValueChanged = useCallback(
    (params) => {
      const rowData = params.data;
      if (!rowData.isNew) {
        const modified = isRowModified(rowData);
        setModifiedRows((prev) => ({
          ...prev,
          [rowData.pn_DivisionID]: modified,
        }));
      }
      params.api.refreshCells({ rowNodes: [params.node], force: true });
    },
    [isRowModified]
  );

  const handleAddRow = () => {
    const lastRow = gridData[gridData.length - 1];
    if (lastRow && (!lastRow.BranchID || !lastRow.v_DivisionName || !lastRow.status)) {
      toast.dismiss();
      toast.warning("Please fill all fields in the current row before adding new.", { position: "top-center", autoClose: 1000 });
      return;
    }
    const newRow = { pnCompanyId, BranchID: "", v_DivisionName: "", status: "", isNew: true };
    setGridData((prev) => [...prev, newRow]);
  };

  const handleSaveAll = async () => {
    try {
      toast.dismiss();
      const newRows = gridData.filter((row) => row.isNew);
      if (newRows.length === 0) {
        toast.error("No new data to save", { position: "top-center", autoClose: 1000 });
        return;
      }
      for (const row of newRows) {
        if (!row.BranchID || !row.v_DivisionName || !row.status) {
          toast.error("Please fill all fields for new rows before saving.", { position: "top-center", autoClose: 1000 });
          return;
        }
      }
      const queries = newRows.map((row) => {
        const statusChar = getStatusChar(row.status);
        return `INSERT INTO [${databaseName}].[dbo].[paym_Division] 
        (pn_CompanyID, BranchID, v_DivisionName, status)
        VALUES ('${row.pnCompanyId}', '${row.BranchID}', '${row.v_DivisionName}', '${statusChar}')`;

      });
      await Promise.all(queries.map((q) => postRequest(ServerConfig.url, SAVE, { query: q })));
      toast.success("Data saved successfully", { position: "top-center", autoClose: 1000 });
      await fetchAllData();
    } catch (error) {
      toast.error("Failed to save data", { position: "top-center", autoClose: 1000 });
    }
  };

  const handleUpdateRow = async (rowData) => {
    try {
      const statusChar = getStatusChar(rowData.status);
      const query = `UPDATE [${databaseName}].[dbo].[paym_Division]
               SET BranchID='${rowData.BranchID}', 
                   v_DivisionName='${rowData.v_DivisionName}', 
                   status='${statusChar}' 
               WHERE pn_DivisionID='${rowData.pn_DivisionID}'`;

      await postRequest(ServerConfig.url, SAVE, { query });
      setModifiedRows((prev) => {
        const newModified = { ...prev };
        delete newModified[rowData.pn_DivisionID];
        return newModified;
      });
      toast.success("Data updated successfully", { position: "top-center", autoClose: 1000 });
      await fetchAllData();
    } catch (error) {
      toast.error("Failed to update data", { position: "top-center", autoClose: 1000 });
    }
  };

  const handleDeleteRow = (rowData) => {
    toast.dismiss();
    toast.info(
      <div style={{ textAlign: "center" }}>
        Are you sure you want to delete this record?
        <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 8 }}>
          <Button
            variant="contained"
            color="error"
            size="small"
            onClick={async () => { toast.dismiss(); await executeDelete(rowData); }}
            style={{ minWidth: 80 }}
          >
            Delete
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => toast.dismiss()}
            style={{ minWidth: 80 }}
          >
            Cancel
          </Button>
        </div>
      </div>,
      { position: "top-center", autoClose: false, closeOnClick: false, draggable: false, toastId: "delete-confirmation" }
    );
  };

  const executeDelete = async (rowData) => {
    try {
      const query = `DELETE FROM [${databaseName}].[dbo].[paym_Division] 
               WHERE pn_DivisionID='${rowData.pn_DivisionID}'`;

      await postRequest(ServerConfig.url, SAVE, { query });
      toast.info("Data deleted successfully", { position: "top-center", autoClose: 1000 });
      await fetchAllData();
    } catch (error) {
      toast.error("Failed to delete data", { position: "top-center", autoClose: 1000 });
    }
  };

  const handleViewRow = (rowData) => {
    setViewData(rowData);
    setOpenView(true);
  };

  const columnDefs = useMemo(() => [
  {
    headerName: "Branch",
    field: "BranchID",
    editable: true,
    cellEditor: "agSelectCellEditor",
    cellEditorParams: { values: branch.map((b) => b.BranchName) },
    valueGetter: (params) => branch.find((b) => b.pn_BranchID === params.data.BranchID)?.BranchName || "",
    valueSetter: (params) => {
      const selected = branch.find((b) => b.BranchName === params.newValue);
      if (selected) { 
        params.data.BranchID = selected.pn_BranchID; 
        return true; 
      }
      return false;
    },
    minWidth: 150,
    flex: 1
  },
  { headerName: "Division", field: "v_DivisionName", editable: true, minWidth: 150, flex: 1 },
  {
    headerName: "Status",
    field: "status",
    editable: true,
    cellEditor: "agSelectCellEditor",
    cellEditorParams: { values: ["Active", "Inactive", "Pending"] },
    minWidth: 120,
    flex: 0.8
  },
  {
    headerName: "Actions",
    field: "actions",
    minWidth: 220,
    flex: 1,
    cellStyle: { display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" },
    cellRenderer: (params) => (
      <div className="d-flex justify-content-center" style={{ gap: "8px", width: "100%" }}>
        <button
          className="btn btn-info btn-sm"
          style={{ width: "60px" }}
          onClick={() => handleViewRow(params.data)}
        >
          View
        </button>
        <button
          className="btn btn-success btn-sm"
          style={{ width: "60px" }}
          onClick={() => handleUpdateRow(params.data)}
          disabled={!modifiedRows[params.data.pn_DivisionID]}
        >
          Edit
        </button>
        <button
          className="btn btn-danger btn-sm"
          style={{ width: "60px" }}
          onClick={() => handleDeleteRow(params.data)}
        >
          Delete
        </button>
      </div>
    )
  }
], [branch, modifiedRows]);


  const filteredData = useMemo(() => {
    return gridData.filter((row) => {
      const statusMatch = statusFilter ? row.status === statusFilter : true;
      const branchMatch = branchFilter ? String(row.BranchID) === String(branchFilter) : true;
      return statusMatch && branchMatch;
    });
  }, [gridData, statusFilter, branchFilter]);

  return (
    <Grid container sx={{ backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
      <Navbar />
      <Grid item xs={12} sx={{ display: "flex" }}>
        <Sidenav />

        <Grid item xs={12} sm={10} md={9} lg={9} xl={10} sx={{mt: "100px", p: 3, mx: "auto", width: "100%", maxWidth: 900 }}>
          <AppBar position="static"><Toolbar><Typography variant="h5">Division Master</Typography></Toolbar></AppBar>

          {/* Filters */}
          <Paper elevation={3} sx={{ p: 2, my: 2 }}>
            <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
              <FormControl fullWidth>
                <InputLabel>Branch</InputLabel>
                <Select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} label="Branch">
                  <MenuItem value="">All</MenuItem>
                  {branch.map((b) => (<MenuItem key={b.pn_BranchID} value={b.pn_BranchID}>{b.BranchName}</MenuItem>))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* Grid */}
          <Box className="ag-theme-alpine" sx={{ width: "100%", height: "auto" }}>
            <AgGridReact
              rowData={filteredData}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              defaultColDef={{ resizable: true }}
              pagination
              paginationPageSize={10}
              animateRows
              onCellValueChanged={handleCellValueChanged}
            />
          </Box>

          {/* Buttons */}
          <Box mt={2} display="flex" justifyContent="flex-end" gap={2}>
            <Button variant="contained" onClick={handleAddRow}>Add Division</Button>
            <Button variant="contained" color="primary" onClick={handleSaveAll}>Save All</Button>
          </Box>

          {/* View Dialog */}
          <Dialog open={openView} onClose={() => setOpenView(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Division Details</DialogTitle>
            <DialogContent dividers>
              {viewData && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography><strong>Branch:</strong> {branch.find(b => b.pn_BranchID === viewData.BranchID)?.BranchName}</Typography>
                  <Typography><strong>Division Name:</strong> {viewData.v_DivisionName}</Typography>
                  <Typography><strong>Status:</strong> {viewData.status}</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenView(false)}>Close</Button>
            </DialogActions>
          </Dialog>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default DivisionMaster;
