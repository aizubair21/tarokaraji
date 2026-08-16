<script setup>
const auth = useAuthStore()
const data = useDataStore()

const isLoading = ref(false)
const error = ref(null)

// Data stores
const sessions = ref([])

const users = ref([])
const deposits = ref([])
const selectedSession = ref(null)
const expandedMonths = ref(new Set()) // Track expanded months

const selectedType = ref('Monthly');

// Session statistics
const sessionStats = ref({
  expectedTotal: 0,
  confirmedTotal: 0,
  dueTotal: 0,
  completionRate: 0
})

// Month-wise data
const monthData = ref([])

// Months in order (Sep to Aug for Bengali fiscal year)
const months = [
  { name: 'September', bn: 'সেপ্টেম্বর', en: 'September', order: 1 },
  { name: 'October', bn: 'অক্টোবর', en: 'October', order: 2 },
  { name: 'November', bn: 'নভেম্বর', en: 'November', order: 3 },
  { name: 'December', bn: 'ডিসেম্বর', en: 'December', order: 4 },
  { name: 'January', bn: 'জানুয়ারি', en: 'January', order: 5 },
  { name: 'February', bn: 'ফেব্রুয়ারি', en: 'February', order: 6 },
  { name: 'March', bn: 'মার্চ', en: 'March', order: 7 },
  { name: 'April', bn: 'এপ্রিল', en: 'April', order: 8 },
  { name: 'May', bn: 'মে', en: 'May', order: 9 },
  { name: 'June', bn: 'জুন', en: 'June', order: 10 },
  { name: 'July', bn: 'জুলাই', en: 'July', order: 11 },
  { name: 'August', bn: 'আগস্ট', en: 'August', order: 12 }
]

// User statistics for each month
const userPaymentStatus = computed(() => {
  if (!selectedSession.value) return {}
  
  const status = {}
  
  months.forEach(month => {
    status[month.name] = users.value.map(user => {
      const userDeposits = deposits.value.filter(d => 
        d.user_id === user.user_id && 
        d.session === selectedSession.value.sessionName &&
        d.month === month.name && 
        d.type === selectedType.value
      )
      
      const totalPaid = userDeposits.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
      const expectedAmount = parseFloat(selectedSession.value.monthlyDeposit) || 0
      
      return {
        user_id: user.user_id,
        name: user.name_english,
        phone: user.phone_number,
        expected: expectedAmount,
        paid: totalPaid,
        due: expectedAmount - totalPaid,
        isPaid: totalPaid >= expectedAmount,
        deposits: userDeposits
      }
    })
  })
  
  return status
})

// Calculate month-wise totals
const calculateMonthWiseData = () => {
  if (!selectedSession.value) return []
  
  const monthlyData = months.map(month => {
    const monthUsers = userPaymentStatus.value[month.name] || []
    const totalExpected = monthUsers.reduce((sum, u) => sum + u.expected, 0)
    const totalPaid = monthUsers.reduce((sum, u) => sum + u.paid, 0)
    const totalDue = totalExpected - totalPaid
    const paidCount = monthUsers.filter(u => u.isPaid).length
    const totalCount = monthUsers.length
    const completionRate = totalCount > 0 ? (paidCount / totalCount) * 100 : 0
    
    return {
      month: month.name,
      monthEn: month.en,
      order: month.order,
      totalExpected,
      totalPaid,
      totalDue,
      paidCount,
      totalCount,
      completionRate,
      users: monthUsers
    }
  })
  
  return monthlyData
}

// Calculate overall session statistics
const calculateSessionStats = () => {
  if (!selectedSession.value || !monthData.value.length) return
  
  const totalMonthlyExpected = monthData.value.reduce((sum, m) => sum + m.totalExpected, 0)
  const totalPaid = monthData.value.reduce((sum, m) => sum + m.totalPaid, 0)
  const totalDue = totalMonthlyExpected - totalPaid
  const totalTerms = monthData.value.reduce((sum, m) => sum + m.totalCount, 0)
  const confirmedTerms = monthData.value.reduce((sum, m) => sum + m.paidCount, 0)
  
  sessionStats.value = {
    expectedTotal: totalMonthlyExpected,
    confirmedTotal: totalPaid,
    dueTotal: totalDue,
    totalTerms,
    confirmedTerms,
    pendingTerms: totalTerms - confirmedTerms,
    completionRate: totalTerms > 0 ? (confirmedTerms / totalTerms) * 100 : 0,
    amountCompletionRate: totalMonthlyExpected > 0 ? (totalPaid / totalMonthlyExpected) * 100 : 0,
    sessionYearlyAmount : selectedSession.value.yearlyDeposit * users.value.length,

  }
  // console.log(sessionStats.value)

}

// Load all data
const loadData = async () => {
  error.value = null
  
  try {
    sessions.value = useSessionsStore().session;
    users.value = useUsersStore().user; 
    deposits.value = useDepositsStore().all;
  } catch (err) {
    error.value = err.message || 'Failed to load data'
    //console.error('Error loading data:', err)
  } finally {
    isLoading.value = false
  }
}

// Handle session selection
const onSessionSelect = (session) => {
  selectedSession.value = session
  monthData.value = calculateMonthWiseData()
  calculateSessionStats()
  expandedMonths.value.clear() // Reset expanded months
  //console.log(monthData.value);
}

// Toggle month expansion
const toggleMonth = (monthName) => {
  if (expandedMonths.value.has(monthName)) {
    expandedMonths.value.delete(monthName)
  } else {
    expandedMonths.value.add(monthName)
  }
}

// Format currency
const formatCurrency = (amount) => {
  return `৳${amount.toLocaleString()}`
}

// Get status badge class
const getStatusBadgeClass = (isPaid) => {
  return isPaid 
    ? 'bg-green-100 text-green-800' 
    : 'bg-red-100 text-red-800'
}

const getStatusText = (isPaid) => {
  return isPaid ? 'পরিশোধিত' : 'অপরিশোধ'
}

const onSelectedTypes = (type) => {
  selectedType.value = type;
}

onMounted(() => {
  loadData()

})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white bg-opacity-90 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
        সেশন ভিত্তিক রিপোর্ট

      </h1>
        <!-- Session Selector -->
        <div class="mt-6">
          <div class="flex items-center justify-between md:justify-start gap-3">
            <select class="px-4 py-2 rounded-lg ">
              <option > Select Sessions </option>
              <option @click="onSessionSelect(s)" v-for="s in sessions" :value="s"  > {{s.sessionName}} </option>
            </select>

            <div class="flex gap-3">
                <button
              :key="`types_1`"
              @click="onSelectedTypes('Monthly')"
              class="mt-1 px-6 py-2 rounded-xl transition-all duration-200 font-normal"
              :class="selectedType === 'Monthly' 
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              >
                M
              </button>
              <button
                :key="`types_2`"
                @click="onSelectedTypes('Yearly')"
                class="px-6 py-2 rounded-xl transition-all duration-200 font-normal"
                :class="selectedType === 'Yearly' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              >
                Y
              </button> 
              <button
                :key="`types_2`"
                @click="onSelectedTypes('Maintainanc')"
                class="px-6 py-2 rounded-xl transition-all duration-200 font-normal"
                :class="selectedType === 'Maintainanc' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
              >
                C
              </button>
            </div>
          </div>
          <p v-if="sessions.length === 0" class="text-gray-500 text-sm mt-2">
            কোনো সেশন পাওয়া যায়নি
          </p>
          
        </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white bg-opacity-90 backdrop-blur-md rounded-2xl p-12 shadow-2xl text-center">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
      <p class="mt-4 text-gray-500">লোড হচ্ছে...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl">
      <p>{{ error }}</p>
    </div>

    <!-- Report Content -->
    <div v-else-if="selectedSession" class="space-y-6">

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 text-white shadow-xl">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm opacity-90">মোট প্রত্যাশিত</p>
              <p class="text-2xl font-bold mt-1">{{ formatCurrency(sessionStats.expectedTotal) }}</p>
            </div>
            <i class="fas fa-chart-line text-3xl opacity-50"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-5 text-white shadow-xl">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm opacity-90">নিশ্চিতকৃত</p>
              <p class="text-2xl font-bold mt-1">{{ formatCurrency(sessionStats.confirmedTotal) }}</p>
            </div>
            <i class="fas fa-check-circle text-3xl opacity-50"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-5 text-white shadow-xl">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm opacity-90">বাকি</p>
              <p class="text-2xl font-bold mt-1">{{ formatCurrency(sessionStats.dueTotal) }}</p>
            </div>
            <i class="fas fa-exclamation-triangle text-3xl opacity-50"></i>
          </div>
        </div>
        
        <div class="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-5 text-white shadow-xl">
          <div class="flex justify-between items-start">
            <div>
              <p class="text-sm opacity-90">সম্পন্নতার হার</p>
              <p class="text-2xl font-bold mt-1">{{ sessionStats.amountCompletionRate?.toFixed(1) }}%</p>
            </div>
            <i class="fas fa-percent text-3xl opacity-50"></i>
          </div>
        </div>
      </div>

      <!-- Terms Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white rounded-2xl p-5 shadow-xl">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">মোট টার্ম</p>
              <p class="text-2xl font-bold text-gray-800">{{ sessionStats.totalTerms || 0 }}</p>
            </div>
            <i class="fas fa-list text-3xl text-gray-400"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-2xl p-5 shadow-xl">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">নিশ্চিতকৃত টার্ম</p>
              <p class="text-2xl font-bold text-green-600">{{ sessionStats.confirmedTerms || 0 }}</p>
            </div>
            <i class="fas fa-check-circle text-3xl text-green-400"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-2xl p-5 shadow-xl">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">বাকি টার্ম</p>
              <p class="text-2xl font-bold text-red-600">{{ sessionStats.pendingTerms || 0 }}</p>
            </div>
            <i class="fas fa-clock text-3xl text-red-400"></i>
          </div>
        </div>
      </div>

      <!-- Month-wise Report -->
      <div class="bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div class="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
          <h2 class="text-xl font-bold text-white">মাসভিত্তিক রিপোর্ট</h2>
          <p class="text-sm text-white opacity-90">মাস অনুযায়ী জমার বিবরণ</p>
        </div>
        
        <div class="divide-y divide-gray-200">
          <div v-for="month in monthData" :key="month.month" class="hover:bg-gray-50 transition-colors">
            <!-- Month Header -->
            <div 
              @click="toggleMonth(month.month)"
              class="flex flex-col md:flex-row md:items-center justify-between p-4 cursor-pointer"
            >
              <div class="flex items-center gap-3 mb-2 md:mb-0">
                <i class="fas fa-chevron-right transition-transform duration-200" 
                   :class="{ 'rotate-90': expandedMonths.has(month.month) }"></i>
                <h3 class="text-lg font-semibold text-gray-800">{{ month.month }}</h3>
              </div>
              
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p class="text-gray-500">প্রত্যাশিত</p>
                  <p class="font-semibold text-blue-600">{{ formatCurrency(month.totalExpected) }}</p>
                </div>
                <div>
                  <p class="text-gray-500">নিশ্চিত</p>
                  <p class="font-semibold text-green-600">{{ formatCurrency(month.totalPaid) }}</p>
                </div>
                <div>
                  <p class="text-gray-500">বাকি</p>
                  <p class="font-semibold text-red-600">{{ formatCurrency(month.totalDue) }}</p>
                </div>
                <div>
                  <p class="text-gray-500">টার্ম সমাপ্তি</p>
                  <p class="font-semibold text-purple-600">{{ month.paidCount }}/{{ month.totalCount }}</p>
                </div>
              </div>
            </div>
            
            <!-- Expanded Month Details -->
            <div v-if="expandedMonths.has(month.month)" class="border-t border-gray-100 bg-gray-50 p-4">
              <div class="overflow-x-auto">
                <table class="min-w-full">
                  <thead>
                    <tr class="bg-white border-b">
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">সদস্যের নাম</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">আইডি</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">প্রত্যাশিত</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">জমা</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">বাকি</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">স্ট্যাটাস</th>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">পেমেন্ট মেথড</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200">
                    <tr v-for="(user, idx) in month.users" :key="user.user_id" class="hover:bg-white transition-colors">
                      <td class="px-4 py-2 text-sm text-gray-900">{{ idx + 1 }}</td>
                      <td class="px-4 py-2 text-sm font-medium text-gray-900">{{ user.name || 'N/A' }}</td>
                      <td class="px-4 py-2 text-sm text-gray-600">TBU-{{ user.user_id }}</td>
                      <td class="px-4 py-2 text-sm text-blue-600">{{ formatCurrency(user.expected) }}</td>
                      <td class="px-4 py-2 text-sm text-green-600">{{ formatCurrency(user.paid) }}</td>
                      <td class="px-4 py-2 text-sm text-red-600">{{ formatCurrency(user.due) }}</td>
                      <td class="px-4 py-2">
                        <span :class="['px-2 py-1 rounded-full text-xs font-medium', getStatusBadgeClass(user.isPaid)]">
                          {{ getStatusText(user.isPaid) }}
                        </span>
                      </td>
                      <td class="px-4 py-2 text-sm text-gray-600">
                        <div v-if="user.deposits.length > 0">
                          <span v-for="(dep, i) in user.deposits" :key="i" class="inline-block mr-1">
                            {{ dep.method }}
                          </span>
                        </div>
                        <span v-else class="text-gray-400">-</span>
                      </td>
                    </tr>
                  </tbody>
                 </table>
              </div>
              
              <!-- Month Summary Footer -->
              <div class="mt-4 p-3 bg-white rounded-lg border">
                <div class="flex flex-wrap justify-between gap-3 text-sm">
                  <div>
                    <span class="text-gray-500">মাসের সারসংক্ষেপ:</span>
                    <span class="font-medium ml-2">{{ month.paidCount }}/{{ month.totalCount }} সদস্য পরিশোধ করেছেন</span>
                  </div>
                  <div>
                    <span class="text-gray-500">সম্পন্নতার হার:</span>
                    <span class="font-medium text-green-600 ml-2">{{ month.completionRate.toFixed(1) }}%</span>
                  </div>
                  <div>
                    <span class="text-gray-500">গড় জমা:</span>
                    <span class="font-medium text-blue-600 ml-2">{{ formatCurrency(month.totalPaid / (month.paidCount || 1)) }}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

    <!-- No Session Selected -->
    <div v-else-if="!isLoading && sessions.length > 0" class="bg-white rounded-2xl p-12 shadow-2xl text-center">
      <i class="fas fa-calendar-alt text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-500 text-lg">দয়া করে একটি সেশন নির্বাচন করুন</p>
      <p class="text-gray-400 text-sm mt-2">রিপোর্ট দেখতে উপরের সেশন সিলেক্টর ব্যবহার করুন</p>
    </div>

    <!-- No Data State -->
    <div v-else-if="!isLoading && sessions.length === 0" class="bg-white rounded-2xl p-12 shadow-2xl text-center">
      <i class="fas fa-database text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-500 text-lg">কোনো ডাটা পাওয়া যায়নি</p>
      <p class="text-gray-400 text-sm mt-2">প্রথমে একটি সেশন তৈরি করুন</p>
    </div>
  </div>
</template>

<style scoped>
.rotate-90 {
  transform: rotate(90deg);
}

.transition-transform {
  transition-property: transform;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
</style>