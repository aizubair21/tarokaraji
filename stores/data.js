import { defineStore } from 'pinia'

export const useDataStore = defineStore('data', () => {

    const months = ref(
        [
            'September',
            'October',
            'November',
            'December',
            'January', 
            'February', 
            'March', 
            'April',
            'May',
            'June', 
            'July', 
            'August', 
        ]
    );
    const sessions = ref(
        [
            '2023-24',
            '2024-25',
            '2025-26',
            '2026-27',
            '2027-28',
        ]
    );

    const payTo = ref(

        [
            'Cashier(amimul)',
            'Cashier(Raju)',
            'Cashier(Jakaria)',
            'Zobair',
        ]
    );

    const types = ref(['Monthly', 'Yearly', 'Maintainanc']);
    const methods = ref(['Bkash', 'Nogod', 'Cash', 'Bank']);


    return {months, sessions, types, methods}
}
);