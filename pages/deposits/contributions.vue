<script setup>
const auth = useAuthStore()
const data = useDataStore()
const route = useRoute()

// Data
const users = ref([])
const deposits = ref([])
const isLoading = ref(false)
const searchQuery = ref('')
const selectedSession = ref(auth.currentSession || '')
const selectedMonth = ref('all') // 'all' or specific month
const sessions = ref([]);

// Fetch data
const fetchData = async () => {
  try {
    auth.isLoading = true;
    users.value = useUsersStore().user;
    deposits.value = useDepositsStore().all
    sessions.value = useSessionsStore().session;
  } catch (error) {
    console.error('Error fetching data:', error)
  } finally {
    auth.isLoading = false
  }
}

// Get amount safely
const getAmount = (deposit) => parseFloat(deposit.amount) || 0

// Computed: Available sessions and months
// const sessions = computed(() => {
//   const unique = [...new Set(deposits.value.map(d => d.session).filter(Boolean))]
//   return Array.from(unique).sort().reverse()
// })

const months = computed(() => {
  const unique = [...new Set(deposits.value.map(d => d.month).filter(Boolean))]
  return ['all', ...Array.from(unique).sort()]
})

// Computed: Filtered deposits
const filteredDeposits = computed(() => {
  let filtered = deposits.value

  if (selectedSession.value) {
    filtered = filtered.filter(d => d.session === selectedSession.value)
  }

  if (selectedMonth.value !== 'all') {
    filtered = filtered.filter(d => d.month === selectedMonth.value)
  }

  return filtered
})


// Computed: Contributions by user
const contributions = computed(() => {
  const contrib = {}

  filteredDeposits.value.forEach(deposit => {
    const userId = deposit.user_id;
    if (!userId) return 

    if (!contrib[userId]) {
      contrib[userId] = {
        userId,
        total: 0,
        count: 0,
        avg: 0
      }
    }

    const amt = getAmount(deposit)
    contrib[userId].total += amt
    contrib[userId].count += 1
  })
  // console.log(Object.values(contrib));
  // Join with users
  return Object.values(contrib)
    .map(c => {
      const user = users.value.find(u => u.user_id == parseInt(c.userId));
      return {
        ...c,
        name: user ? user.name_bangla : 'Unknown',
        percentage: 0 // set later
      }
    })
    .sort((a, b) => b.total - a.total)
})

// Set percentages
const totalContributions = computed(() => 
  contributions.value.reduce((sum, c) => sum + c.total, 0)
)

const contributionsWithPct = computed(() => 
  contributions.value.map(c => ({
    ...c,
    avg: c.count > 0 ? (c.total / c.count).toFixed(0) : 0,
    percentage: totalContributions.value > 0 ? ((c.total / totalContributions.value) * 100).toFixed(1) : 0
  }))
)

// Filtered by search
const filteredContributions = computed(() => {
  if (!searchQuery.value) return contributionsWithPct.value
  const q = searchQuery.value.toLowerCase()
  return contributionsWithPct.value.filter(c => 
    c.name_bangla.toLowerCase().includes(q)
  )
})

// Stats
const topContributor = computed(() => filteredContributions.value[0])
const avgPerMember = computed(() => {
  const count = filteredContributions.value.length
  return count > 0 ? (totalContributions.value / count).toFixed(0) : 0
})

// Load on mount
onMounted(() => {
  if (!auth.isAuthenticated) {
    return navigateTo('/login')
  }
  fetchData()
})
</script>

<template>
  <div class="min-h-screen py-8">
    <div class="max-w-7xl mx-auto">

      <!-- Header -->
      <div class="text-center mb-12 print:mb-3">
        <h1 class="text-4xl md:text-5xl font-bold text-gray-700 mb-4">
          অবদানকারীদের তালিকা
        </h1>
        <p class="text-xl text-gray-600 max-w-2xl mx-auto">
          সকল সদস্যের আমানতের হার।
        </p>
      </div>



      <!-- Filters -->
      <div v-if="!isLoading" class=" p-6 print:p-0 mb-8 print:mb-0">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center">
          <div class="mx-w-md">
            <!-- <label class="block text-sm font-medium text-gray-700 mb-2">সেশন</label> -->
            <select 
              v-model="selectedSession" 
              class="w-full mx-w-md p-3 bg-white transition-all"
              @change="fetchData"
            >
              <option value="">সকল সেশন</option>
              <option v-for="session in sessions" :key="session.sessionName" :value="session.sessionName">
                {{ session.sessionName }}
              </option>
            </select>
          </div>
          <div class="mx-w-md">
            <!-- <label class="block text-sm font-medium text-gray-700 mb-2">মাস</label> -->
            <select 
              v-model="selectedMonth" 
              class="w-full mx-w-md p-3 bg-white transition-all"
              @change="fetchData"
            >
              <option value="all">সকল মাস</option>
              <option v-for="month in data.months" :key="month" :value="month">
                {{ month }}
              </option>
            </select>
          </div>
          <!-- <div class="print:hidden">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="সদস্যের নাম লিখুন..."
              class="w-full p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div> -->
        </div>
      </div>

      <!-- <pre> {{filteredDeposits.length}} </pre> -->
      <!-- <pre> {{contributions}} </pre> -->

      <!-- Stats Cards -->
      <div v-if="!isLoading && filteredContributions.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 print:mb-0">
        <div class="bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl p-8 text-white shadow-2xl hover:shadow-3xl transition-all print:bg-white print:border-0 print:text-gray-900 print:shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-90">মোট অবদান</p>
              <p class="text-4xl font-bold mt-2">৳{{ totalContributions.toLocaleString() }}</p>
            </div>
            <i class="fas fa-coins text-5xl opacity-75"></i>
          </div>
        </div>
        <div class="bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl p-8 text-white shadow-2xl hover:shadow-3xl transition-all print:bg-white print:border-0 print:text-gray-900 print:shadow-sm">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-90">গড় প্রতি সদস্য</p>
              <p class="text-4xl font-bold mt-2">৳{{ avgPerMember.toLocaleString() }}</p>
            </div>
            <i class="fas fa-chart-bar text-5xl opacity-75"></i>
          </div>
        </div>
        <!-- <div v-if="topContributor" class="bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl p-8 text-white shadow-2xl hover:shadow-3xl transition-all">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-90">শীর্ষ অবদানকারী</p>
              <p class="text-2xl font-bold mt-1">{{ topContributor.name }}</p>
              <p class="text-3xl font-bold">৳{{ topContributor.total.toLocaleString() }}</p>
            </div>
            <i class="fas fa-trophy text-5xl opacity-75"></i>
          </div>
        </div> -->
      </div>

      <!-- Table -->
      <div class="bg-white/80 backdrop-blur-md rounded-3xl p-6 print:py-2 shadow-2xl print:shadow-0 border print:border-0 border-white/50 overflow-hidden">
        <div v-if="isLoading" class="flex justify-center items-center py-20">
          <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
          <p class="ml-4 text-gray-500">লোড হচ্ছে...</p>
        </div>

        <div v-else-if="filteredContributions.length === 0" class="text-center py-20">
          <i class="fas fa-inbox text-6xl text-gray-300 mb-6"></i>
          <p class="text-2xl text-gray-500 mb-2">কোনো অবদান পাওয়া যায়নি</p>
          <p class="text-gray-400">ফিল্টার পরিবর্তন করুন অথবা সার্চ করুন</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full table-auto">
            <thead>
              <tr class="bg-gradient-to-r from-gray-50 to-gray-100">
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider rounded-tl-2xl">র‍্যাঙ্ক</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">নাম</th>
                <th class="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">মোট অবদান</th>
                <th class="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">লেনদেন</th>
                <th class="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">গড়</th>
                <th class="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider rounded-tr-2xl">মোটের %</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr 
                v-for="(contrib, index) in filteredContributions" 
                :key="contrib.userId"
                class="hover:bg-gray-50 transition-colors group"
              >
                <td class="px-6 py-5">
                  <div class="flex items-center justify-center w-10 h-10 rounded-full font-bold 
                    {{ index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' : 
                       index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-600' : 
                       index === 2 ? 'bg-gradient-to-r from-orange-400 to-red-500' : 
                       'bg-gray-300 text-gray-700' }}">
                    {{ index + 1 }}
                  </div>
                </td>
                <td class="px-6 py-5 font-medium text-gray-900 group-hover:text-blue-600">
                  {{ contrib.name }}
                </td>
                <td class="px-6 py-5 text-right">
                  <div class="font-bold text-2xl text-green-600">
                    ৳{{ contrib.total.toLocaleString() }}
                  </div>
                </td>
                <td class="px-6 py-5 text-right text-sm text-gray-700">
                  {{ contrib.count }} টি
                </td>
                <td class="px-6 py-5 text-right">
                  <div class="font-semibold text-lg text-blue-600">
                    ৳{{ contrib.avg.toLocaleString() }}
                  </div>
                </td>
                <td class="px-6 py-5 text-right text-sm font-semibold text-purple-600">
                  {{ contrib.percentage }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary Footer -->
        <div v-if="filteredContributions.length > 0" class="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          {{ filteredContributions.length }} জন সদস্যের তথ্য প্রদর্শিত • 
          সেশন: {{ selectedSession || 'সকল' }} • 
          মাস: {{ selectedMonth === 'all' ? 'সকল' : selectedMonth }}
        </div>
      </div>
    </div>
  </div>
</template>

