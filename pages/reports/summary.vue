<script setup>
const auth = useAuthStore()
const isLoading = ref(true)
const error = ref(null)

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

// User deposit summary - simplified version
const userDepositSummary = computed(() => {
  if (!users.value.length || !deposits.value.length) return []
  
  // Filter deposits by selected session
  let filteredDeposits = deposits.value
  if (selectedSession.value !== 'all') {
    filteredDeposits = deposits.value.filter(d => d.session === selectedSession.value)
  }
  
  // Create a map of paid months per user
  const userPaidMonthsMap = new Map()
  
  // Track paid months for each user
  filteredDeposits.forEach(deposit => {
    const userId = deposit.user_id
    const month = deposit.month
    const session = deposit.session
    
    if (!userPaidMonthsMap.has(userId)) {
      userPaidMonthsMap.set(userId, {
        userId,
        userName: '',
        userEmail: '',
        paidMonths: new Set(),
        sessions: new Set(),
        totalDeposits: 0
      })
    }
    
    const userData = userPaidMonthsMap.get(userId)
    const monthKey = `${session}-${month}`
    userData.paidMonths.add(monthKey)
    userData.sessions.add(session)
    userData.totalDeposits += parseFloat(deposit.amount) || 0
  })
  
  // Calculate summary for each user
  const result = []
  
  users.value.forEach(user => {
    const userId = user.user_id
    const userData = userPaidMonthsMap.get(userId) || {
      userId,
      userName: user.name_bangla || user.name_english || 'Unknown',
      userEmail: user.email || 'N/A',
      paidMonths: new Set(),
      sessions: new Set(),
      totalDeposits: 0
    }
    
    // Determine which sessions to consider
    const sessionsToProcess = selectedSession.value !== 'all'
      ? [selectedSession.value]
      : (sessions.value.length ? sessions.value.map(s => s.session_name) : ['2024-25'])
    
    // Calculate paid and unpaid months
    let totalPaidMonths = 0
    let totalUnpaidMonths = 0
    const paidMonthsDetails = []
    const unpaidMonthsDetails = []
    
    sessionsToProcess.forEach(session => {
      allMonths.forEach(month => {
        const monthKey = `${session}-${month}`
        if (userData.paidMonths.has(monthKey)) {
          totalPaidMonths++
          paidMonthsDetails.push({ session, month })
        } else {
          totalUnpaidMonths++
          unpaidMonthsDetails.push({ session, month })
        }
      })
    })
    
    const totalMonths = totalPaidMonths + totalUnpaidMonths
    const paymentRate = totalMonths > 0 ? (totalPaidMonths / totalMonths) * 100 : 0
    
    // Determine user status
    let status = 'no_payment'
    if (totalPaidMonths === totalMonths && totalMonths > 0) {
      status = 'fully_paid'
    } else if (totalPaidMonths > 0) {
      status = 'partially_paid'
    }
    
    result.push({
      ...userData,
      userName: user.name_bangla || user.name_english || 'Unknown',
      userEmail: user.email || 'N/A',
      userRole: user.role,
      totalPaidMonths,
      totalUnpaidMonths,
      totalMonths,
      paymentRate,
      status,
      paidMonthsDetails,
      unpaidMonthsDetails,
      totalDeposits: userData.totalDeposits
    })
  })
  
  // Sort by payment rate (highest first)
  return result.sort((a, b) => b.paymentRate - a.paymentRate)
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
    <div v-else class="bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">আইডি</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">নাম</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">পরিশোধিত মাস</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">অপরিশোধিত মাস</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">মোট মাস</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">পরিশোধের হার</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">স্ট্যাটাস</th>
              <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">বিস্তারিত</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="(user, index) in userDepositSummary" :key="user.userId" class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3 text-sm text-gray-900">{{ index + 1 }}</td>
              <td class="px-4 py-3 text-sm font-medium text-gray-900">{{ user.userId }}</td>
              <td class="px-4 py-3 text-sm text-gray-800">{{ user.userName }}</td>
              <td class="px-4 py-3 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {{ user.totalPaidMonths }} মাস
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {{ user.totalUnpaidMonths }} মাস
                </span>
              </td>
              <td class="px-4 py-3 text-center text-sm font-medium text-gray-700">{{ user.totalMonths }} মাস</td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-2">
                  <div class="w-16 bg-gray-200 rounded-full h-2">
                    <div class="rounded-full h-2" 
                         :class="user.paymentRate >= 70 ? 'bg-green-500' : user.paymentRate >= 30 ? 'bg-yellow-500' : 'bg-red-500'"
                         :style="{ width: `${user.paymentRate}%` }"></div>
                  </div>
                  <span class="text-xs font-medium">{{ user.paymentRate.toFixed(0) }}%</span>
                </div>
              </td>
              <td class="px-4 py-3 text-center">
                <span class="px-2 py-1 rounded-full text-xs font-medium"
                      :class="{
                        'bg-green-100 text-green-800': user.status === 'fully_paid',
                        'bg-yellow-100 text-yellow-800': user.status === 'partially_paid',
                        'bg-red-100 text-red-800': user.status === 'no_payment'
                      }">
                  {{ user.status === 'fully_paid' ? 'সব পরিশোধিত' : user.status === 'partially_paid' ? 'আংশিক পরিশোধিত' : 'অপরিশোধিত' }}
                </span>
              </td>
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