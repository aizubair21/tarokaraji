import { defineStore } from 'pinia'

export const useSessionsStore = defineStore('sessions', () => {

    const session = ref([]);
    const auth = useAuthStore();
    auth.isLoading = false;

    const fetchSessions = async () => 
    {
        auth.isLoading = true;
        session.value = await $fetch('/api/crud/Transactions');
        auth.isLoading = false;
    };

    return {
        fetchSessions, session,
    };
});