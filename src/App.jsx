import './App.css'
import './medata.css'
import './animations.css'
import './reference.css'
import './reference-light.css'
import './reference-login.css'
import './reference-login-ambient.css'
import './reference-login-dark.css'
import './reference-login-light.css'
import './internal-pages.css'
import './splash.css'
import './theme.css'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <div className="app-root min-h-screen flex flex-col">
      <AppRoutes />
    </div>
  )
}

export default App
