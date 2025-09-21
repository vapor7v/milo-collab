import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="text-center bg-white rounded-2xl shadow-lg p-10">
        <h1 className="text-5xl font-extrabold text-blue-600 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <a
          href="/"
          className="text-blue-600 hover:text-blue-800 underline font-semibold"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
