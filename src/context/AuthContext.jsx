import { createContext, useContext, useEffect, useState } from 'react'
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getRedirectResult,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import { auth } from '../firebase'
import { createUserProfile, ensureGoogleUserProfile, getUserProfile, isAdminEmail, subscribeUserProfile } from '../services/firestoreService'

const AuthContext = createContext(null)

let creatingAccount = false

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    let profileUnsub = null

    // Tangani hasil jika browser menggunakan redirect untuk Google Login
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await ensureGoogleUserProfile(result.user)
          setUser(result.user)
        }
      })
      .catch((err) => {
        console.warn('Google redirect result:', err)
      })

    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      if (profileUnsub) {
        profileUnsub()
        profileUnsub = null
      }

      setUser(nextUser)
      if (nextUser) {
        try {
          if (!creatingAccount) {
            await ensureGoogleUserProfile(nextUser)
          }
        } catch {
          // ignore
        }

        profileUnsub = subscribeUserProfile(
          nextUser.uid,
          (liveProfile) => {
            setProfile(liveProfile)
            setLoading(false)
          },
          () => {
            getUserProfile(nextUser.uid)
              .then(setProfile)
              .catch(() => {
                setProfile({
                  role: isAdminEmail(nextUser.email) ? 'admin' : 'viewer',
                  name: nextUser.displayName || '',
                })
              })
              .finally(() => setLoading(false))
          },
        )
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      unsub()
      if (profileUnsub) profileUnsub()
    }
  }, [])

  const login = async (email, password, remember = false) => {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
    const result = await signInWithEmailAndPassword(auth, email, password)
    const userProfile = await ensureGoogleUserProfile(result.user)
    setUser(result.user)
    setProfile(userProfile)
    return { user: result.user, profile: userProfile }
  }

  const loginWithGoogle = async (remember = false) => {
    await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    try {
      const result = await signInWithPopup(auth, provider)
      const userProfile = await ensureGoogleUserProfile(result.user)
      setUser(result.user)
      setProfile(userProfile)
      return { user: result.user, profile: userProfile }
    } catch (err) {
      if (err?.code === 'auth/popup-blocked') {
        return signInWithRedirect(auth, provider)
      }
      throw err
    }
  }

  const resetPassword = (email) => sendPasswordResetEmail(auth, email)
  const logout = () => signOut(auth)

  const register = async (email, password, name = '') => {
    creatingAccount = true
    try {
      const result = await createUserWithEmailAndPassword(auth, email.trim(), password)
      const userProfile = await createUserProfile({
        ...result.user,
        displayName: name.trim() || '',
      })
      setUser(result.user)
      setProfile(userProfile)
      return { user: result.user, profile: userProfile }
    } finally {
      creatingAccount = false
    }
  }

  const role = profile?.role || 'viewer'
  const isAdmin = role === 'admin'
  const isPetugas = role === 'petugas'
  const isViewer = role === 'viewer'
  const canWrite = isAdmin || isPetugas

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        loginWithGoogle,
        resetPassword,
        logout,
        role,
        isAdmin,
        isPetugas,
        isViewer,
        canWrite,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
