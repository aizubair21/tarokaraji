import { defineStore } from 'pinia'

export const useUsersStore = defineStore('users', () => {

	const user = ref([]);
    const auth = useAuthStore();
    auth.isLoading = false;

    const fetchUsers = async () => 
    {
        auth.isLoading = true;
        const u = await $fetch('/api/crud/Users');
        user.value = await u.filter(u => u.status == 'active');
        auth.isLoading = false;
    };

    const admins = async () => {
        return await user.value.filter(m => m.role == 'admin' && m.status ==  'active');
    };

    return {
        fetchUsers, user, admins,
    };
});