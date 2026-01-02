import { useState } from 'react'
import './App.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import Kalpvriksha from './components/Kalpvriksha'
import Chat from './components/Chat'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import Onboarding from './components/Onboarding'
import SideBar from './components/SideBar'
import MagicBento from './components/MagicBento'
import ChatHistory from './components/ChatHistory'
import TasksManager from './components/TasksManager'
import Consultant from './components/Consultant'
//children routes
function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element:
        <div>
          <LandingPage />
          <TasksManager/>
        </div>
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
      element:
        <SideBar />
      ,
      children: [
        {
          path: "chat",
          element: <Chat />,
          children: [{
            path: ":id",
            element: <ChatHistory />
          }
          ]
        },
        {
          path: "dashboard",
          element: <Dashboard />
        },
        {
          path: "tasks-manager",
          element: <TasksManager />
        },
        {
          path:"consultation",
          element:<Consultant/>
        },
        {
        }
      ]
    }
  ])
  return (
    <div>
      <RouterProvider router={router} />
    </div>

  )
}

export default App
