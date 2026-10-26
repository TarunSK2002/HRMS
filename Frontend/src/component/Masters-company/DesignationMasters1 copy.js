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
import { Card, Col, Row, Form } from "react-bootstrap";
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

const DesignationMaster = () => {
  const [company, setCompany] = useState([]);
  const [branch, setBranch] = useState([]);
  const [gridData, setGridData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [modifiedRows, setModifiedRows] = useState({});
  const [pnCompanyId, setPnCompanyId] = useState("");
  const [companyName, setCompanyName] = useState("");

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  // View Modal
  const [viewData, setViewData] = useState(null);
  const [openView, setOpenView] = useState(false);
  const databaseName = sessionStorage.getItem("databaseName"); // ✅ get dynamic DB name

  const getStatusLabel = (char) =>
    char === "A"
      ? "Active"
      : char === "I"
      ? "Inactive"
      : char === "P"
      ? "Pending"
      : "";

  const getStatusChar = (label) =>
    label === "Active"
      ? "A"
      : label === "Inactive"
      ? "I"
      : label === "Pending"
      ? "P"
      : "";

  const fetchCompanyData = async () => {
    const isloggedin = sessionStorage.getItem("user");
    const companyData = await postRequest(ServerConfig.url, REPORTS, {
      query: `SELECT * FROM [${databaseName}].[dbo].[paym_Company]
        WHERE company_user_id = '${isloggedin}'`,
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
        query: `SELECT * FROM [${databaseName}].[dbo].[paym_Branch]
        WHERE pn_CompanyID = '${pnCompanyId}'`,
      });
      setBranch(branchData.data);
    }
  };

  const fetchDesignationData = async () => {
    if (pnCompanyId) {
      const designationData = await postRequest(ServerConfig.url, REPORTS, {
        query: `SELECT pn_CompanyID, BranchID, pn_DesignationID, v_DesignationName, Authority, status
        FROM [${databaseName}].[dbo].[paym_Designation]
        WHERE pn_CompanyID='${pnCompanyId}'`,
      });
      const formatted = designationData.data.map((item) => ({
        pnCompanyId: item.pn_CompanyID,
        BranchID: item.BranchID,
        pn_DesignationID: item.pn_DesignationID,
        v_DesignationName: item.v_DesignationName,
        Authority: item.Authority,
        status: getStatusLabel(item.status),
      }));
      setGridData(formatted || []);
      setOriginalData(JSON.parse(JSON.stringify(formatted)) || []);
      setModifiedRows({});
    }
  };

  const fetchAllData = async () => {
    await fetchCompanyData();
    await fetchBranchData();
    await fetchDesignationData();
  };

  useEffect(() => {
    fetchAllData();
  }, [pnCompanyId]);

  const isRowModified = useCallback(
    (rowData) => {
      if (rowData.isNew) return false;
      const originalRow = originalData.find(
        (r) => r.pn_DesignationID === rowData.pn_DesignationID
      );
      if (!originalRow) return false;
      return (
        String(originalRow.BranchID) !== String(rowData.BranchID) ||
        String(originalRow.v_DesignationName) !==
          String(rowData.v_DesignationName) ||
        String(originalRow.Authority) !== String(rowData.Authority) ||
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
          [rowData.pn_DesignationID]: modified,
        }));
      }
      params.api.refreshCells({ rowNodes: [params.node], force: true });
    },
    [isRowModified]
  );

  const handleAddRow = () => {
    const lastRow = gridData[gridData.length - 1];
    if (
      lastRow &&
      (!lastRow.BranchID || !lastRow.v_DesignationName || !lastRow.status)
    ) {
      toast.warning("Fill current row before adding a new one");
      return;
    }
    setGridData((prev) => [
      ...prev,
      {
        pnCompanyId,
        BranchID: "",
        v_DesignationName: "",
        Authority: "",
        status: "",
        isNew: true,
      },
    ]);
  };

  const handleSaveAll = async () => {
    const newRows = gridData.filter((r) => r.isNew);
    if (!newRows.length) {
      toast.error("No new rows to save");
      return;
    }
    for (const row of newRows) {
      if (!row.BranchID || !row.v_DesignationName || !row.status) {
        toast.error("Please fill all fields before saving");
        return;
      }
    }
    const queries = newRows.map(
      (row) =>
        `INSERT INTO [${databaseName}].[dbo].[paym_Designation]
 (pn_CompanyID, BranchID, v_DesignationName, Authority, status)
 VALUES ('${row.pnCompanyId}', '${row.BranchID}', '${row.v_DesignationName}', '${row.Authority}', '${getStatusChar(row.status)}');`

    );

    await Promise.all(
      queries.map((q) => postRequest(ServerConfig.url, SAVE, { query: q }))
    );
    toast.success("Saved successfully");
    fetchAllData();
  };

  const handleUpdateRow = async (rowData) => {
    const query = `UPDATE [${databaseName}].[dbo].[paym_Designation]
               SET BranchID='${rowData.BranchID}', 
                   v_DesignationName='${rowData.v_DesignationName}', 
                   Authority='${rowData.Authority}', 
                   status='${getStatusChar(rowData.status)}'
               WHERE pn_DesignationID='${rowData.pn_DesignationID}'`;

    await postRequest(ServerConfig.url, SAVE, { query });
    const copy = { ...modifiedRows };
    delete copy[rowData.pn_DesignationID];
    setModifiedRows(copy);
    toast.success("Updated successfully");
    fetchAllData();
  };

  const handleDeleteRow = async (rowData) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    const query = `DELETE FROM [${databaseName}].[dbo].[paym_Designation]
               WHERE pn_DesignationID='${rowData.pn_DesignationID}'`;

    await postRequest(ServerConfig.url, SAVE, { query });
    toast.info("Deleted successfully");
    fetchAllData();
  };

  const handleViewRow = (rowData) => {
    setViewData(rowData);
    setOpenView(true);
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Branch",
        field: "BranchID",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: branch.map((b) => b.BranchName) },
        valueGetter: (params) =>
          branch.find((b) => b.pn_BranchID === params.data.BranchID)
            ?.BranchName || "",
        valueSetter: (params) => {
          const selected = branch.find((b) => b.BranchName === params.newValue);
          if (selected) {
            params.data.BranchID = selected.pn_BranchID;
            return true;
          }
          return false;
        },
      },
      { headerName: "Designation", field: "v_DesignationName", editable: true },
      { headerName: "Authority", field: "Authority", editable: true },
      {
        headerName: "Status",
        field: "status",
        editable: true,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ["Active", "Inactive", "Pending"] },
        cellStyle: (params) => ({
          fontWeight: "bold",
          color:
            params.value === "Active"
              ? "#155724"
              : params.value === "Inactive"
              ? "#721c24"
              : "#856404",
        }),
      },
      {
        headerName: "Actions",
        cellRenderer: (params) => (
          <div style={{ display: "flex", gap: "6px" }}>
            <IconButton
              color="primary"
              onClick={() => handleViewRow(params.data)}
            >
              <VisibilityIcon />
            </IconButton>
            <IconButton
              color="success"
              onClick={() => handleUpdateRow(params.data)}
              disabled={!modifiedRows[params.data.pn_DesignationID]}
            >
              <DoneOutlineIcon />
            </IconButton>
            <IconButton
              color="error"
              onClick={() => handleDeleteRow(params.data)}
            >
              <DeleteOutlineIcon />
            </IconButton>
          </div>
        ),
      },
    ],
    [branch, modifiedRows]
  );

  const filteredData = useMemo(
    () =>
      gridData.filter(
        (row) =>
          (!statusFilter || row.status === statusFilter) &&
          (!branchFilter || String(row.BranchID) === String(branchFilter))
      ),
    [gridData, statusFilter, branchFilter]
  );

  return (
    <Grid container sx={{ minHeight: "100vh", backgroundColor: "#f0f4f8" }}>
      <Navbar />
      <Grid item xs={12} sx={{ display: "flex" }}>
        <Sidenav />

        <Grid item xs={12} sm={10} sx={{ p: 5, margin: "100px auto" }}>
          <AppBar
            position="static"
            sx={{
              background: "linear-gradient(90deg, #6a11cb, #2575fc)",
              mb: 3,
              borderRadius: 2,
            }}
          >
            <Toolbar>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", color: "#fff" }}
              >
                Designation Master
              </Typography>
            </Toolbar>
          </AppBar>

          {/* Filters */}
          <Card
            className="p-3 mb-3 shadow"
            style={{
              borderRadius: "12px",
              background: "linear-gradient(90deg, #6a11cb, #2575fc)",
            }}
          >
            <Row className="align-items-center">
              <Col xs={12} sm={6} md={4} className="mb-2">
                <Form.Select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  style={{ backgroundColor: "#ffffff", color: "#000" }}
                >
                  <option value="">All Branches</option>
                  {branch.map((b) => (
                    <option key={b.pn_BranchID} value={b.pn_BranchID}>
                      {b.BranchName}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={12} sm={6} md={4} className="mb-2">
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ backgroundColor: "#ffffff", color: "#000" }}
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </Form.Select>
              </Col>
              <Col xs={12} md={4} className="text-md-end">
                <Button
                  onClick={handleAddRow}
                  className="me-2"
                  style={{
                    backgroundColor: "#ff4b1f",
                    border: "none",
                    color: "#ffff",
                  }}
                >
                  Add Designation
                </Button>
                <Button
                  onClick={handleSaveAll}
                  style={{
                    backgroundColor: "#1fddff",
                    border: "none",
                    color: "#000",
                  }}
                >
                  Save All
                </Button>
              </Col>
            </Row>
          </Card>

          {/* Grid */}
          <Box
            className="ag-theme-alpine"
            sx={{
              height: "auto",
              width: "100%",
              borderRadius: 3,
              overflow: "hidden",
              boxShadow: "0px 8px 20px rgba(0,0,0,0.15)",
              mb: 3,
            }}
          >
            <AgGridReact
              rowData={filteredData}
              columnDefs={columnDefs}
              domLayout="autoHeight"
              defaultColDef={{ flex: 1, minWidth: 120, resizable: true }}
              pagination={true}
              paginationPageSize={10}
              animateRows={true}
              onCellValueChanged={handleCellValueChanged}
              getRowStyle={(params) => ({
                backgroundColor:
                  params.node.rowIndex % 2 === 0 ? "#e0f7fa" : "#ffffff",
              })}
            />
          </Box>

          {/* Action Buttons */}
          {/* <Box
            sx={{ display: "flex", gap: 2, justifyContent: "flex-end", mb: 3 }}
          >
            <Button
              variant="contained"
              onClick={handleAddRow}
              sx={{
                background: "linear-gradient(45deg, #ff6a00, #ee0979)",
                color: "#fff",
                fontWeight: "bold",
                "&:hover": { opacity: 0.9 },
              }}
            >
              Add Designation
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveAll}
              sx={{
                background: "linear-gradient(45deg, #56ab2f, #a8e063)",
                color: "#fff",
                fontWeight: "bold",
                "&:hover": { opacity: 0.9 },
              }}
            >
              Save All
            </Button>
          </Box> */}

          {/* View Modal */}
          <Dialog
            open={openView}
            onClose={() => setOpenView(false)}
            PaperProps={{
              sx: {
                borderRadius: 3,
                background: "linear-gradient(135deg, #f6d365, #fda085)",
                padding: 3,
              },
            }}
          >
            <DialogTitle sx={{ color: "#333", fontWeight: "bold" }}>
              Designation Details
            </DialogTitle>
            <DialogContent>
              {viewData && (
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  <Typography>
                    <strong>Branch:</strong>{" "}
                    {branch.find((b) => b.pn_BranchID === viewData.BranchID)
                      ?.BranchName || ""}
                  </Typography>
                  <Typography>
                    <strong>Designation:</strong> {viewData.v_DesignationName}
                  </Typography>
                  <Typography>
                    <strong>Authority:</strong> {viewData.Authority}
                  </Typography>
                  <Typography>
                    <strong>Status:</strong> {viewData.status}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setOpenView(false)}
                sx={{
                  background: "linear-gradient(45deg, #ff416c, #ff4b2b)",
                  color: "#fff",
                  fontWeight: "bold",
                  "&:hover": { opacity: 0.9 },
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default DesignationMaster;
