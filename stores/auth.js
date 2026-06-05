import { defineStore } from 'pinia'
import bcrypt from 'bcryptjs'


export const useAuthStore = defineStore('auth', () => {
  const token = ref(null)
  const role = ref(null)
  const userId = ref(null)
  const userName = ref(null);
  const isLoading = ref(false)
  const currentMonth = ref()
  const currentSession = ref()
  
  const data = useDataStore();

  const login = async (email) => {

    // Validate phone number
    // const phoneRegex = /^(017|013|018|019|014|015)\d{8}$/
    // if (!phoneRegex.test(phone)) {
    //   throw new Error('Invalid phone number.')
    // }

    const now = new Date()
    const users = await $fetch('/api/sheets/users')
    //console.log(users)
    
    const user = users.find(u => u[12] == email)
    if (!user) throw new Error('User not found')

    token.value = now;
    role.value = user[17]
    userId.value = user[16]
    userName.value = user[2]

    // Set current month and session
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    currentMonth.value = monthNames[now.getMonth()]
    const year = now.getFullYear()
    const month = now.getMonth() + 1 // 1-12
    if (month >= 9) { 
      // September or later
      currentSession.value = `${year}-${year + 1 - 2000}`
    } else {
      currentSession.value = `${year - 1}-${year - 2000}`
    }

  }

  const logout = () => {
    token.value = null
    role.value = null
    userId.value = null
    userName.value= null
  }

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => role.value === 'admin')
  

  return { token, role, userId, login, logout, isAuthenticated, isAdmin, userName, isLoading, currentMonth, currentSession }
}, {
  persist: true,
})
