import { useState } from "react";
import { FaEye, FaTrashAlt, FaPrint, FaEdit, FaChevronDown } from "react-icons/fa";
import MaintenanceBg from "../../assets/images/maintenancebg.png";
import logo from '../../assets/images/logo.png';

const AdminMaintenanceCards = () => {
  const [requests, setRequests] = useState([
    {
      unit: "101",
      name: "Lance Atendidas",
      messagetitle: "Lights Flickering",
      category: "Electrical Maintenance",
      requestDate: "June 5, 2025",
      startDate: "---",
      endDate: "---",
      status: "Pending",
      message: "The lights in the hallway are flickering.",
      followUp: true,
      followUpResolved: false,
    },
    {
      unit: "102",
      name: "Matthew Karl Batista",
      messagetitle: "Kitchen Sink Leak",
      category: "Water Maintenance",
      requestDate: "June 8, 2025",
      startDate: "June 9, 2025",
      endDate: "Ongoing",
      status: "In Progress",
      message: "There is a leak under the kitchen sink.",
      followUp: false,
      followUpResolved: true,
    },
  ]);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmDeleteIndex, setConfirmDeleteIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addRequestModalVisible, setAddRequestModalVisible] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editIndex, setEditIndex] = useState(null);

  const [newRequest, setNewRequest] = useState({
    unit: "",
    name: "",
    messagetitle: "",
    category: "",
    requestDate: "",
    startDate: "---",
    endDate: "---",
    status: "Pending",
    message: "",
    followUp: false,
    followUpResolved: false,
  });

  const handleStatusChange = (index, newStatus) => {
    const updated = [...requests];
    updated[index].status = newStatus;
    // Clears the red indicator if status moves forward
    updated[index].followUpResolved = (newStatus === "In Progress" || newStatus === "Done");
    setRequests(updated);
  };

  const handleDelete = (index) => {
    const updated = [...requests];
    updated.splice(index, 1);
    setRequests(updated);
  };

  const openAddRequestModal = () => {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    setNewRequest({ ...newRequest, requestDate: today });
    setAddRequestModalVisible(true);
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setNewRequest(requests[index]);
    setIsEditing(true);
    setAddRequestModalVisible(true);
  };

  const closeAddRequestModal = () => {
    setNewRequest({ unit: "", name: "", messagetitle: "", category: "", requestDate: "", startDate: "---", endDate: "---", status: "Pending", message: "", followUp: false, followUpResolved: false });
    setAddRequestModalVisible(false);
    setIsEditing(false);
    setEditIndex(null);
  };

  const handleNewRequestChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewRequest({ ...newRequest, [name]: type === "checkbox" ? checked : value });
  };

  const saveRequest = () => {
    if (isEditing) {
      const updated = [...requests];
      updated[editIndex] = { ...newRequest };
      setRequests(updated);
    } else {
      setRequests([...requests, { ...newRequest }]);
    }
    closeAddRequestModal();
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredRequests = requests.filter((req) => {
    const query = searchQuery.toLowerCase();
    return (
      req.unit.toLowerCase().includes(query) ||
      req.name.toLowerCase().includes(query) ||
      req.messagetitle.toLowerCase().includes(query) ||
      req.category.toLowerCase().includes(query)
    );
  });

  return (
    <div className="bg-gradient-to-r from-[#f7b094] to-[#dd7255] rounded-2xl w-full h-full px-4 sm:px-8 py-7 flex flex-col gap-3 md:gap-4 printable-area">
      
      {/* Integrated Caretaker Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .printable-content, .printable-content * { visibility: visible; }
          .printable-content { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            background: white !important;
            padding: 20px;
          }
          .no-print { display: none !important; }
          table { 
            color: black !important; 
            border-collapse: collapse !important; 
            width: 100% !important; 
            margin-top: 10px;
          }
          th, td { 
            border: 1px solid #000 !important; 
            padding: 8px !important; 
            color: black !important; 
          }
          thead tr { background-color: #f2f2f2 !important; -webkit-print-color-adjust: exact; }
          .print-header-visible { display: flex !important; visibility: visible !important; }
        }
      `}</style>

      {/* Header */}
      <div
        className="flex flex-col bg-cover bg-center items-center text-center sm:text-start sm:items-start text-white px-8 py-8 shadow-[5px_5px_0px_#330101] md:shadow-[10px_8px_0px_#330101] rounded-3xl w-full no-print"
        style={{ backgroundImage: `url(${MaintenanceBg})` }}
      >
        <h1 className="font-BoldMilk tracking-[3px] md:tracking-[12px] text-xl md:text-2xl uppercase">
          Maintenance Requests
        </h1>
      </div>

      {/* Table Section */}
      <div className="h-full bg-gradient-to-r from-[#ffebdf] to-[#f2c9b1] shadow-[5px_5px_0px_#330101] md:shadow-[10px_8px_0px_#330101] flex flex-col gap-2 rounded-2xl px-4 md:px-8 py-5">
        
        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch gap-y-2 md:gap-4 no-print">
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="h-5 w-5 text-black opacity-70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by Unit, Name, Title, Category"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-sm pl-10 pr-4 py-2 border border-[#330101] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4b150d]/20"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={openAddRequestModal}
              className="flex items-center justify-center whitespace-nowrap px-6 py-2 text-xs md:text-sm bg-[#4b150d] text-[#efd4c4] font-RegularMilk rounded-lg shadow hover:bg-[#5c1a12] transition cursor-pointer"
            >
              + ADD REQUEST
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center p-3 bg-[#4b150d] text-[#efd4c4] rounded-lg shadow hover:bg-[#5c1a12] transition cursor-pointer active:scale-95"
              title="Print Table"
            >
              <FaPrint size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto printable-content">
          {/* MGC BUILDING PRINT HEADER (Visible only on print) */}
          <div className="hidden print-header-visible items-center justify-between border-b-2 border-black pb-4 mb-6 text-black">
            <div className="flex items-center gap-4">
              <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
              <div className="text-left">
                <h1 className="text-2xl font-bold tracking-tight">MGC BUILDING</h1>
                <p className="text-xs uppercase tracking-widest text-gray-600">Maintenance Summary Report</p>
              </div>
            </div>
            <div className="text-right text-xs">
              <p>Date Generated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <table className="w-full border-separate border-spacing-y-1 text-left">
            <thead>
              <tr className="bg-[#4b150d] text-[#efd4c4] uppercase tracking-[2px] text-[10px] font-RegularMilk">
                <th className="py-3 px-4">Unit No.</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Message</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Request Date</th>
                <th className="py-3 px-4">Start Date</th>
                <th className="py-3 px-4">End Date</th>
                <th className="py-3 px-4 text-center no-print">Status</th>
                <th className="py-3 px-4 text-center no-print">Actions</th>
                <th className="py-3 px-4 text-center no-print">Follow-Ups</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req, index) => (
                <tr
                  key={index}
                  className={`bg-white text-black text-sm print:bg-white print:border-none ${
                    req.followUp && !req.followUpResolved ? "border-l-4 border-red-500 bg-red-50" : ""
                  }`}
                >
                  <td className="py-3 px-4 font-bold">{req.unit}</td>
                  <td className="py-3 px-4">{req.name}</td>
                  <td className="py-3 px-4 italic">"{req.messagetitle}"</td>
                  <td className="py-3 px-4">{req.category}</td>
                  <td className="py-3 px-4">{req.requestDate}</td>
                  <td className="py-3 px-4">{req.startDate}</td>
                  <td className="py-3 px-4">{req.endDate}</td>

                  <td className="py-3 px-4 text-center no-print">
                    <div className="relative inline-flex items-center">
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(index, e.target.value)}
                        className={`appearance-none cursor-pointer inline-block pl-4 pr-8 py-1 rounded-full text-[10px] font-bold uppercase border-2 transition-all outline-none
                        ${req.status === "Pending" ? "border-yellow-500 text-yellow-600 bg-yellow-50" : ""}
                        ${req.status === "Approved" ? "border-teal-500 text-teal-600 bg-teal-50" : ""}
                        ${req.status === "In Progress" ? "border-blue-500 text-blue-600 bg-blue-50" : ""}
                        ${req.status === "Done" ? "border-green-500 text-green-600 bg-green-50" : ""}
                      `}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Done">Done</option>
                      </select>
                      <FaChevronDown className="absolute right-3 pointer-events-none text-[8px] text-black/50" />
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center no-print">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setSelectedRequest(req)} className="p-2 bg-[#d45f41] text-white rounded-lg active:scale-90" title="View"><FaEye size={14} /></button>
                      <button onClick={() => handleEdit(index)} className="p-2 bg-blue-600 text-white rounded-lg active:scale-90" title="Edit"><FaEdit size={14} /></button>
                      <button onClick={() => setConfirmDeleteIndex(index)} className="p-2 bg-[#4b150d] text-[#efd4c4] rounded-lg active:scale-90" title="Delete"><FaTrashAlt size={14} /></button>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center no-print">
                    {req.followUp && (
                      <span className={`${req.followUpResolved ? "bg-gray-400 text-gray-100" : "bg-red-600 text-white"} text-[10px] font-bold px-2 py-1 rounded shadow`}>
                        REQUESTED
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Request Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-lg relative mx-5">
            <h2 className="text-xl font-bold mb-4">Maintenance Details</h2>
            <div className="space-y-2 text-sm text-black">
              <p><strong>Unit:</strong> {selectedRequest.unit} - {selectedRequest.name}</p>
              <p><strong>Title:</strong> {selectedRequest.messagetitle}</p>
              <p><strong>Category:</strong> {selectedRequest.category}</p>
              <div className="p-3 bg-gray-50 rounded border text-black"><strong>Message:</strong> {selectedRequest.message}</div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div><p className="text-xs text-gray-500 uppercase">Requested</p><p>{selectedRequest.requestDate}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Started</p><p>{selectedRequest.startDate}</p></div>
                <div><p className="text-xs text-gray-500 uppercase">Finished</p><p>{selectedRequest.endDate}</p></div>
              </div>
              {selectedRequest.followUp && (
                <p className={`mt-2 font-semibold ${selectedRequest.followUpResolved ? "text-gray-500" : "text-red-600"}`}>
                  ⚠️ Tenant sent a follow-up reminder
                </p>
              )}
            </div>
            <button onClick={() => setSelectedRequest(null)} className="absolute top-4 right-4 text-gray-500 hover:text-black cursor-pointer text-2xl">&times;</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteIndex !== null && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-lg relative text-center">
            <h2 className="text-lg font-bold text-[#4b150d] mb-4">Are you sure you want to delete this request?</h2>
            <div className="flex justify-center gap-4">
              <button onClick={() => { handleDelete(confirmDeleteIndex); setConfirmDeleteIndex(null); }} className="bg-red-500 text-white px-4 py-2 rounded cursor-pointer">Yes, Delete</button>
              <button onClick={() => setConfirmDeleteIndex(null)} className="bg-gray-300 px-4 py-2 rounded cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Request Modal with Labels */}
      {addRequestModalVisible && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-center items-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg mx-5">
            <h2 className="text-xl font-bold mb-4 text-black">
              {isEditing ? "Edit Maintenance Request" : "Add Maintenance Request"}
            </h2>
            
            <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Unit Number</label>
                <input name="unit" placeholder="e.g. 101" value={newRequest.unit} onChange={handleNewRequestChange} className="w-full px-3 py-2 border rounded text-black text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Resident Full Name</label>
                <input name="name" placeholder="Name" value={newRequest.name} onChange={handleNewRequestChange} className="w-full px-3 py-2 border rounded text-black text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Issue Title</label>
                <input name="messagetitle" placeholder="Short description" value={newRequest.messagetitle} onChange={handleNewRequestChange} className="w-full px-3 py-2 border rounded text-black text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                <input name="category" placeholder="Electrical, Plumbing, etc." value={newRequest.category} onChange={handleNewRequestChange} className="w-full px-3 py-2 border rounded text-black text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Date Requested</label>
                <input name="requestDate" value={newRequest.requestDate} onChange={handleNewRequestChange} className="w-full px-3 py-2 border rounded text-black text-sm bg-gray-50" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Start Date</label>
                  <input name="startDate" placeholder="---" value={newRequest.startDate} onChange={handleNewRequestChange} className="w-full px-3 py-2 border rounded text-black text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">End Date</label>
                  <input name="endDate" placeholder="---" value={newRequest.endDate} onChange={handleNewRequestChange} className="w-full px-3 py-2 border rounded text-black text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
                <select name="status" value={newRequest.status} onChange={handleNewRequestChange} className="w-full px-3 py-2 border rounded text-black text-sm">
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Full Details</label>
                <textarea name="message" placeholder="Explain the issue..." value={newRequest.message} onChange={handleNewRequestChange} className="w-full px-3 py-2 border rounded text-black text-sm h-24" />
              </div>

              <label className="flex items-center gap-2 text-sm text-black cursor-pointer">
                <input type="checkbox" name="followUp" checked={newRequest.followUp} onChange={handleNewRequestChange} />
                Toggle Follow-Up Alert
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={closeAddRequestModal} className="px-4 py-2 bg-gray-300 rounded cursor-pointer text-black text-sm font-semibold">Cancel</button>
              <button onClick={saveRequest} className="px-4 py-2 bg-[#4b150d] text-white rounded cursor-pointer text-sm font-semibold uppercase">{isEditing ? "Update" : "Save"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMaintenanceCards;