import { defineStore } from 'pinia'

export const useDepositsStore = defineStore('deposits', () => {

    const all = ref([]);
    const auth = useAuthStore();
    auth.isLoading = false;

    const fetchDeposits = async () => 
    {
        auth.isLoading = true;
        all.value = await $fetch('/api/crud/Transactions');
        auth.isLoading = false;
    };

    return {
        fetchDeposits, all,
    };
});