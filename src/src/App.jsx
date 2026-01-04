import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import Kalpvriksha from './components/Kalpvriksha'
import Chat from './components/Chat'
import Register from './components/Register'
import PrivateVentingRoom from './components/PrivateVentingRoom'
import Dashboard from './components/Dashboard'
import Onboarding from './components/Onboarding'
import SideBar from './components/SideBar'
import MagicBento from './components/MagicBento'
import ChatHistory from './components/ChatHistory'
import TasksManager from './components/TasksManager'
import Consultant from './components/Consultant'
import Ar_breathing from './components/Ar_breathing'
import SignIn from './components/SignIn'
import Meditation from './components/Meditation'
import Resources from './components/Resources'
import Community from './components/Community'
import CounselorDashboard from './components/CounselorDashboard'
import Assessments from "./components/Assessments";
import Inkblot from "./components/Inkblot";
import VrMeditation from "./components/VrMeditation";

//children routes
function App() {

  const router = createBrowserRouter([
    {
      path: "/",
      element:
        <div>
          <LandingPage />

        </div>
    },

    {
      path: "/signin",
      element: <SignIn />
    },

    {
      path: "/register",
      element: <Register />
    },
    {
      path: "/start-journey",
      element: <Onboarding />
    },

    {
      path: "/app",
      element: <SideBar />,
      children: [
        {
          path: "chat",
          element: <Chat />,
          children: [{
            path: ":id",
            element: <ChatHistory />
          }]
        },
        {
          path: "dashboard",
          element: <Dashboard />
        },
        {
          path: "private-venting",
          element: <PrivateVentingRoom />
        },
        {
          path: "tasks-manager",
          element: <TasksManager />
        },
        {
          path: "consultation",
          element: <Consultant />
        },
        {
          path: "community",
          element: <Community />
        },
        {
          path: "meditation",
          element: <Meditation />
        },
        {
          path: "ar-breathing",
          element: <Ar_breathing />
        },
        {
          path: "vr-meditation",
          element: <VrMeditation />
        },
        {
          path: "assessments",
          element: <Assessments />
        },
        {
          path: "inkblot",
          element: <Inkblot />
        },
        {
          path: "resources",
          element: <Resources />
        },
        {
          path: "counselor-dashboard",
          element: <CounselorDashboard />
        }
      ]
    }
  ])

  return (
    <RouterProvider router={router} />
  )
}

export default App
