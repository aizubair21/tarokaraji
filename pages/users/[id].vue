<script setup>
const route = useRoute()
const auth = useAuthStore()
const data = useDataStore()
const isLoading = ref(true)
const user = ref(useUsersStore().user.find(u => u.user_id == route.params.id));
const deposits = ref([])
const selectedSession = ref('')

// Months in Bengali
const months = [
  'September', 'October', 'November', 'December','January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August'
]

if (!auth.isAuthenticated || (auth.user.user_id != route.params.id && !auth.isAdmin) ) {
  await navigateTo('/login')
}


// Available sessions (you can adjust based on your data)
const sessions = ref(useSessionsStore().session)

// Fetch user data
const fetchUser = async () => {
  try {
    const userId = route.params.id
    const users = useUsersStore().user;
    user.value = users.find(u => u.user_id === userId)
    
    if (!user.value) {
      throw new Error('User not found')
    }
  } catch (error) {
    console.error('Error fetching user:', error)
  }
}

// Fetch deposits
const fetchDeposits = async () => {
  try {
    const allDeposits = useDepositsStore().all;
    const userId = user.value.user_id
    
    // Filter deposits for this user
    deposits.value = allDeposits.filter(d => d.user_id === userId)
    
    // Extract unique sessions
    const uniqueSessions = [...new Set(deposits.value.map(d => d.session))]
    //console.log(deposits.value);
    sessions.value = uniqueSessions.sort()
    
    // Set default selected session to latest
    if (sessions.value.length > 0 && !selectedSession.value) {
      selectedSession.value = sessions.value[sessions.value.length - 1]
    }
  } catch (error) {
    console.error('Error fetching deposits:', error)
  }
}

// Get user's deposits for selected session
const sessionDeposits = computed(() => {
  if (!selectedSession.value) return []
  return deposits.value.filter(d => d.session === selectedSession.value)
})

// Create a map of paid months for the selected session
const paidMonthsMap = computed(() => {
  const map = {}
  sessionDeposits.value.forEach(deposit => {
    const month = deposit.month
    const amount = parseFloat(deposit.amount) || 0
    if (!map[month]) {
      map[month] = { total: 0, deposits: [] }
    }
    map[month].total += amount
    map[month].deposits.push(deposit)
  })
  //console.log(map);
  return map
})

// Generate complete month status for selected session
const monthlyStatus = computed(() => {
  return months.map(month => {
    const paidData = paidMonthsMap.value[month]
    const isPaid = !!paidData
    const amount = paidData?.total || 0
    const deposits = paidData?.deposits || []
    
    return {
      month,
      isPaid,
      amount,
      deposits,
      status: isPaid ? 'paid' : 'unpaid'
    }
  })
})

// Statistics
const stats = computed(() => {
  const totalPaid = sessionDeposits.value.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
  const totalMonths = monthlyStatus.value.length
  //console.log(monthlyStatus.value);
  const paidMonths = monthlyStatus.value.filter(m => m.isPaid).length
  const unpaidMonths = totalMonths - paidMonths
  const paymentRate = totalMonths > 0 ? (paidMonths / totalMonths) * 100 : 0
  
  // Calculate by type
  const monthlyTotal = sessionDeposits.value
    .filter(d => d.type === 'Monthly')
    .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
  
  const yearlyTotal = sessionDeposits.value
    .filter(d => d.type === 'Yearly')
    .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
  
  const costTotal = sessionDeposits.value
    .filter(d => d.type === 'Maintainanc')
    .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
  
  return {
    totalPaid,
    paidMonths,
    unpaidMonths,
    paymentRate,
    monthlyTotal,
    yearlyTotal,
    costTotal
  }
})

// Get payment method breakdown
const paymentMethodBreakdown = computed(() => {
  const methods = {}
  sessionDeposits.value.forEach(deposit => {
    const method = deposit.method
    const amount = parseFloat(deposit.amount) || 0
    if (!methods[method]) {
      methods[method] = { total: 0, count: 0 }
    }
    methods[method].total += amount
    methods[method].count++
  })
  return methods
})

// Get deposit history by date
const depositHistory = computed(() => {
  return [...sessionDeposits.value]
    .sort((a, b) => {
      const dateA = a.date || ''
      const dateB = b.date || ''
      return dateB.localeCompare(dateA)
    })
})

const loadData = async () => {
  isLoading.value = true
  await fetchUser()
  if (user.value) {
    await fetchDeposits()
  }
  isLoading.value = false
}

// Helper functions
const getAmount = (deposit) => {
  return parseFloat(deposit.amount) || 0
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return dateString
}

onMounted(() => {
  loadData()
})
</script>

<template>
<!--   <div v-if="isLoading" class="flex justify-center items-center h-96">
    <div class="text-center">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
      <p class="mt-4 text-gray-500">লোড হচ্ছে...</p>
    </div>
  </div> -->

  <div v-if="!user" class="bg-white rounded-2xl p-12 shadow-2xl text-center">
    <i class="fas fa-user-slash text-6xl text-gray-300 mb-4"></i>
    <p class="text-gray-500 text-lg">সদস্য পাওয়া যায়নি</p>
    <NuxtLink to="/users" class="mt-4 inline-block text-purple-600 hover:text-purple-700">
      <i class="fas fa-arrow-left mr-2"></i> সদস্য ফিরে যান
    </NuxtLink>
  </div>

  <div v-else class="space-y-6">
    <!-- User Profile Header -->
    <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 shadow-2xl text-white">
      <div class="flex flex-col md:flex-row gap-6 items-start md:items-center">
        <!-- Avatar -->
        <div class="w-24 h-24 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-4xl font-bold backdrop-blur-sm">
          {{ user.name_bangla?.charAt(0) || '?' }}
        </div>
        
        <!-- User Info -->
        <div class="flex-1">
          <div class="flex flex-wrap items-center gap-3 mb-2">
            <h1 class="text-2xl md:text-3xl font-bold">{{ user.name_bangla }}</h1>
            <span class="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
              {{ user.name_english }}
            </span>
            <span class="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
              আইডি: TBU-{{ user.user_id }}
            </span>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div class="flex items-center">
              <i class="fas fa-envelope w-5"></i>
              <span class="ml-2">{{ user.email || 'ইমেইল নেই' }}</span>
            </div>
            <div class="flex items-center">
              <i class="fas fa-phone w-5"></i>
              <span class="ml-2">{{ user.phone_number || 'ফোন নেই' }}</span>
            </div>
            <div class="flex items-center">
              <i class="fas fa-briefcase w-5"></i>
              <span class="ml-2">{{ user.occupation || 'পেশা নেই' }}</span>
            </div>
            <div class="flex items-center">
              <i class="fas fa-graduation-cap w-5"></i>
              <span class="ml-2">{{ user.educational_qualification || 'যোগ্যতা নেই' }}</span>
            </div>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="flex gap-2">
          <NuxtLink v-if="auth.isAdmin" :to="`/users/${user.user_id}`" 
                    class="bg-white text-purple-600 rounded-lg px-4 py-2 hover:bg-opacity-90 transition-all">
            <i class="fas fa-edit mr-2"></i> এডিট
          </NuxtLink>
          <NuxtLink to="/users" class="bg-white bg-opacity-20 rounded-lg px-4 py-2 hover:bg-opacity-30 transition-all">
            <i class="fas fa-arrow-left mr-2"></i> ফিরে যান
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Overview Section -->
    <DepositOverview v-if="deposits.length > 0" :deposits />

    <Separator> সেসন ভিত্তিক তথ্য  </Separator>
    <!-- Session Selector -->
    <div class="bg-white rounded-2xl p-6 shadow-2xl">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        <i class="fas fa-calendar-alt mr-2 text-purple-600"></i>
        সেশন নির্বাচন করুন
      </label>
      <div class="flex flex-wrap gap-3">
        <button
          v-for="session in sessions"
          :key="session"
          @click="selectedSession = session"
          class="px-6 py-2 rounded-xl transition-all duration-200 font-medium"
          :class="selectedSession === session 
            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
        >
          {{ session }}
        </button>
      </div>
      <p v-if="sessions.length === 0" class="text-gray-500 text-sm mt-2">
        এই সদস্যের জন্য কোনো আমানত নেই
      </p>
    </div>

    <!-- Statistics Cards -->
    <div v-if="selectedSession" class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl p-5 text-white shadow-xl">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm opacity-90">মোট জমা</p>
            <p class="text-2xl font-bold mt-1">৳{{ stats.totalPaid.toLocaleString() }}</p>
          </div>
          <i class="fas fa-money-bill-wave text-3xl opacity-50"></i>
        </div>
      </div>
      
      <div class="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-5 text-white shadow-xl">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm opacity-90">পরিশোধিত মাস</p>
            <p class="text-2xl font-bold mt-1">{{ stats.paidMonths }} / 12</p>
          </div>
          <i class="fas fa-check-circle text-3xl opacity-50"></i>
        </div>
      </div>
      
      <div class="bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl p-5 text-white shadow-xl">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm opacity-90">অপরিশোধিত মাস</p>
            <p class="text-2xl font-bold mt-1">{{ stats.unpaidMonths }} / 12</p>
          </div>
          <i class="fas fa-times-circle text-3xl opacity-50"></i>
        </div>
      </div>
      
      <div class="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-5 text-white shadow-xl">
        <div class="flex justify-between items-start">
          <div>
            <p class="text-sm opacity-90">পেমেন্ট রেট</p>
            <p class="text-2xl font-bold mt-1">{{ stats.paymentRate.toFixed(1) }}%</p>
          </div>
          <i class="fas fa-chart-line text-3xl opacity-50"></i>
        </div>
      </div>
    </div>

    <!-- Monthly Deposit Calendar -->
    <div v-if="selectedSession" class="bg-white rounded-2xl p-6 shadow-2xl">
      <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <i class="fas fa-calendar-check text-purple-600 mr-2"></i>
        মাসিক আমানত স্ট্যাটাস - {{ selectedSession }}
      </h3>
      
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <div
          v-for="monthData in monthlyStatus"
          :key="monthData.month"
          class="p-3 rounded-xl border-2 transition-all duration-200"
          :class="monthData.isPaid 
            ? 'bg-green-50 border-green-500 hover:shadow-lg' 
            : 'bg-red-50 border-red-300 hover:shadow-lg'"
        >
          <div class="flex justify-between items-start mb-2">
            <span class="font-medium text-gray-800">{{ monthData.month }}</span>
            <i :class="monthData.isPaid ? 'fas fa-check-circle text-green-600' : 'fas fa-times-circle text-red-600'"></i>
          </div>
          
          <div v-if="monthData.isPaid" class="space-y-1">
            <p class="text-sm font-semibold text-green-600">৳{{ monthData.amount.toLocaleString() }}</p>
            <p class="text-xs text-gray-500">{{ monthData.deposits.length }} টি লেনদেন</p>
          </div>
          
          <div v-else class="space-y-1">
            <p class="text-sm text-red-600 font-medium">অপরিশোধিত</p>
            <button 
              v-if="auth.isAdmin"
              class="mt-2 text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 transition-colors w-full"
              @click="$router.push(`/deposits/new?user=${user.user_id}&month=${monthData.month}&session=${selectedSession}`)"
            >
              <i class="fas fa-plus mr-1"></i> জমা দিন
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Deposit Type Breakdown -->
    <div v-if="selectedSession && stats.totalPaid > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Deposit by Type -->
      <div class="bg-white rounded-2xl p-6 shadow-2xl">
        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-chart-pie text-purple-600 mr-2"></i>
          আমানতের ধরন
        </h3>
        <div class="space-y-3">
          <div class="flex justify-between items-center p-3 bg-green-50 rounded-xl">
            <div>
              <p class="font-medium text-gray-800">মাসিক</p>
              <p class="text-sm text-gray-600">নিয়মিত মাসিক জমা</p>
            </div>
            <div class="text-right">
              <p class="text-xl font-bold text-green-600">৳{{ stats.monthlyTotal.toLocaleString() }}</p>
              <p class="text-xs text-gray-500">{{ ((stats.monthlyTotal / stats.totalPaid) * 100).toFixed(1) }}%</p>
            </div>
          </div>
          
          <div class="flex justify-between items-center p-3 bg-blue-50 rounded-xl">
            <div>
              <p class="font-medium text-gray-800">বার্ষিক</p>
              <p class="text-sm text-gray-600">বার্ষিক জমা</p>
            </div>
            <div class="text-right">
              <p class="text-xl font-bold text-blue-600">৳{{ stats.yearlyTotal.toLocaleString() }}</p>
              <p class="text-xs text-gray-500">{{ ((stats.yearlyTotal / stats.totalPaid) * 100).toFixed(1) }}%</p>
            </div>
          </div>
          
          <div class="flex justify-between items-center p-3 bg-red-50 rounded-xl">
            <div>
              <p class="font-medium text-gray-800">খরচ</p>
              <p class="text-sm text-gray-600">বিভিন্ন খরচ</p>
            </div>
            <div class="text-right">
              <p class="text-xl font-bold text-red-600">৳{{ stats.costTotal.toLocaleString() }}</p>
              <p class="text-xs text-gray-500">{{ ((stats.costTotal / stats.totalPaid) * 100).toFixed(1) }}%</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Methods -->
      <div class="bg-white rounded-2xl p-6 shadow-2xl">
        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-credit-card text-purple-600 mr-2"></i>
          পেমেন্ট মেথড
        </h3>
        <div class="space-y-3">
          <div v-for="(method, name) in paymentMethodBreakdown" :key="name" class="space-y-1">
            <div class="flex justify-between text-sm">
              <span class="font-medium text-gray-700">{{ name || 'অন্যান্য' }}</span>
              <span class="text-gray-600">৳{{ method.total.toLocaleString() }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                   :style="{ width: `${(method.total / stats.totalPaid) * 100}%` }"></div>
            </div>
            <p class="text-xs text-gray-500 text-right">{{ method.count }} টি লেনদেন</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Deposit History -->
    <div v-if="selectedSession && depositHistory.length > 0" class="bg-white rounded-2xl p-6 shadow-2xl">
      <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
        <i class="fas fa-history text-purple-600 mr-2"></i>
        আমানতের ইতিহাস
      </h3>
      
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">তারিখ</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">মাস</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ধরন</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">পরিমাণ</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">মেথড</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">বিস্তারিত</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="(deposit, index) in depositHistory" :key="index" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-900">{{ formatDate(deposit.date) }}</td>
              <td class="px-4 py-3 text-sm text-gray-900">{{ deposit.month }}</td>
              <td class="px-4 py-3 text-sm">
                <span :class="{
                  'text-green-600': deposit.type === 'Monthly',
                  'text-blue-600': deposit.type === 'Yearly',
                  'text-red-600': deposit.type === 'Cost'
                }" class="font-medium">
                  {{ deposit.type }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm font-semibold text-green-600">৳{{ getAmount(deposit).toLocaleString() }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ deposit.method || '-' }}</td>
              <td class="px-4 py-3 text-sm">
                <details class="cursor-pointer">
                  <summary class="text-purple-600 text-xs">বিস্তারিত</summary>
                  <div class="mt-2 text-xs space-y-1">
                    <p><span class="font-medium">প্রাপক:</span> {{ deposit.pay_to || '-' }}</p>
                    <p><span class="font-medium">প্রেরক:</span> {{ deposit.send_from || '-' }}</p>
                  </div>
                </details>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- No Deposits Message -->
    <div v-else-if="selectedSession && depositHistory.length === 0" class="bg-white rounded-2xl p-12 shadow-2xl text-center">
      <i class="fas fa-receipt text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-500 text-lg">এই সেশনের জন্য কোনো আমানত নেই</p>
      <button 
        v-if="auth.isAdmin"
        @click="$router.push(`/deposits/new?user=${user.user_id}&session=${selectedSession}`)"
        class="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl px-6 py-2 hover:from-purple-600 hover:to-pink-600 transition-all"
      >
        <i class="fas fa-plus mr-2"></i> প্রথম আমানত যোগ করুন
      </button>
    </div>
  </div>
</template>

<style scoped>
details summary::-webkit-details-marker {
  display: none;
}

details summary {
  list-style: none;
  cursor: pointer;
}
</style>