import { Link } from "react-router-dom";

const Unauthorized = () => (
  <div className="min-h-screen flex flex-col items-center justify-center text-center">
    <h1 className="text-3xl font-bold mb-4">403 – Unauthorized</h1>
    <p className="text-gray-500 mb-6">You don't have permission to access this page.</p>
    <Link to="/login" className="text-[#db6747] font-bold">Go to Login</Link>
  </div>
);

export default Unauthorized;
