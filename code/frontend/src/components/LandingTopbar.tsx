import { Link } from "react-router-dom";

export default function LandingTopbar() {
  return (
    <div className="w-full flex justify-between items-center px-8 py-4 bg-gray-900 border-b border-gray-700">
      <h1 className="text-2xl font-bold text-white">FitnessBro</h1>

      <div className="flex gap-4">
        <Link
          to="/login"
          className="text-white hover:text-blue-400 transition"
        >
          Login
        </Link>

        <Link
          to="/signup"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white transition"
        >
          Signup
        </Link>
      </div>
    </div>
  );
}
