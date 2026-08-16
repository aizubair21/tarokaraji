import { defineStore } from 'pinia'

export const useUsersStore = defineStore('users', () => {

	const user = ref([]);
    const auth = useAuthStore();
    auth.isLoading = false;

    const fetchUsers = async () => 
    {
        auth.isLoading = true;
        user.value = await $fetch('/api/crud/Users');
        auth.isLoading = false;
    };

    const admins = async () => {
        return await user.value.filter(m => m.role == 'admin' && m.status ==  'active');
    };

    return {
        fetchUsers, user, admins,
    };
});