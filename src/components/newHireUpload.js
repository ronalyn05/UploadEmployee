import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { variables } from '../variables';
import Navbar from './navbar';
import TopNavbar from './topnavbar';
import Footer from './footer';
import '../App.css'; // Import app.css

const NewHireUpload = () => {
  const [file, setFile] = useState(null);
  const [excelData, setExcelData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [editModalShow, setEditModalShow] = useState(false);
  const [editRowData, setEditRowData] = useState(null);
  const [editedData, setEditedData] = useState({}); // State to hold edited data

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setShowPreview(false);
    setActiveTab('upload');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert('No File Selected');
      return;
    }

    const fileType = file.type;
    if (fileType !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      alert('Please select an Excel file.');
      return;
    }

    try {
      const data = await readFile(file);
      const parsedData = parseExcelData(data);
      setExcelData(parsedData);
      setShowPreview(true);
      setActiveTab('preview');
    } catch (error) {
      console.error('Error occurred while reading the file:', error);
      setExcelData([]);
      setShowPreview(false);
      setActiveTab('upload');
      alert('Error occurred while reading the file. Please try again.');
    }
  };

  const readFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(new Uint8Array(e.target.result));
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const parseExcelData = (data) => {
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (rows.length === 0) {
      return [];
    }

    const headers = rows[0];
    const parsedData = rows.slice(1).map((row) => {
      const rowData = {};
      Object.keys(headers).forEach((headerKey) => {
        const header = headers[headerKey];
        const cellValue = row[headerKey];
        rowData[header] = parseCellValue(cellValue, header);
      });
      return rowData;
    });

    return parsedData;
  };

  const parseCellValue = (value, header) => {
    if (typeof value === 'string') {
      return value.trim();
    }
    // Convert birthdate to date format
    if (header.toLowerCase().replace(/\s/g, '').includes('birthdate')) {
      return convertExcelDateToDate(value);
    }
    return value;
  };

  const convertExcelDateToDate = (excelDateValue) => {
    if (!excelDateValue) return null;

    const excelDateNumber = parseFloat(excelDateValue);

    if (isNaN(excelDateNumber)) return null;

    const excelDateInMS = (excelDateNumber - 25569) * 86400 * 1000;
    const dateObj = new Date(excelDateInMS);

    return dateObj.toLocaleDateString(); // Return date in locale format
  };

  const handleEditClick = (rowData) => {
    setEditRowData(rowData);
    setEditedData(rowData); // Initialize edited data with current row data
    setEditModalShow(true);
  };

  const handleCloseEditModal = () => {
    setEditModalShow(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData({ ...editedData, [name]: value });
  };

  const handleSaveChanges = () => {
    // Update excelData with editedData
    const updatedData = excelData.map((row) => {
      if (row === editRowData) {
        return { ...row, ...editedData };
      }
      return row;
    });

    setExcelData(updatedData);
    setEditModalShow(false);
  };

  const handleSaveData = async () => {
    try {
      const response = await fetch(variables.API_URL + 'UploadEmp/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(excelData),
      });

      if (!response.ok) {
        throw new Error('Failed to save data.');
      }

      alert('Data saved successfully!');
    } catch (error) {
      console.error('Error occurred while saving data:', error);
      alert('Error occurred while saving data. Please try again later.');
    }
  };

  return (
    <div>
      <div id="wrapper">
        {/* Sidebar */}
        <Navbar />
        {/* Content Wrapper */}
        <div id="content-wrapper" className="d-flex flex-column">
          {/* Main Content */}
          <div id="content">
            {/* Topbar */}
            <TopNavbar />
            {/* Start of Page Content */}
            <div className="container-fluid">
              <div className="row justify-content-center">
                <div className="col-xl-12 col-lg-12">
                  <div className="card shadow mb-4">
                    <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                      <ul className="nav nav-tabs">
                        <li className="nav-item">
                          <a
                            className={`nav-link ${activeTab === 'upload' ? 'active' : ''}`}
                            id="upload-tab"
                            data-toggle="tab"
                            href="#uploadForm"
                            role="tab"
                            aria-controls="uploadForm"
                            aria-selected={activeTab === 'upload'}
                          >
                            Upload
                          </a>
                        </li>
                        <li className="nav-item">
                          <a
                            className={`nav-link ${activeTab === 'preview' ? 'active' : ''}`}
                            id="reports-tab"
                            data-toggle="tab"
                            href="#newHireReports"
                            role="tab"
                            aria-controls="newHireReports"
                            aria-selected={activeTab === 'preview'}
                          >
                            Preview
                          </a>
                        </li>
                      </ul>
                    </div>
                    <div className="card-body">
                      <div className="tab-content">
                        <div
                          className={`tab-pane fade ${activeTab === 'upload' ? 'show active' : ''}`}
                          id="uploadForm"
                          role="tabpanel"
                          aria-labelledby="upload-tab"
                        >
                          <div className="card-body">
                            <div className="d-flex justify-content-center">
                              <form className="user" encType="multipart/form-data">
                                <div className="form-group">
                                  <input
                                    type="file"
                                    className="form-control-file"
                                    aria-describedby="fileHelp"
                                    onChange={handleFileChange}
                                  />
                                  <small id="fileHelp" className="form-text text-muted">
                                    Choose a file to upload.
                                  </small>
                                </div>
                                <div className="text-center">
                                  <button
                                    type="submit"
                                    onClick={handleSubmit}
                                    className="btn btn-primary btn-user btn-block col-md-6"
                                  >
                                    Upload File
                                  </button>
                                </div>
                              </form>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`tab-pane fade ${activeTab === 'preview' ? 'show active' : ''}`}
                          id="newHireReports"
                          role="tabpanel"
                          aria-labelledby="reports-tab"
                        >
                          <div className="card-body">
                            <div className="table-responsive">
                              {showPreview && excelData.length > 0 && (
                                <div>
                                  <h5 className="mb-3 font-weight-bold">Preview of the Uploaded Data</h5>
                                  <table className="table table-bordered table-hover">
                                    <thead>
                                      <tr>
                                        <th>ACTION</th>
                                        {Object.keys(excelData[0]).map((header) => (
                                          <th key={header}>{header}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {excelData.map((row, index) => (
                                        <tr key={index}>
                                          <td>
                                            <button
                                              className="update-button btn btn-xs"
                                              onClick={() => handleEditClick(row)}
                                            >
                                              <i className="fas fa-pencil-alt"></i>
                                            </button>
                                          </td>
                                          {/* {Object.keys(row).map((key) => (
                                            <td key={key}>
                                              {key.toLowerCase().includes('birthdate') ? convertExcelDateToDate(row[key]) : row[key]} */}
                                               {Object.keys(row).map((key) => (
                                            <td key={key}>
                                              {key.toLowerCase().replace(/\s/g, '').includes('birthdate') ? 
                                                convertExcelDateToDate(row[key]) : 
                                                row[key]
                                              }

                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                  <div>
                                  <div className="text-center mt-3">
                                    <button className="btn btn-success mr-2" onClick={handleSaveData}>
                                      Submit Data
                                    </button>
                                  </div>
                                  </div>
                                  <br/>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* /.container-fluid */}
          </div>
          {/* Footer */}
          <Footer />
          {/* End of Page Content */}
        </div>
        {/* End of Content Wrapper */}
      </div>
      {/* End of Page Wrapper */}

      {/* Edit Modal */}
      <Modal show={editModalShow} onHide={handleCloseEditModal} dialogClassName="custom-modal">
        <Modal.Header >
          <Modal.Title>Update employee information</Modal.Title>
          <Button variant="default" onClick={handleCloseEditModal}>
            X
          </Button>
        </Modal.Header>
        <Modal.Body>
          {editRowData && (
            <div>
              <Row>
                {Object.keys(editRowData).map((key) => (
                  <Col key={key} md={4}>
                    <div className="form-group">
                      <label>{key}</label>
                      <input
                        type="text"
                        className={`form-control auto-width-input`} // Apply CSS class here
                        name={key}
                        value={editedData[key] || ''}
                        onChange={handleInputChange}
                      />
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEditModal}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default NewHireUpload;
