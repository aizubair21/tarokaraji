<script setup>
const auth = useAuthStore()

definePageMeta({ middleware: 'auth' });

const deposits = ref(useDepositsStore().all);
const users = ref(useUsersStore().user);
const members = ref([]);


const getAmount = (deposit) => {
  return parseFloat(deposit.amount) || 0
}

const totalDeposit = computed(() => {
  return deposits.value?.reduce((sum, d) => sum + d.amount, 0) || 0
})
console.log(totalDeposit);

// const totalMember = computed(() => {
//   return users.value?.filter(u => u.role === 'admin')?.length || 0
// })

// const totalUser = computed(() => {
//   // Filter users where role is 'user'
//   return users.value?.filter(u => u.role === 'user' && u.status === 'active')?.length || 0
// })

// const lastFiveDeposit = computed(() => {
//   return deposits.value?.slice(-5).reverse() || []
// })

const lastFiveMembers = computed(() => {
  return users.value?.slice(-5).reverse() || []
})

// mc
39
const userDeposits = computed(() => {
  if (!auth.isAdmin && auth.userId) {
    return deposits.value?.filter(d => d.user_id === auth.userId) || []
  }
  return []
})

const userTotalDeposit = computed(() => {
  return userDeposits.value.reduce((sum, d) => sum + d.month, 0) || 0
})

const topContributors = computed(() => {
  const contributions = {}

  deposits.value.forEach(deposit => {
    const userId = deposit.user_id
    const amount = getAmount(deposit)
    if (!contributions[userId]) contributions[userId] = 0
    contributions[userId] += amount
  })

  return Object.entries(contributions)
    .map(([userId, total]) => {
      const user = users.value.find(u => u.user_id === userId)
      return {
        userId,
        name: user ? user.name_english : 'Unknown',
        total
      }
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
})

const paymentMethodStats = computed(() => {
  const methods = {}

  deposits.value.forEach(deposit => {
    const method = deposit.method
    const amount = getAmount(deposit)
    if (!methods[method]) methods[method] = 0
    methods[method] += amount
  })

  return Object.entries(methods).map(([method, total]) => ({
    method,
    total,
    percentage: (total / totalDeposit.value) * 100
  }))
})


// console.log(users);
// console.log(topContributors);

</script>

<template>

  <!-- Loading State -->
  <!--  <div v-if="auth.isLoading" class="flex justify-center items-center h-96">
    <div class="text-center">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
      <p class="mt-4 text-gray-500">লোড হচ্ছে...</p>
    </div>
  </div> -->

  <!-- Empty State -->
  <!--  <div v-if="deposits.length < 1" class="bg-white rounded-2xl p-12  text-center">
    <i class="fas fa-database text-6xl text-gray-300 mb-4"></i>
    <p class="text-gray-500 text-lg">কোনো তথ্য পাওয়া যায়নি</p>
    <p class="text-gray-400 text-sm mt-2">দয়া করে কিছুক্ষণ পর আবার চেষ্টা করুন</p>
  </div> -->


  <div class="space-y-6">

    <!-- Header -->
    <div class="bg-white bg-opacity-90 backdrop-blur-md rounded-2xl p-6 ">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        ড্যাশবোর্ড
      </h1>
      <p class="text-sm text-gray-500 mt-1">Connected to Google Sheets</p>
    </div>

    <!-- Overview Section -->
    <DepositOverview v-if="auth.isAdmin" :deposits />

    <!-- Top Contributors & Payment Methods -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Top Contributors -->
      <div class="bg-white rounded-2xl p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-trophy text-yellow-500 mr-2"></i>
          শীর্ষ অবদানকারী
        </h3>
        <div class="space-y-3">
          <div v-for="(contributor, idx) in topContributors" :key="contributor.userId"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold" :class="{
                'bg-yellow-100 text-yellow-600': idx === 0,
                'bg-gray-200 text-gray-600': idx === 1,
                'bg-orange-100 text-orange-600': idx === 2,
                'bg-blue-100 text-blue-600': idx >= 3
              }">
                {{ idx + 1 }}
              </div>
              <div>
                <p class="font-medium text-gray-800">{{ contributor.name }}</p>
                <p class="text-xs text-gray-500">আইডি: {{ contributor.userId }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-bold text-green-600">৳{{ contributor.total.toLocaleString() }}</p>
              <p class="text-xs text-gray-500">
                {{ ((contributor.total / totalDeposit) * 100).toFixed(1) }}% মোটের
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Methods Distribution -->
      <div class="bg-white rounded-2xl p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <i class="fas fa-credit-card text-blue-500 mr-2"></i>
          পেমেন্ট মেথড বিশ্লেষণ
        </h3>
        <div class="space-y-3">
          <div v-for="method in paymentMethodStats" :key="method.method" class="space-y-1">
            <div class="flex justify-between text-sm">
              <span class="font-medium text-gray-700">{{ method.method || 'অন্যান্য' }}</span>
              <span class="text-gray-600">৳{{ method.total.toLocaleString() }}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                :style="{ width: `${method.percentage}%` }"></div>
            </div>
            <p class="text-xs text-gray-500 text-right">{{ method.percentage.toFixed(1) }}%</p>
          </div>
        </div>
      </div>
    </div>


    <!-- Admin Section -->
    <div v-if="auth.isAdmin">
      <!-- Recent Members -->
      <div>
        <h2 class="mt-2 text-xl font-bold text-white mb-4 pb-2 border-b border-gray-300">সর্বশেষ নিবন্ধিত সদস্য</h2>

        <div class="bg-white rounded-2xl  overflow-hidden">
          <div class="divide-y divide-gray-200">
            <div v-for="(member, index) in lastFiveMembers" :key="index"
              class="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div class="flex items-center space-x-4">
                <div
                  class="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {{ index + 1 }}
                </div>
                <div>
                  <p class="font-medium text-gray-900">{{ member.name_bangla || 'নাম নেই' }}</p>
                  <p class="text-sm text-gray-500">আইডি: {{ member.user_id }}</p>
                </div>
              </div>
              <div class="flex space-x-2">
                <NuxtLink v-if="auth.isAdmin" :to="`/users/${member.user_id}`"
                  class="bg-blue-500 text-white rounded-lg p-2 hover:bg-blue-600 transition-colors shadow-md">
                  <i class="fas fa-edit"></i>
                </NuxtLink>
                <NuxtLink :to="`/users/view/${member.user_id}`"
                  class="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-2 hover:from-purple-600 hover:to-pink-600 transition-colors shadow-md">
                  <i class="fas fa-angle-right"></i>
                </NuxtLink>
              </div>
            </div>
            <div v-if="lastFiveMembers.length === 0" class="p-8 text-center text-gray-500">
              কোনো সদস্যের তথ্য পাওয়া যায়নি
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- User Section (Non-Admin) -->
    <div v-else class="mt-5">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6  text-white">
          <h3 class="text-lg font-semibold mb-2">আমার মোট আমানত</h3>
          <p class="text-3xl font-bold">{{ userTotalDeposit.toLocaleString() }} ৳</p>
          <p class="text-sm opacity-90 mt-2">মোট {{ userDeposits.length }} টি লেনদেন</p>
        </div>

        <div class="bg-white rounded-2xl p-6 ">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">সর্বশেষ লেনদেন</h3>
          <div class="space-y-3">
            <div v-for="(deposit, index) in userDeposits.slice(-3).reverse()" :key="index"
              class="flex justify-between items-center border-b pb-2">
              <div>
                <p class="text-sm text-gray-600">{{ deposit.month }} {{ deposit.session }}</p>
                <p class="text-xs text-gray-400">{{ deposit.type }}</p>
              </div>
              <p class="font-semibold text-green-600">৳{{ getAmount(deposit).toLocaleString() }}</p>
            </div>
            <div v-if="userDeposits.length === 0" class="text-center text-gray-500 py-4">
              কোনো লেনদেন নেই
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>


</template>
