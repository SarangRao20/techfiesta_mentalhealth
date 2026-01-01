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
//children routes
function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <LandingPage />
    },
    {
      path: "/register",
      element: <Register/>
    },
    {
      path: "/start-journey",
      element: <Onboarding/>
    },
    {
      path:"/app",
      element:
        <SideBar/>
,
      children:[
        {
          path:"chat",
          element:<Chat/>,
          children:[{
            path:":id",
            element:<Chat/>
          }
          ]
        },
        {
          path:"dashboard",
          element:<Dashboard/>
        }
      ]
  }
  ])
  return(
        <div>
      <RouterProvider router={router} />
    </div>

  )
}

export default App
