// stores/auth.ts
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const isLoading = ref(false);
  const currentMonth = ref('');
  const currentSession = ref('');
  const dataStore = useDataStore(); // your data store
  // const users = useUsersStore().user;

  // Fetch current user on app start
  const fetchUser = async () => {
    try {
      const userData = await $fetch('/api/auth/me');
      user.value = userData;
    } catch {
      user.value = null;
    }
  };

  const login = async (email) => {
    isLoading.value = true;
    try {
      const users = await $fetch('/api/crud/Users');
      const logedUser = users.find(u => u.email === email);
      //console.log(logedUser);
      if (!logedUser) throw new Error('Invalid Creadentials !');

      // const response = await $fetch('/api/auth/login', {
      //   method: 'POST',
      //   body: {logedUser},
      // });
      user.value = logedUser;
      
      // Set current month and session (same logic as before)
      const now = new Date();
      currentMonth.value = dataStore.months[now.getMonth() + 4] || '';
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      if (month >= 9) {
        currentSession.value = `${year}-${(year + 1) % 100}`;
      } else {
        currentSession.value = `${year - 1}-${year % 100}`;
      }
      
      return true;
    } catch (error) {
      throw new Error(error.data?.message || error);
    } finally {
      isLoading.value = false;
      dataStore.loading = false;
    }
  };

  const logout = async () => {
    user.value = null;
    navigateTo('/login');
  };

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  // Initialize: fetch user on store creation
  //fetchUser();

  return {
    user,
    isLoading,
    currentMonth,
    currentSession,
    login,
    logout,
    fetchUser,
    isAuthenticated,
    isAdmin,
  };
}, 
{
  persist:true,
}
);