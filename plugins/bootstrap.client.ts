// plugins/bootstrap.ts
export default defineNuxtPlugin(async () => {
  const userStore = useUsersStore()
  const sessionStore = useSessionsStore()
  const transactionStore = useDepositsStore()

  await Promise.all([
    userStore.fetchUsers(),
    sessionStore.fetchSessions(),
    transactionStore.fetchDeposits()
  ])
})