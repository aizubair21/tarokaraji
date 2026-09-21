<script setup lang="ts">
const auth = useAuthStore()
const isLoading = ref(true)
const error = ref(null)
const sessionsToProcess = ref([])

// Data stores
const users = ref([])
const deposits = ref([])
const sessions = ref([])

// Report configuration
const selectedSession = ref('all')

// Statistics
const reportStats = ref({
  totalUsers: 0,
  totalPaidMonths: 0,
  totalUnpaidMonths: 0,
  averagePaymentRate: 0,
  fullyPaidUsers: 0,
  partiallyPaidUsers: 0,
  noPaymentUsers: 0
})

// All months in Bengali
const allMonths = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const userDepositSummary = computed(() => {
  if (!users.value.length) return []

  // --------------------------------------------------
  // 1. Determine sessions to process
  // --------------------------------------------------
  const sessionsToProcess = selectedSession.value !== 'all'
    ? sessions.value.filter(
        s => s.sessionName === selectedSession.value
      )
    : sessions.value

  if (!sessionsToProcess.length) return []

  // --------------------------------------------------
  // 2. Filter deposits by selected session
  // --------------------------------------------------
  const filteredDeposits = selectedSession.value === 'all'
    ? deposits.value
    : deposits.value.filter(
        d => d.session === selectedSession.value
      )

  // --------------------------------------------------
  // 3. Group deposits by User + Session + Month
  // --------------------------------------------------
  const userDepositMap = new Map()

  filteredDeposits.forEach(deposit => {
    const userId = deposit.user_id
    const session = deposit.session
    const month = deposit.month

    if (!userDepositMap.has(userId)) {
      userDepositMap.set(userId, {
        totalDeposits: 0,
        paidMonths: new Set(),
        sessions: new Set()
      })
    }

    const userData = userDepositMap.get(userId)

    const monthKey = `${session}-${month}`

    userData.paidMonths.add(monthKey)
    userData.sessions.add(session)

    userData.totalDeposits += Number(deposit.amount) || 0
  })

  // --------------------------------------------------
  // 4. Build user summaries
  // --------------------------------------------------
  const result = []

  users.value.forEach(user => {
    const userId = user.user_id

    const userData = userDepositMap.get(userId) || {
      totalDeposits: 0,
      paidMonths: new Set(),
      sessions: new Set()
    }

    // Financial totals
    let totalTargetAmount = 0
    let totalPaidAmount = 0
    let totalDueAmount = 0

    // Month totals
    let totalPaidMonths = 0
    let totalUnpaidMonths = 0

    const paidMonthsDetails = []
    const unpaidMonthsDetails = []

    // ------------------------------------------------
    // Process every selected session
    // ------------------------------------------------
    sessionsToProcess.forEach(session => {
      const sessionName = session.sessionName

      const monthlyAmount =
        Number(session.monthlyDeposit) || 0

      const yearlyAmount =
        Number(session.yearlyDeposit) || 0

      const costAmount =
        Number(session.cost) || 0

      // ----------------------------------------------
      // Monthly target
      // ----------------------------------------------
      const monthlyTarget =
        monthlyAmount * allMonths.length

      totalTargetAmount += monthlyTarget

      // ----------------------------------------------
      // Monthly payments
      // ----------------------------------------------
      allMonths.forEach(month => {
        const monthKey = `${sessionName}-${month}`

        if (userData.paidMonths.has(monthKey)) {
          totalPaidMonths++

          totalPaidAmount += monthlyAmount

          paidMonthsDetails.push({
            session: sessionName,
            month,
            amount: monthlyAmount
          })
        } else {
          totalUnpaidMonths++

          totalDueAmount += monthlyAmount

          unpaidMonthsDetails.push({
            session: sessionName,
            month,
            amount: monthlyAmount
          })
        }
      })

      // ----------------------------------------------
      // Yearly deposit
      // ----------------------------------------------
      totalTargetAmount += yearlyAmount

      // TODO:
      // Yearly payment should be detected separately
      // from monthly payments.
      //
      // For now this is NOT added to paid amount.
      // It remains part of the due amount.
      // totalDueAmount += yearlyAmount

      // ----------------------------------------------
      // Yearly cost / maintenance
      // ----------------------------------------------
      totalTargetAmount += costAmount

      // TODO:
      // Same as yearly deposit:
      // detect whether this cost was actually paid.
      // totalDueAmount += costAmount
    })

    // --------------------------------------------------
    // 5. Correct due calculation
    // --------------------------------------------------
    //
    // If yearly/cost payments are later detected,
    // this formula will automatically remain correct.
    //
    totalDueAmount =
      Math.max(totalTargetAmount - totalPaidAmount, 0)

    // --------------------------------------------------
    // 6. Payment rate
    // --------------------------------------------------
    const paymentRate =
      totalTargetAmount > 0
        ? (totalPaidAmount / totalTargetAmount) * 100
        : 0

    // --------------------------------------------------
    // 7. Status
    // --------------------------------------------------
    let status = 'no_payment'

    if (totalTargetAmount > 0 && totalDueAmount === 0) {
      status = 'fully_paid'
    } else if (totalPaidAmount > 0) {
      status = 'partially_paid'
    }

    // --------------------------------------------------
    // 8. Final user result
    // --------------------------------------------------
    result.push({
      userId,

      userName:
        user.name_bangla ||
        user.name_english ||
        'Unknown',

      userEmail:
        user.email || 'N/A',

      userRole: user.role,

      // Months
      totalPaidMonths,
      totalUnpaidMonths,
      totalMonths:
        totalPaidMonths + totalUnpaidMonths,

      paidMonthsDetails,
      unpaidMonthsDetails,

      // Financial summary
      totalTargetAmount,
      totalPaidAmount,
      totalDueAmount,

      // Existing information
      totalDeposits: userData.totalDeposits,

      paymentRate,
      status
    })
  })

  // --------------------------------------------------
  // 9. Sort by payment rate
  // --------------------------------------------------
  return result.sort(
    (a, b) => b.paymentRate - a.paymentRate
  )
})


// Update report statistics
const updateReportStats = () => {
  const summary = userDepositSummary.value
  
  const fullyPaid = summary.filter(u => u.status === 'fully_paid').length
  const partiallyPaid = summary.filter(u => u.status === 'partially_paid').length
  const noPayment = summary.filter(u => u.status === 'no_payment').length
  
  reportStats.value = {
    totalUsers: summary.length,
    totalPaidMonths: summary.reduce((sum, u) => sum + u.totalPaidMonths, 0),
    totalUnpaidMonths: summary.reduce((sum, u) => sum + u.totalUnpaidMonths, 0),
    averagePaymentRate: summary.length > 0 
      ? summary.reduce((sum, u) => sum + u.paymentRate, 0) / summary.length 
      : 0,
    fullyPaidUsers: fullyPaid,
    partiallyPaidUsers: partiallyPaid,
    noPaymentUsers: noPayment
  }
}

// Fetch data
const fetchData = async () => {
  isLoading.value = true
  error.value = null
  
  try {
   
    users.value = useUsersStore().user;
    deposits.value = useDepositsStore().all;
    sessions.value = useSessionsStore().session;
    
    updateReportStats()

    const userWithDeposit = [];

  } catch (err) {
    error.value = err.message || 'Failed to fetch data'
    console.error('Error fetching data:', err)
  } finally {
    isLoading.value = false
  }
}

// Export to CSV
const exportToCSV = () => {
  const headers = ['User ID', 'Name', 'Email', 'Paid Months', 'Unpaid Months', 'Payment Rate (%)', 'Status']
  
  const rows = userDepositSummary.value.map(user => [
    user.userId,
    user.userName,
    user.userEmail,
    user.totalPaidMonths,
    user.totalUnpaidMonths,
    user.paymentRate.toFixed(2),
    user.status === 'fully_paid' ? 'সব পরিশোধিত' : user.status === 'partially_paid' ? 'আংশিক পরিশোধিত' : 'অপরিশোধিত'
  ])
  
  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `user-payment-report-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// Print report
const printReport = () => {
  window.print()
}



const expandedUser = ref<string | null>(null)

const toggleDetails = (userId: string) => {
  expandedUser.value =
    expandedUser.value === userId
      ? null
      : userId
}



const reportTotals = computed(() => {

  const summary = userDepositSummary.value

  const target = summary.reduce(
    (sum, user) =>
      sum + Number(user.totalTargetAmount || 0),
    0
  )

  const paid = summary.reduce(
    (sum, user) =>
      sum + Number(user.totalPaidAmount || 0),
    0
  )

  const due = summary.reduce(
    (sum, user) =>
      sum + Number(user.totalDueAmount || 0),
    0
  )

  const paidMonths = summary.reduce(
    (sum, user) =>
      sum + Number(user.totalPaidMonths || 0),
    0
  )

  const dueMonths = summary.reduce(
    (sum, user) =>
      sum + Number(user.totalUnpaidMonths || 0),
    0
  )

  return {
    target,
    paid,
    due,
    paidMonths,
    dueMonths,
    rate: target > 0
      ? (paid / target) * 100
      : 0
  }
})


// ======================================================
// Money formatter
// ======================================================

const formatMoney = (amount: number) => {

  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0
  }).format(Number(amount) || 0)

}


// ======================================================
// Status
// ======================================================

const statusLabel = (status: string) => {

  const labels: Record<string, string> = {
    fully_paid: 'Fully Paid',
    partially_paid: 'Partially Paid',
    no_payment: 'No Payment'
  }

  return labels[status] || status

}


const statusClass = (status: string) => {

  const classes: Record<string, string> = {

    fully_paid:
      'bg-green-100 text-green-700',

    partially_paid:
      'bg-yellow-100 text-yellow-700',

    no_payment:
      'bg-red-100 text-red-700'

  }

  return classes[status] || 'bg-gray-100 text-gray-600'

}


const progressColor = (rate: number) => {

  if (rate >= 100)
    return 'bg-green-500'

  if (rate >= 70)
    return 'bg-blue-500'

  if (rate >= 40)
    return 'bg-yellow-500'

  return 'bg-red-500'

}




watch(selectedSession, () => {
  updateReportStats()
})

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="static top-0 bg-white bg-opacity-90 backdrop-blur-md rounded-2xl md:flex justify-between items-center py-3">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ইউজার পেমেন্ট রিপোর্ট
          </h1>
          <p class="text-sm text-gray-500 mt-1">ব্যবহারকারীভিত্তিক মাসিক পরিশোধের বিস্তারিত রিপোর্ট</p>
        </div>
       <!--  <div class="flex gap-3">
          <button 
            @click="exportToCSV"
            class="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl py-2.5 px-5 hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-lg"
          >
            <i class="fas fa-download mr-2"></i> এক্সপোর্ট
          </button>
          <button 
            @click="printReport"
            class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl py-2.5 px-5 hover:from-blue-600 hover:to-indigo-700 transition-all font-semibold shadow-lg"
          >
            <i class="fas fa-print mr-2"></i> প্রিন্ট
          </button>
          <button 
            @click="fetchData"
            class="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl py-2.5 px-5 hover:from-purple-600 hover:to-pink-600 transition-all font-semibold shadow-lg"
          >
            <i class="fas fa-sync-alt mr-2"></i> রিফ্রেশ
          </button>
        </div> -->
      </div>
      
      <!-- Filters -->
      <div class="">
        <div class="flex items-center justify-between gap-3">
          <!-- <label class="block text-sm font-medium text-gray-700 mb-1">সেশন নির্বাচন</label> -->
          <select 
            v-model="selectedSession"
            class="w-full bg-white  md:w-auto px-4 py-2"
          >
            <option value="all">সব সেশন</option>
            <option v-for="session in sessions" :key="session.sessionName" :value="session.sessionName">
              {{ session.sessionName }}
            </option>
          </select>

          <div>
            <button class="print:hidden px-4 py-1" onclick="window.print()"> <i class="fas fa-print"> </i> </button>
          </div>
        </div>
      </div>
    </div>


    <!-- Overview Stats Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-xl">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm opacity-90">মোট ব্যবহারকারী</p>
            <p class="text-2xl font-bold mt-1">{{ reportStats.totalUsers }} জন</p>
          </div>
          <i class="fas fa-users text-3xl opacity-50"></i>
        </div>
      </div>
      
      <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-xl">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm opacity-90">পরিশোধিত মাস</p>
            <p class="text-2xl font-bold mt-1">{{ reportStats.totalPaidMonths }} টি</p>
          </div>
          <i class="fas fa-check-circle text-3xl opacity-50"></i>
        </div>
      </div>
      
      <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white shadow-xl">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm opacity-90">অপরিশোধিত মাস</p>
            <p class="text-2xl font-bold mt-1">{{ reportStats.totalUnpaidMonths }} টি</p>
          </div>
          <i class="fas fa-times-circle text-3xl opacity-50"></i>
        </div>
      </div>
      
      <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-5 text-white shadow-xl">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm opacity-90">গড় পরিশোধের হার</p>
            <p class="text-2xl font-bold mt-1">{{ reportStats.averagePaymentRate.toFixed(1) }}%</p>
          </div>
          <i class="fas fa-chart-line text-3xl opacity-50"></i>
        </div>
      </div>
    </div>

    <!-- Status Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div class="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-4 shadow-lg border border-green-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-green-700">সব পরিশোধিত</p>
            <p class="text-2xl font-bold text-green-700">{{ reportStats.fullyPaidUsers }} জন</p>
          </div>
          <i class="fas fa-check-circle text-4xl text-green-500"></i>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-2xl p-4 shadow-lg border border-yellow-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-yellow-700">আংশিক পরিশোধিত</p>
            <p class="text-2xl font-bold text-yellow-700">{{ reportStats.partiallyPaidUsers }} জন</p>
          </div>
          <i class="fas fa-chart-line text-4xl text-yellow-500"></i>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-red-50 to-red-100 rounded-2xl p-4 shadow-lg border border-red-200">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-red-700">অপরিশোধিত</p>
            <p class="text-2xl font-bold text-red-700">{{ reportStats.noPaymentUsers }} জন</p>
          </div>
          <i class="fas fa-exclamation-circle text-4xl text-red-500"></i>
        </div>
      </div>
    </div>

    <!-- <pre> {{ userDepositSummary }} </pre> -->

    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white rounded-2xl p-12 shadow-2xl text-center">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
      <p class="mt-4 text-gray-500">লোড হচ্ছে...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl">
      <p>{{ error }}</p>
    </div>

    <!-- User Summary Table -->
    <div v-else class="hidden bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">নাম</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">পরিশোধিত </th>
              <!-- <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">অপরিশোধিত মাস</th> -->
              <!-- <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">মোট মাস</th> -->
              <!-- <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">পরিশোধের হার</th> -->
              <!-- <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">স্ট্যাটাস</th> -->
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">বিস্তারিত</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="(user, index) in userDepositSummary" :key="user.userId" class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3 text-sm text-gray-900">{{ index + 1 }}</td>
              <!-- <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ user.userId }}</td> -->
              <td class="px-4 py-3 text-sm text-gray-800">  {{ user.userName }} ({{user.userId}}) </td>
              <td class="px-4 py-3 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {{ user.totalPaidMonths }} / {{user.totalMonths}} মাস
                </span>

                 <div class="flex items-center justify-center gap-2">
                  <div class="w-16 bg-gray-200 rounded-full h-2">
                    <div class="rounded-full h-2" 
                         :class="user.paymentRate >= 70 ? 'bg-green-500' : user.paymentRate >= 30 ? 'bg-yellow-500' : 'bg-red-500'"
                         :style="{ width: `${user.paymentRate}%` }"></div>
                  </div>
                  <span class="text-xs font-medium">{{ user.paymentRate.toFixed(0) }}%</span>
                </div>

              </td>
              <!-- <td class="px-4 py-3 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {{ user.totalUnpaidMonths }} মাস
                </span>
              </td> -->
              <!-- <td class="px-4 py-3 text-center text-sm font-medium text-gray-700">{{ user.totalMonths }} মাস</td> -->
              <!-- <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-2">
                  <div class="w-16 bg-gray-200 rounded-full h-2">
                    <div class="rounded-full h-2" 
                         :class="user.paymentRate >= 70 ? 'bg-green-500' : user.paymentRate >= 30 ? 'bg-yellow-500' : 'bg-red-500'"
                         :style="{ width: `${user.paymentRate}%` }"></div>
                  </div>
                  <span class="text-xs font-medium">{{ user.paymentRate.toFixed(0) }}%</span>
                </div>
              </td> -->
             <!--  <td class="px-4 py-3 text-center">
                <span class="px-2 py-1 rounded-full text-xs font-medium"
                      :class="{
                        'bg-green-100 text-green-800': user.status === 'fully_paid',
                        'bg-yellow-100 text-yellow-800': user.status === 'partially_paid',
                        'bg-red-100 text-red-800': user.status === 'no_payment'
                      }">
                  {{ user.status === 'fully_paid' ? 'সব পরিশোধিত' : user.status === 'partially_paid' ? 'আংশিক পরিশোধিত' : 'অপরিশোধিত' }}
                </span>
              </td> -->
              <td class="px-4 py-3 text-center">
                <details class="cursor-pointer">
                  <summary class="text-purple-600 text-sm hover:text-purple-800">
                    <i class="fas fa-eye"></i> দেখুন
                  </summary>
                  <div class="mt-2 text-left bg-gray-50 p-2 rounded text-xs">
                    <div v-if="user.unpaidMonthsDetails.length > 0">
                      <p class="font-medium text-red-600 mb-1">অপরিশোধিত মাস:</p>
                      <div class="flex flex-wrap gap-1">
                        <span v-for="unpaid in user.unpaidMonthsDetails.slice(0, 8)" :key="unpaid.month" 
                              class="bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-xs">
                          {{ unpaid.session }} - {{ unpaid.month }}
                        </span>
                        <span v-if="user.unpaidMonthsDetails.length > 8" class="text-gray-500 text-xs">
                          +{{ user.unpaidMonthsDetails.length - 8 }} more
                        </span>
                      </div>
                    </div>
                    <div v-else class="text-green-600 text-center py-1">
                      <i class="fas fa-check-circle"></i> সমস্ত মাস পরিশোধিত
                    </div>
                  </div>
                </details>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>



      <div class="space-y-6">

    <!-- ==============================
         SUMMARY CARDS
    =============================== -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">

      <div class="rounded-xl border bg-white p-4">
        <p class="text-sm text-gray-500">Target Amount</p>

        <p class="mt-1 text-2xl font-bold text-gray-900">
          {{ formatMoney(reportTotals.target) }}
        </p>
      </div>

      <div class="rounded-xl border bg-white p-4">
        <p class="text-sm text-gray-500">Paid Amount</p>

        <p class="mt-1 text-2xl font-bold text-green-600">
          {{ formatMoney(reportTotals.paid) }}
        </p>
      </div>

      <div class="rounded-xl border bg-white p-4">
        <p class="text-sm text-gray-500">Due Amount</p>

        <p class="mt-1 text-2xl font-bold text-red-600">
          {{ formatMoney(reportTotals.due) }}
        </p>
      </div>

      <div class="rounded-xl border bg-white p-4">
        <p class="text-sm text-gray-500">Collection Rate</p>

        <p class="mt-1 text-2xl font-bold text-blue-600">
          {{ reportTotals.rate.toFixed(1) }}%
        </p>
      </div>

    </div>


    <!-- ==============================
         REPORT TABLE
    =============================== -->
    <div class="overflow-hidden rounded-xl border bg-white">

      <!-- Header -->
      <div class="flex items-center justify-between border-b px-4 py-4">

        <div>
          <h2 class="font-semibold text-gray-900">
            User Deposit Summary
          </h2>

          <p class="mt-1 text-sm text-gray-500">
            {{ userDepositSummary.length }} users
          </p>
        </div>

      </div>


      <!-- Horizontal scroll -->
      <div class="overflow-x-auto">

        <table class="w-full min-w-[1100px] text-sm">

          <!-- ==========================
               TABLE HEADER
          =========================== -->
          <thead class="border-b bg-gray-50">

            <tr class="text-left text-xs uppercase text-gray-500">

              <th class="w-12 px-4 py-3">
                #
              </th>

              <th class="px-4 py-3">
                User
              </th>

              <th class="px-4 py-3">
                Session
              </th>

              <th class="px-4 py-3 text-right">
                Target
              </th>

              <th class="px-4 py-3 text-right">
                Paid
              </th>

              <th class="px-4 py-3 text-right">
                Due
              </th>

              <th class="px-4 py-3 text-center">
                Paid Months
              </th>

              <th class="px-4 py-3 text-center">
                Due Months
              </th>

              <th class="px-4 py-3">
                Progress
              </th>

              <th class="px-4 py-3">
                Status
              </th>

              <th class="px-4 py-3">
                Action
              </th>

            </tr>

          </thead>


          <!-- ==========================
               TABLE BODY
          =========================== -->
          <tbody class="divide-y">

            <template
              v-for="(user, index) in userDepositSummary"
              :key="user.userId"
            >

              <!-- ========================
                   USER ROW
              ========================= -->
              <tr class="transition hover:bg-gray-50">

                <!-- # -->
                <td class="px-4 py-4 text-gray-500">
                  {{ index + 1 }}
                </td>


                <!-- USER -->
                <td class="px-4 py-4">

                  <div class="flex items-center gap-3">

                    <div
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 font-semibold text-gray-600"
                    >
                      {{
                        user.userName?.charAt(0) || '?'
                      }}
                    </div>

                    <div class="min-w-0">

                      <p class="truncate font-medium text-gray-900">
                        {{ user.userName }}
                      </p>

                      <p class="text-xs text-gray-500">
                        {{ user.userId }}
                      </p>

                    </div>

                  </div>

                </td>


                <!-- SESSION -->
                <td class="px-4 py-4">

                  <template v-if="selectedSession !== 'all'">

                    <span
                      class="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium"
                    >
                      {{ selectedSession }}
                    </span>

                  </template>

                  <template v-else>

                    <div class="flex flex-wrap gap-1">

                      <span
                        v-for="session in user.sessions"
                        :key="session"
                        class="rounded-md bg-gray-100 px-2 py-1 text-xs"
                      >
                        {{ session }}
                      </span>

                    </div>

                  </template>

                </td>


                <!-- TARGET -->
                <td class="px-4 py-4 text-right font-semibold">
                  {{ formatMoney(user.totalTargetAmount) }}
                </td>


                <!-- PAID -->
                <td class="px-4 py-4 text-right font-semibold text-green-600">
                  {{ formatMoney(user.totalPaidAmount) }}
                </td>


                <!-- DUE -->
                <td
                  class="px-4 py-4 text-right font-semibold"
                  :class="
                    user.totalDueAmount > 0
                      ? 'text-red-600'
                      : 'text-gray-400'
                  "
                >
                  {{ formatMoney(user.totalDueAmount) }}
                </td>


                <!-- PAID MONTHS -->
                <td class="px-4 py-4 text-center">

                  <span
                    class="inline-flex min-w-8 justify-center rounded-full bg-green-50 px-2 py-1 font-medium text-green-700"
                  >
                    {{ user.totalPaidMonths }}
                  </span>

                </td>


                <!-- DUE MONTHS -->
                <td class="px-4 py-4 text-center">

                  <span
                    class="inline-flex min-w-8 justify-center rounded-full px-2 py-1 font-medium"
                    :class="
                      user.totalUnpaidMonths > 0
                        ? 'bg-red-50 text-red-700'
                        : 'bg-gray-50 text-gray-400'
                    "
                  >
                    {{ user.totalUnpaidMonths }}
                  </span>

                </td>


                <!-- PROGRESS -->
                <td class="px-4 py-4">

                  <div class="w-28">

                    <div class="mb-1 flex justify-between text-xs">

                      <span class="text-gray-500">
                        {{ user.paymentRate.toFixed(1) }}%
                      </span>

                    </div>

                    <div class="h-1.5 overflow-hidden rounded-full bg-gray-200">

                      <div
                        class="h-full rounded-full transition-all"
                        :class="progressColor(user.paymentRate)"
                        :style="{
                          width: `${Math.min(user.paymentRate, 100)}%`
                        }"
                      />

                    </div>

                  </div>

                </td>


                <!-- STATUS -->
                <td class="px-4 py-4">

                  <span
                    class="inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
                    :class="statusClass(user.status)"
                  >
                    {{ statusLabel(user.status) }}
                  </span>

                </td>


                <!-- ACTION -->
                <td class="px-4 py-4">

                  <button
                    type="button"
                    class="rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                    @click="toggleDetails(user.userId)"
                  >
                    {{
                      expandedUser === user.userId
                        ? 'Hide'
                        : 'Details'
                    }}
                  </button>

                </td>

              </tr>


              <!-- ========================
                   EXPANDED DETAILS
              ========================= -->
              <tr
                v-if="expandedUser === user.userId"
                class="bg-gray-50/70"
              >

                <td
                  colspan="11"
                  class="p-0"
                >

                  <div class="border-y bg-gray-50 p-4">

                    <!-- Financial summary -->
                    <div class="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">

                      <!-- Monthly -->
                      <div class="rounded-lg border bg-white p-3">

                        <p class="text-xs text-gray-500">
                          Monthly Deposit
                        </p>

                        <div class="mt-2 flex justify-between">

                          <span>
                            Target
                          </span>

                          <strong>
                            {{
                              formatMoney(
                                getMonthlyTarget(user)
                              )
                            }}
                          </strong>

                        </div>

                        <div class="flex justify-between text-green-600">

                          <span>
                            Paid
                          </span>

                          <strong>
                            {{
                              formatMoney(
                                getMonthlyPaid(user)
                              )
                            }}
                          </strong>

                        </div>

                        <div class="flex justify-between text-red-600">

                          <span>
                            Due
                          </span>

                          <strong>
                            {{
                              formatMoney(
                                getMonthlyDue(user)
                              )
                            }}
                          </strong>

                        </div>

                      </div>


                      <!-- Yearly -->
                      <div class="rounded-lg border bg-white p-3">

                        <p class="text-xs text-gray-500">
                          Yearly Deposit
                        </p>

                        <div class="mt-2 flex justify-between">

                          <span>
                            Target
                          </span>

                          <strong>
                            {{
                              formatMoney(
                                getYearlyTarget(user)
                              )
                            }}
                          </strong>

                        </div>

                        <div class="flex justify-between text-green-600">

                          <span>
                            Paid
                          </span>

                          <strong>
                            {{
                              formatMoney(
                                getYearlyPaid(user)
                              )
                            }}
                          </strong>

                        </div>

                        <div class="flex justify-between text-red-600">

                          <span>
                            Due
                          </span>

                          <strong>
                            {{
                              formatMoney(
                                getYearlyDue(user)
                              )
                            }}
                          </strong>

                        </div>

                      </div>


                      <!-- Cost -->
                      <div class="rounded-lg border bg-white p-3">

                        <p class="text-xs text-gray-500">
                          Yearly Cost
                        </p>

                        <div class="mt-2 flex justify-between">

                          <span>
                            Target
                          </span>

                          <strong>
                            {{
                              formatMoney(
                                getCostTarget(user)
                              )
                            }}
                          </strong>

                        </div>

                        <div class="flex justify-between text-green-600">

                          <span>
                            Paid
                          </span>

                          <strong>
                            {{
                              formatMoney(
                                getCostPaid(user)
                              )
                            }}
                          </strong>

                        </div>

                        <div class="flex justify-between text-red-600">

                          <span>
                            Due
                          </span>

                          <strong>
                            {{
                              formatMoney(
                                getCostDue(user)
                              )
                            }}
                          </strong>

                        </div>

                      </div>

                    </div>


                    <!-- =====================
                         MONTH DETAILS
                    ====================== -->
                    <div class="overflow-hidden rounded-lg border bg-white">

                      <div class="border-b px-4 py-3">

                        <h3 class="text-sm font-semibold">
                          Monthly Payment Details
                        </h3>

                      </div>

                      <div class="overflow-x-auto">

                        <table class="w-full min-w-[700px] text-sm">

                          <thead class="bg-gray-50 text-xs uppercase text-gray-500">

                            <tr>

                              <th class="px-4 py-3 text-left">
                                Session
                              </th>

                              <th class="px-4 py-3 text-left">
                                Month
                              </th>

                              <th class="px-4 py-3 text-right">
                                Target
                              </th>

                              <th class="px-4 py-3 text-right">
                                Paid
                              </th>

                              <th class="px-4 py-3 text-right">
                                Due
                              </th>

                              <th class="px-4 py-3 text-left">
                                Status
                              </th>

                            </tr>

                          </thead>

                          <tbody class="divide-y">

                            <!-- Paid months -->
                            <tr
                              v-for="item in user.paidMonthsDetails"
                              :key="`${item.session}-${item.month}-paid`"
                            >

                              <td class="px-4 py-3">
                                {{ item.session }}
                              </td>

                              <td class="px-4 py-3">
                                {{ item.month }}
                              </td>

                              <td class="px-4 py-3 text-right">
                                {{ formatMoney(item.amount) }}
                              </td>

                              <td class="px-4 py-3 text-right text-green-600">
                                {{ formatMoney(item.amount) }}
                              </td>

                              <td class="px-4 py-3 text-right text-gray-400">
                                {{ formatMoney(0) }}
                              </td>

                              <td class="px-4 py-3">
                                <span class="text-green-600">
                                  ● Paid
                                </span>
                              </td>

                            </tr>


                            <!-- Unpaid months -->
                            <tr
                              v-for="item in user.unpaidMonthsDetails"
                              :key="`${item.session}-${item.month}-due`"
                            >

                              <td class="px-4 py-3">
                                {{ item.session }}
                              </td>

                              <td class="px-4 py-3">
                                {{ item.month }}
                              </td>

                              <td class="px-4 py-3 text-right">
                                {{ formatMoney(item.amount) }}
                              </td>

                              <td class="px-4 py-3 text-right text-gray-400">
                                {{ formatMoney(0) }}
                              </td>

                              <td class="px-4 py-3 text-right text-red-600">
                                {{ formatMoney(item.amount) }}
                              </td>

                              <td class="px-4 py-3">
                                <span class="text-red-600">
                                  ● Due
                                </span>
                              </td>

                            </tr>

                          </tbody>

                        </table>

                      </div>

                    </div>

                  </div>

                </td>

              </tr>

            </template>


            <!-- ==========================
                 EMPTY STATE
            =========================== -->
            <tr v-if="!userDepositSummary.length">

              <td
                colspan="11"
                class="px-4 py-12 text-center"
              >

                <p class="font-medium text-gray-700">
                  No deposit data found
                </p>

                <p class="mt-1 text-sm text-gray-500">
                  Try changing your session or user filter.
                </p>

              </td>

            </tr>

          </tbody>


          <!-- ==========================
               TOTAL FOOTER
          =========================== -->
          <tfoot
            v-if="userDepositSummary.length"
            class="border-t bg-gray-50 font-semibold"
          >

            <tr>

              <td
                colspan="3"
                class="px-4 py-4"
              >
                Total
              </td>

              <td class="px-4 py-4 text-right">
                {{ formatMoney(reportTotals.target) }}
              </td>

              <td class="px-4 py-4 text-right text-green-600">
                {{ formatMoney(reportTotals.paid) }}
              </td>

              <td class="px-4 py-4 text-right text-red-600">
                {{ formatMoney(reportTotals.due) }}
              </td>

              <td class="px-4 py-4 text-center">
                {{ reportTotals.paidMonths }}
              </td>

              <td class="px-4 py-4 text-center">
                {{ reportTotals.dueMonths }}
              </td>

              <td class="px-4 py-4">
                {{ reportTotals.rate.toFixed(1) }}%
              </td>

              <td colspan="2" />

            </tr>

          </tfoot>

        </table>

      </div>

    </div>

  </div>

    <!-- No Data State -->
    <div v-if="!isLoading && userDepositSummary.length === 0" class="bg-white rounded-2xl p-12 shadow-2xl text-center">
      <i class="fas fa-chart-bar text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-500 text-lg">কোনো তথ্য পাওয়া যায়নি</p>
      <p class="text-gray-400 text-sm mt-2">দয়া করে ভিন্ন সেশন নির্বাচন করুন</p>
    </div>
  </div>
</template>

<style scoped>
@media print {
  .bg-gradient-to-r, .bg-gradient-to-br, .shadow-2xl, .shadow-xl {
    background: white !important;
    box-shadow: none !important;
  }
  
  button, .print\\:hidden {
    display: none !important;
  }
  
  details {
    display: none !important;
  }
}

summary {
  list-style: none;
  cursor: pointer;
}

summary::-webkit-details-marker {
  display: none;
}
</style>