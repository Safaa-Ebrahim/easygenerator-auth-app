import { Navigate, Route, Routes } from 'react-router'
import { Toaster } from 'sonner'
import { ProtectedRoute, PublicOnlyRoute } from './auth/routes'
import { ApplicationPage } from './pages/ApplicationPage'
import { SignInPage } from './pages/SignInPage'
import { SignUpPage } from './pages/SignUpPage'
import { ROUTES } from './paths'
import { useTheme } from './theme/theme'

function App() {
  const { theme } = useTheme()

  return (
    <>
      <Routes>
        <Route
          path={ROUTES.signUp}
          element={
            <PublicOnlyRoute>
              <SignUpPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path={ROUTES.signIn}
          element={
            <PublicOnlyRoute>
              <SignInPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path={ROUTES.app}
          element={
            <ProtectedRoute>
              <ApplicationPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to={ROUTES.app} replace />} />
      </Routes>
      {/* Transient notices (signed out, session expired, account created). */}
      <Toaster position="top-center" theme={theme} richColors closeButton />
    </>
  )
}

export default App
