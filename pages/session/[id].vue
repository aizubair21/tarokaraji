<script setup>
const route = useRoute()
const data = useDataStore()
const sessionName = route.params.id

// State
const isLoading = ref(true)
const session = ref(null)
const allDeposits = ref([])
const users = ref([])
const selectedMonth = ref('')
const selectedFilter = ref('all') // 'all', 'monthly', 'yearly', 'cost'

// Months in Bengali
const months = data.months;

// Fetch session data
const fetchSessionData = async () => {
  isLoading.value = true
  try {
    // Get session details
    const sessions = useSessionsStore().session;
    session.value = sessions.find(s => s.sessionName === sessionName)
    
    // Get all deposits
    allDeposits.value = useDepositsStore().all;
    
    // Get all users
    users.value = useUsersStore().user;
    
    // Set default selected month to current month
    const currentDate = new Date()
    const currentMonthName = months[currentDate.getMonth() + 4]
    selectedMonth.value = currentMonthName
    
  } catch (error) {
    console.error('Error fetching session data:', error)
  } finally {
    isLoading.value = false
  }
}

// Filter deposits for current session
const sessionDeposits = computed(() => {
  return allDeposits.value.filter(d => d.session === sessionName)
})

// Session statistics
const sessionStats = computed(() => {
  const monthlyTotal = sessionDeposits.value
    .filter(d => d.type === 'Monthly')
    .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
  
  const yearlyTotal = sessionDeposits.value
    .filter(d => d.type === 'Yearly')
    .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
  
  const costTotal = sessionDeposits.value
    .filter(d => d.type === 'Maintainanc')
    .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
  
  const totalCollected = monthlyTotal + yearlyTotal + costTotal
  
  // Expected amounts
  const expectedMonthly = (users.value.length || 0) * (parseFloat(session.value?.monthlyDeposit) || 0) * 12
  const expectedYearly = (users.value.length || 0) * (parseFloat(session.value?.yearlyDeposit) || 0) 
  const expectedTotal = expectedMonthly + expectedYearly
  
  // Payment statistics
  const monthlyPaymentRate = expectedMonthly > 0 ? (monthlyTotal / expectedMonthly) * 100 : 0
  const yearlyPaymentRate = expectedYearly > 0 ? (yearlyTotal / expectedYearly) * 100 : 0
  const overallPaymentRate = expectedTotal > 0 ? (totalCollected / expectedTotal) * 100 : 0
  
  return {
    expectedMonthly,
    expectedYearly,
    expectedTotal,
    monthlyTotal,
    yearlyTotal,
    costTotal,
    totalCollected,
    monthlyPaymentRate,
    yearlyPaymentRate,
    overallPaymentRate,
    dueAmount: expectedTotal - totalCollected,
    totalMembers: users.value.length,
    paidMembers: new Set(sessionDeposits.value.map(d => d.user_id)).size
  }
})

// Month-wise statistics
const monthWiseStats = computed(() => {
  return months.map(month => {
    const monthDeposits = sessionDeposits.value.filter(d => d.month === month)
    
    const monthlyAmount = monthDeposits
      .filter(d => d.type === 'Monthly')
      .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
    
    const yearlyAmount = monthDeposits
      .filter(d => d.type === 'Yearly')
      .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
    
    const costAmount = monthDeposits
      .filter(d => d.type === 'Maintainanc')
      .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
    
    const totalAmount = monthlyAmount + yearlyAmount + costAmount
    
    const expectedMonthlyAmount = (users.value.length || 0) * (parseFloat(session.value?.monthlyDeposit) || 0)
    const dueAmount = expectedMonthlyAmount - monthlyAmount
    
    const paymentRate = expectedMonthlyAmount > 0 ? (monthlyAmount / expectedMonthlyAmount) * 100 : 0
    const paidUsers = new Set(monthDeposits.filter(d => d.type === 'Monthly').map(d => d.user_id)).size
    
    return {
      month,
      monthlyAmount,
      yearlyAmount,
      costAmount,
      totalAmount,
      expectedMonthlyAmount,
      dueAmount,
      paymentRate,
      paidUsers,
      totalUsers: users.value.length,
      dueUsers: users.value.length - paidUsers
    }
  })
})

// Selected month details
const selectedMonthData = computed(() => {
  return monthWiseStats.value.find(m => m.month === selectedMonth.value)
})

// Filtered deposits for selected month
const selectedMonthDeposits = computed(() => {
  let deposits = sessionDeposits.value.filter(d => d.month === selectedMonth.value)
  
  if (selectedFilter.value !== 'all') {
    deposits = deposits.filter(d => d.type === selectedFilter.value)
  }
  
  return deposits
})

// Month-wise chart data
const chartData = computed(() => {
  return {
    labels: monthWiseStats.value.map(m => m.month.slice(0, 3)),
    datasets: {
      collected: monthWiseStats.value.map(m => m.monthlyAmount),
      expected: monthWiseStats.value.map(m => m.expectedMonthlyAmount)
    }
  }
})

// Top contributors
const topContributors = computed(() => {
  const contributions = {}
  sessionDeposits.value.forEach(deposit => {
    const amount = parseFloat(deposit.amount) || 0
    if (!contributions[deposit.user_id]) {
      contributions[deposit.user_id] = 0
    }
    contributions[deposit.user_id] += amount
  })
  
  return Object.entries(contributions)
    .map(([userId, total]) => {
      const user = users.value.find(u => u.user_id === userId)
      return {
        userId,
        name: user?.name_bangla || 'Unknown',
        total,
        monthlyCount: sessionDeposits.value.filter(d => d.user_id === userId && d.type === 'Monthly').length,
        yearlyPaid: sessionDeposits.value.some(d => d.user_id === userId && d.type === 'Yearly')
      }
    })
    .sort((a, b) => b.total - a.total)
})

// Due members for selected month
const dueMembers = computed(() => {
  const paidUserIds = new Set(
    sessionDeposits.value
      .filter(d => d.month === selectedMonth.value && d.type === 'Monthly')
      .map(d => d.user_id)
  )
  
  return users.value.filter(user => !paidUserIds.has(user.user_id))
})

// Payment trends (last 6 months)
const paymentTrends = computed(() => {
  const last6Months = monthWiseStats.value.slice(-6)
  return {
    months: last6Months.map(m => m.month),
    amounts: last6Months.map(m => m.monthlyAmount),
    dueAmounts: last6Months.map(m => m.dueAmount)
  }
})

// Calculate percentage for progress bar
const getPercentage = (collected, expected) => {
  if (!expected || expected === 0) return 0
  return Math.min((collected / expected) * 100, 100)
}

// Format currency
const formatCurrency = (amount) => {
  return `৳${(amount || 0).toLocaleString()}`
}

onMounted(() => {
  fetchSessionData()
})
</script>

<template>
  <div v-if="isLoading" class="flex justify-center items-center h-96">
    <div class="text-center">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
      <p class="mt-4 text-gray-500">লোড হচ্ছে...</p>
    </div>
  </div>

  <div v-else-if="!session" class="bg-white rounded-2xl p-12 shadow-2xl text-center">
    <i class="fas fa-calendar-times text-6xl text-gray-300 mb-4"></i>
    <p class="text-gray-500 text-lg">সেশন পাওয়া যায়নি</p>
    <NuxtLink to="/session" class="mt-4 inline-block text-purple-600 hover:text-purple-700">
      <i class="fas fa-arrow-left mr-2"></i> ফিরে যান
    </NuxtLink>
  </div>

  <div v-else class="space-y-6">
    <!-- Session Header -->
    <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 shadow-2xl text-white">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-3xl font-bold">{{ sessionName }}</h1>
          <p class="text-sm opacity-90 mt-1">সেশন বিশ্লেষণ ও রিপোর্ট</p>
        </div>
        <NuxtLink to="/session" class="bg-white bg-opacity-20 rounded-lg px-4 py-2 hover:bg-opacity-30 transition-all">
          <i class="fas fa-arrow-left mr-2"></i> ফিরে যান
        </NuxtLink>
      </div>
    </div>

    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-2xl p-5 shadow-xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">মোট সদস্য</p>
            <p class="text-2xl font-bold text-gray-800">{{ sessionStats.totalMembers }}</p>
          </div>
          <i class="fas fa-users text-3xl text-purple-400"></i>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl p-5 shadow-xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">প্রত্যাশিত আয়</p>
            <p class="text-2xl font-bold text-blue-600">{{ formatCurrency(sessionStats.expectedTotal) }}</p>
          </div>
          <i class="fas fa-chart-line text-3xl text-blue-400"></i>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl p-5 shadow-xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">সংগৃহীত আয়</p>
            <p class="text-2xl font-bold text-green-600">{{ formatCurrency(sessionStats.totalCollected) }}</p>
          </div>
          <i class="fas fa-money-bill-wave text-3xl text-green-400"></i>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl p-5 shadow-xl">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">বাকি আয়</p>
            <p class="text-2xl font-bold text-red-600">{{ formatCurrency(sessionStats.dueAmount) }}</p>
          </div>
          <i class="fas fa-clock text-3xl text-red-400"></i>
        </div>
      </div>
    </div>

    <!-- Progress Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-2xl p-5 shadow-xl">
        <div class="flex justify-between mb-2">
          <span class="text-sm text-gray-600">মাসিক জমা</span>
          <span class="text-sm font-semibold text-green-600">{{ sessionStats.monthlyPaymentRate.toFixed(1) }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-green-500 h-2 rounded-full transition-all" :style="{ width: `${sessionStats.monthlyPaymentRate}%` }"></div>
        </div>
        <div class="flex justify-between mt-2 text-xs text-gray-500">
          <span>প্রত্যাশিত: {{ formatCurrency(sessionStats.expectedMonthly) }}</span>
          <span>সংগৃহীত: {{ formatCurrency(sessionStats.monthlyTotal) }}</span>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl p-5 shadow-xl">
        <div class="flex justify-between mb-2">
          <span class="text-sm text-gray-600">বার্ষিক জমা</span>
          <span class="text-sm font-semibold text-blue-600">{{ sessionStats.yearlyPaymentRate.toFixed(1) }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-blue-500 h-2 rounded-full transition-all" :style="{ width: `${sessionStats.yearlyPaymentRate}%` }"></div>
        </div>
        <div class="flex justify-between mt-2 text-xs text-gray-500">
          <span>প্রত্যাশিত: {{ formatCurrency(sessionStats.expectedYearly) }}</span>
          <span>সংগৃহীত: {{ formatCurrency(sessionStats.yearlyTotal) }}</span>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl p-5 shadow-xl">
        <div class="flex justify-between mb-2">
          <span class="text-sm text-gray-600">সার্বিক অগ্রগতি</span>
          <span class="text-sm font-semibold text-purple-600">{{ sessionStats.overallPaymentRate.toFixed(1) }}%</span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-purple-500 h-2 rounded-full transition-all" :style="{ width: `${sessionStats.overallPaymentRate}%` }"></div>
        </div>
        <div class="flex justify-between mt-2 text-xs text-gray-500">
          <span>প্রত্যাশিত: {{ formatCurrency(sessionStats.expectedTotal) }}</span>
          <span>সংগৃহীত: {{ formatCurrency(sessionStats.totalCollected) }}</span>
        </div>
      </div>
    </div>

    <!-- Month Selector and Details -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Month Selector -->
      <div class="bg-white rounded-2xl p-6 shadow-xl lg:col-span-1">
        <h3 class="text-lg font-bold text-gray-800 mb-4">
          <i class="fas fa-calendar-alt text-purple-600 mr-2"></i>
          মাস নির্বাচন করুন
        </h3>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="month in months"
            :key="month"
            @click="selectedMonth = month"
            class="py-2 px-3 rounded-lg text-sm transition-all"
            :class="selectedMonth === month 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          >
            {{ month }}
          </button>
        </div>
      </div>

      <!-- Month Details -->
      <div class="bg-white rounded-2xl p-6 shadow-xl lg:col-span-2">
        <h3 class="text-lg font-bold text-gray-800 mb-4">
          <i class="fas fa-chart-pie text-purple-600 mr-2"></i>
          {{ selectedMonth }} মাসের বিশ্লেষণ
        </h3>
        
        <div v-if="selectedMonthData" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="text-center p-3 bg-green-50 rounded-xl">
              <p class="text-xs text-gray-500">প্রত্যাশিত</p>
              <p class="text-xl font-bold text-green-600">{{ formatCurrency(selectedMonthData.expectedMonthlyAmount) }}</p>
            </div>
            <div class="text-center p-3 bg-blue-50 rounded-xl">
              <p class="text-xs text-gray-500">সংগৃহীত</p>
              <p class="text-xl font-bold text-blue-600">{{ formatCurrency(selectedMonthData.monthlyAmount) }}</p>
            </div>
            <div class="text-center p-3 bg-red-50 rounded-xl">
              <p class="text-xs text-gray-500">বাকি</p>
              <p class="text-xl font-bold text-red-600">{{ formatCurrency(selectedMonthData.dueAmount) }}</p>
            </div>
            <div class="text-center p-3 bg-purple-50 rounded-xl">
              <p class="text-xs text-gray-500">পেমেন্ট রেট</p>
              <p class="text-xl font-bold text-purple-600">{{ selectedMonthData.paymentRate.toFixed(1) }}%</p>
            </div>
          </div>
          
          <div class="border-t pt-4">
            <div class="flex justify-between text-sm mb-2">
              <span class="text-gray-600">পরিশোধ করেছে: {{ selectedMonthData.paidUsers }} জন</span>
              <span class="text-gray-600">বাকি আছে: {{ selectedMonthData.dueUsers }} জন</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-green-500 h-2 rounded-full" :style="{ width: `${selectedMonthData.paymentRate}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Due Members for Selected Month -->
    <div v-if="dueMembers.length > 0" class="bg-white rounded-2xl p-6 shadow-xl">
      <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
        {{ selectedMonth }} মাসে বাকি সদস্যবৃন্দ
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <div v-for="member in dueMembers" :key="member.user_id" class="flex items-center justify-between p-3 bg-red-50 rounded-xl">
          <div>
            <p class="font-medium text-gray-800">{{ member.name_bangla }}</p>
            <p class="text-xs text-gray-500">আইডি: {{ member.user_id }}</p>
          </div>
          <NuxtLink :to="`/users/${member.user_id}?session=${sessionName}&month=${selectedMonth}`" 
                    class="bg-purple-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-purple-600">
            জমা দিন
          </NuxtLink>
        </div>
      </div>
    </div>


    <!-- Deposit Type Filter -->
    <div class="bg-white rounded-2xl p-6 shadow-xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold text-gray-800">
          <i class="fas fa-list-ul text-purple-600 mr-2"></i>
          {{ selectedMonth }} মাসের লেনদেন
        </h3>
        <div class="flex gap-2">
          <button
            v-for="filter in ['all', 'Monthly', 'Yearly', 'Cost']"
            :key="filter"
            @click="selectedFilter = filter"
            class="px-3 py-1 rounded-lg text-sm capitalize transition-all"
            :class="selectedFilter === filter 
              ? 'bg-purple-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
          >
            {{ filter === 'all' ? 'সব' : filter }}
          </button>
        </div>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">সদস্য আইডি</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">নাম</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">ধরন</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">পরিমাণ</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">পদ্ধতি</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">তারিখ</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="deposit in selectedMonthDeposits" :key="deposit.user_id + deposit.date" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm">{{ deposit.user_id }}</td>
              <td class="px-4 py-3 text-sm">{{ users.find(u => u.user_id === deposit.user_id)?.name_bangla || 'N/A' }}</td>
              <td class="px-4 py-3 text-sm">
                <span :class="{
                  'text-green-600': deposit.type === 'Monthly',
                  'text-blue-600': deposit.type === 'Yearly',
                  'text-red-600': deposit.type === 'Cost'
                }" class="font-medium">
                  {{ deposit.type }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm font-semibold text-green-600">{{ formatCurrency(deposit.amount) }}</td>
              <td class="px-4 py-3 text-sm">{{ deposit.method || '-' }}</td>
              <td class="px-4 py-3 text-sm">{{ deposit.date || '-' }}</td>
            </tr>
            <tr v-if="selectedMonthDeposits.length === 0">
              <td colspan="6" class="text-center py-8 text-gray-500">
                এই মাসে কোনো লেনদেন নেই
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>


    <!-- Top Contributors -->
    <div class="bg-white rounded-2xl p-6 shadow-xl">
      <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <i class="fas fa-trophy text-yellow-500 mr-2"></i>
        শীর্ষ অবদানকারী
      </h3>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">ক্রম</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">সদস্য</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">মাসিক জমা</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">বার্ষিক জমা</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">মোট জমা</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="(contributor, idx) in topContributors" :key="contributor.userId" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm">
                <span :class="{
                  'bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs': idx === 0,
                  'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs': idx === 1,
                  'bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs': idx === 2
                }">
                  {{ idx + 1 }}
                </span>
              </td>
              <td class="px-4 py-3">
                <p class="font-medium text-gray-800">{{ contributor.name }}</p>
                <p class="text-xs text-gray-500">আইডি: {{ contributor.userId }}</p>
              </td>
              <td class="px-4 py-3 text-sm">{{ contributor.monthlyCount }} বার</td>
              <td class="px-4 py-3 text-sm">
                <span :class="contributor.yearlyPaid ? 'text-green-600' : 'text-red-600'">
                  {{ contributor.yearlyPaid ? '✓ প্রদান করেছেন' : '✗ প্রদান করেননি' }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm font-semibold text-green-600">{{ formatCurrency(contributor.total) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>