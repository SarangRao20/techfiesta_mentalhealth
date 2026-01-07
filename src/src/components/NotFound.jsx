import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-purple-600">404</h1>
          <div className="text-6xl mb-4">🌸</div>
          <h2 className="text-3xl font-semibold text-gray-800 mb-2">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            Oops! The page you're looking for seems to have wandered off the path.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            to="/" 
            className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            Go Home
          </Link>
          <Link 
            to="/app/dashboard" 
            className="block w-full bg-white hover:bg-gray-50 text-purple-600 font-semibold py-3 px-6 rounded-lg border-2 border-purple-600 transition duration-200"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
