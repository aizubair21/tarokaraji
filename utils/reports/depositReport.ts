interface DepositReportOptions {
  userId?: string | null
  session?: string | null
}


export function buildDepositReport(
  options: DepositReportOptions
) {

  const transactions = useDepositsStore().all;
  const users = useUsersStore().user;
  const sessions = useSessionsStore().session;
  const {
    // users,
    // sessions,
    // transactions,
    userId,
    session
  } = options


  // --------------------------------
  // 1. Filter users
  // --------------------------------

  const filteredUsers = userId
    ? users.filter(user => user.user_id === userId)
    : users


  // --------------------------------
  // 2. Filter transactions
  // --------------------------------

  const filteredTransactions = transactions.filter(transaction => {

    const matchUser =
      !userId ||
      transaction.user_id === userId

    const matchSession =
      !session ||
      transaction.session === session

    return matchUser && matchSession
  })


  // --------------------------------
  // 3. Calculate each user
  // --------------------------------

  const userReports = filteredUsers.map(user => {

    const userTransactions =
      filteredTransactions.filter(
        transaction =>
          transaction.user_id === user.user_id
      )


    return {
      user,
      userTransactions,
      sessions,
      session
    }

  })


  // --------------------------------
  // 4. Calculate summary
  // --------------------------------

  return {
    users: userReports,

    summary: calculateSummary(userReports),

    monthly: calculateTypeSummary(
      userReports,
      'monthly'
    ),

    yearly: calculateTypeSummary(
      userReports,
      'yearly'
    ),

    cost: calculateTypeSummary(
      userReports,
      'cost'
    )
  }
      }
