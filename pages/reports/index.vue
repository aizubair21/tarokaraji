<script setup>
const auth = useAuthStore()
const isLoading = ref(false)

// Report categories
const reportCategories = ref([
  {
    id: 'user-summary',
    name: 'ইউজার সামারি রিপোর্ট',
    description: 'সেশন অনুযায়ী সকল ব্যবহারকারীর মোট জমা, বকেয়া এবং পরিশোধের হার সংক্রান্ত বিস্তারিত রিপোর্ট',
    icon: 'fas fa-users',
    color: 'from-blue-500 to-cyan-500',
    route: '/reports/summary',
    features: ['সেশন ভিত্তিক ফিল্টার', 'চলতি মাস/পূর্ণ বছর হিসাব', 'এক্সপোর্ট সুবিধা']
  },
   {
     id: 'paid-months',
     name: 'পরিশোধিত মাস রিপোর্ট',
     description: 'ব্যবহারকারীভিত্তিক পরিশোধিত মাসের বিস্তারিত তালিকা',
     icon: 'fas fa-check-circle',
     color: 'from-green-500 to-emerald-500',
     route: '/reports/deposits',
   },
  // {
  //   id: 'unpaid-months',
  //   name: 'অপরিশোধিত মাস রিপোর্ট',
  //   description: 'ব্যবহারকারীদের বকেয়া মাসের বিস্তারিত তালিকা ও জরুরি পদক্ষেপ',
  //   icon: 'fas fa-exclamation-triangle',
  //   color: 'from-red-500 to-orange-500',
  //   route: '/reports/unpaid-months',
  //   features: ['বকেয়া মাস ফিল্টার', 'রিমাইন্ডার পাঠান', 'এক্সপোর্ট সুবিধা']
  // },
  {
    id: 'session-wise',
    name: 'সেশন ভিত্তিক রিপোর্ট',
    description: 'সেশনরে মোট জমা, লক্ষ্যমাত্রা এবং অগ্রগতির রিপোর্ট । সেশন অনুযায়ী মাসিক জমা ... ',
    icon: 'fas fa-calendar-alt',
    color: 'from-purple-500 to-pink-500',
    route: '/reports/sessions',
    features: ['সেশন তুলনা', 'গ্রাফ ভিউ', 'লক্ষ্যমাত্রা ট্র্যাকিং']
  },
  // {
  //   id: 'monthly-trends',
  //   name: 'মাসিক প্রবণতা রিপোর্ট',
  //   description: 'মাস ভিত্তিক জমার প্রবণতা এবং তুলনামূলক বিশ্লেষণ',
  //   icon: 'fas fa-chart-line',
  //   color: 'from-indigo-500 to-purple-500',
  //   route: '/reports/monthly-trends',
  //   features: ['ট্রেন্ড বিশ্লেষণ', 'গ্রাফিক্যাল ভিউ', 'প্রেডিকশন']
  // },
  // {
  //   id: 'collection-efficiency',
  //   name: 'সংগ্রহ দক্ষতা রিপোর্ট',
  //   description: 'সেশন ও মাস অনুযায়ী সংগ্রহ দক্ষতার হার ও বিশ্লেষণ',
  //   icon: 'fas fa-chart-pie',
  //   color: 'from-yellow-500 to-orange-500',
  //   route: '/reports/collection-efficiency',
  //   features: ['দক্ষতা মেট্রিক্স', 'টার্গেট ভিএস অ্যাকচুয়াল', 'রেটিং সিস্টেম']
  // },
  {
    id: 'top-contributors',
    name: 'শীর্ষ অবদানকারী রিপোর্ট',
    description: 'সর্বোচ্চ জমাদানকারী ব্যবহারকারীদের তালিকা ও পুরস্কার ব্যবস্থা',
    icon: 'fas fa-trophy',
    color: 'from-yellow-500 to-amber-500',
    route: '/deposits/contributions',
    features: ['র‍্যাঙ্কিং', 'সার্টিফিকেট জেনারেট', 'পুরস্কার ঘোষণা']
  },
  {
    id: 'payment-methods',
    name: 'পেমেন্ট মেথড রিপোর্ট',
    description: 'বিভিন্ন পেমেন্ট পদ্ধতির ব্যবহার ও জনপ্রিয়তা বিশ্লেষণ',
    icon: 'fas fa-credit-card',
    color: 'from-teal-500 to-green-500',
    route: '/reports/payments',
    features: ['মেথড ভিত্তিক বিশ্লেষণ', 'ট্রেন্ড চার্ট', 'ব্যবহারকারী প্রেফারেন্স']
  }
])

// Search functionality
const searchQuery = ref('')
const selectedCategory = ref('all')

const filteredReports = computed(() => {
  let reports = reportCategories.value
  
  if (selectedCategory.value !== 'all') {
    reports = reports.filter(r => r.id === selectedCategory.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    reports = reports.filter(r => 
      r.name.toLowerCase().includes(query) || 
      r.description.toLowerCase().includes(query) ||
      r.features.some(f => f.toLowerCase().includes(query))
    )
  }
  
  return reports
})

// Popular reports (for quick access)
const popularReports = computed(() => {
  return reportCategories.value.slice(0, 3)
})

// Quick stats
const stats = ref({
  totalReports: reportCategories.value.length,
  totalUsers: 0,
  totalDeposits: 0,
  pendingDues: 0
})

const fetchStats = async () => {
  try {
    const [users, deposits] = await Promise.all([
      $fetch('/api/crud/Users'),
      $fetch('/api/crud/Transactions')
    ])
    
    stats.value.totalUsers = users.length
    stats.value.totalDeposits = deposits.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
    
    // Calculate pending dues (simplified)
    const totalExpected = users.length * 12 * 500 // Assuming 500 per month
    stats.value.pendingDues = totalExpected - stats.value.totalDeposits
  } catch (error) {
    console.error('Error fetching stats:', error)
  }
}

// Navigate to report
const navigateToReport = (route) => {
  navigateTo(route)
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="space-y-6">

    <!-- Header -->
    <!-- <div class="bg-white bg-opacity-90 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            রিপোর্টস সেন্টার
          </h1>
          <p class="text-sm text-gray-500 mt-1">বিভিন্ন রিপোর্ট ও বিশ্লেষণ দেখুন এবং ডাউনলোড করুন</p>
        </div>
        <button 
          @click="fetchStats"
          class="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl py-2.5 px-5 hover:from-purple-600 hover:to-pink-600 transition-all font-semibold shadow-lg"
        >
          <i class="fas fa-sync-alt mr-2"></i> রিফ্রেশ
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
          <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
            <i class="fas fa-chart-line text-white text-sm"></i>
          </div>
          <div>
            <p class="text-xs text-gray-500">মোট রিপোর্ট</p>
            <p class="text-xl font-bold text-gray-800">{{ stats.totalReports }} টি</p>
          </div>
        </div>
        
        <div class="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
          <div class="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
            <i class="fas fa-users text-white text-sm"></i>
          </div>
          <div>
            <p class="text-xs text-gray-500">মোট ব্যবহারকারী</p>
            <p class="text-xl font-bold text-gray-800">{{ stats.totalUsers }} জন</p>
          </div>
        </div>
        
        <div class="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
          <div class="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
            <i class="fas fa-money-bill-wave text-white text-sm"></i>
          </div>
          <div>
            <p class="text-xs text-gray-500">মোট জমা</p>
            <p class="text-xl font-bold text-green-600">৳{{ stats.totalDeposits.toLocaleString() }}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
          <div class="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">
            <i class="fas fa-exclamation-triangle text-white text-sm"></i>
          </div>
          <div>
            <p class="text-xs text-gray-500">বকেয়া জমা</p>
            <p class="text-xl font-bold text-red-600">৳{{ stats.pendingDues.toLocaleString() }}</p>
          </div>
        </div>
      </div> 
    </div> -->

    <!-- Search and Filter Bar -->
   <!--  <div class="bg-white bg-opacity-90 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[250px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            <i class="fas fa-search mr-1"></i> রিপোর্ট অনুসন্ধান
          </label>
          <div class="relative">
            <input 
              v-model="searchQuery"
              type="text"
              placeholder="রিপোর্টের নাম, বিবরণ বা ফিচার দ্বারা অনুসন্ধান..."
              class="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <i class="fas fa-search absolute left-3 top-3.5 text-gray-400"></i>
            <button 
              v-if="searchQuery"
              @click="searchQuery = ''"
              class="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
        
        <div class="min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">ক্যাটাগরি ফিল্টার</label>
          <select 
            v-model="selectedCategory"
            class="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">সব রিপোর্ট</option>
            <option value="user-summary">ইউজার সামারি</option>
            <option value="paid-months">পরিশোধিত মাস</option>
            <option value="unpaid-months">অপরিশোধিত মাস</option>
            <option value="session-wise">সেশন ভিত্তিক</option>
            <option value="monthly-trends">মাসিক প্রবণতা</option>
            <option value="collection-efficiency">সংগ্রহ দক্ষতা</option>
            <option value="top-contributors">শীর্ষ অবদানকারী</option>
            <option value="payment-methods">পেমেন্ট মেথড</option>
          </select>
        </div>
      </div>
      
      <div v-if="searchQuery || selectedCategory !== 'all'" class="mt-4 pt-3 border-t border-gray-200">
        <div class="flex justify-between items-center text-sm">
          <div class="text-gray-600">
            <i class="fas fa-chart-simple mr-1"></i>
            {{ filteredReports.length }} টি রিপোর্ট পাওয়া গেছে
          </div>
          <button 
            @click="searchQuery = ''; selectedCategory = 'all'"
            class="text-purple-600 hover:text-purple-800 font-medium"
          >
            <i class="fas fa-undo-alt mr-1"></i> রিসেট ফিল্টার
          </button>
        </div>
      </div>
    </div> -->

    <!-- Popular Reports Section -->
    <!-- div class="bg-white bg-opacity-90 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-xl font-bold text-gray-800">
            <i class="fas fa-fire text-orange-500 mr-2"></i>
            জনপ্রিয় রিপোর্ট
          </h2>
          <p class="text-sm text-gray-500 mt-1">সবচেয়ে বেশি ব্যবহৃত রিপোর্টগুলো</p>
        </div>
        <NuxtLink to="/reports/all" class="text-purple-600 hover:text-purple-800 text-sm font-medium">
          সবগুলো দেখুন <i class="fas fa-arrow-right ml-1"></i>
        </NuxtLink>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          v-for="report in popularReports" 
          :key="report.id"
          @click="navigateToReport(report.route)"
          class="bg-gradient-to-r p-4 rounded-xl cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-lg"
          :class="report.color"
        >
          <div class="text-white">
            <i :class="[report.icon, 'text-3xl mb-2']"></i>
            <h3 class="font-bold text-lg mt-2">{{ report.name }}</h3>
            <p class="text-sm opacity-90 mt-1">{{ report.description.substring(0, 80) }}...</p>
            <div class="mt-3 flex items-center text-xs opacity-80">
              <i class="fas fa-chart-line mr-1"></i>
              <span>তাত্ক্ষণিক ভিউ</span>
              <i class="fas fa-arrow-right ml-auto"></i>
            </div>
          </div>
        </div>
      </div>
    </div> -->

    <!-- All Reports Grid -->
    <div class="bg-white bg-opacity-90 backdrop-blur-md rounded-2xl ">
      <h2 class="text-xl font-bold text-gray-800 mb-4">
        <i class="fas fa-list-alt text-purple-600 mr-2"></i>
        সকল রিপোর্ট
      </h2>
      
      <div v-if="filteredReports.length === 0" class="text-center py-12">
        <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg">কোনো রিপোর্ট পাওয়া যায়নি</p>
        <p class="text-gray-400 text-sm mt-1">অনুগ্রহ করে ভিন্ন কীওয়ার্ড দিয়ে অনুসন্ধান করুন</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="report in filteredReports" 
          :key="report.id"
          class="group bg-white border-2 rounded-2xl p-5 hover:shadow-2xl transition-all duration-300 cursor-pointer hover:border-purple-300"
          @click="navigateToReport(report.route)"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-r flex items-center justify-center shadow-lg"
                 :class="report.color">
              <i :class="[report.icon, 'text-white text-xl']"></i>
            </div>
            <i class="fas fa-arrow-right text-gray-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all"></i>
          </div>
          
          <h3 class="text-lg font-bold text-gray-800 mb-2">{{ report.name }}</h3>
          <p class="text-sm text-gray-600 mb-3">{{ report.description }}</p>

        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <!-- <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-xl hover:shadow-2xl transition-all">
        <div class="text-center">
          <i class="fas fa-print text-2xl mb-2"></i>
          <p class="text-sm font-medium">প্রিন্ট রিপোর্ট</p>
          <p class="text-xs opacity-80 mt-1">যেকোনো রিপোর্ট প্রিন্ট করুন</p>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-xl hover:shadow-2xl transition-all">
        <div class="text-center">
          <i class="fas fa-download text-2xl mb-2"></i>
          <p class="text-sm font-medium">এক্সপোর্ট ডাটা</p>
          <p class="text-xs opacity-80 mt-1">CSV, PDF, Excel ফরম্যাটে</p>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-xl hover:shadow-2xl transition-all">
        <div class="text-center">
          <i class="fas fa-chart-line text-2xl mb-2"></i>
          <p class="text-sm font-medium">এনালাইটিক্স</p>
          <p class="text-xs opacity-80 mt-1">বিস্তারিত বিশ্লেষণ</p>
        </div>
      </div>
      
      <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white shadow-xl hover:shadow-2xl transition-all">
        <div class="text-center">
          <i class="fas fa-bell text-2xl mb-2"></i>
          <p class="text-sm font-medium">শিডিউল রিপোর্ট</p>
          <p class="text-xs opacity-80 mt-1">ইমেইলে রিপোর্ট পান</p>
        </div>
      </div>
    </div> -->

  </div>
</template>

<style scoped>
.group:hover {
  transform: translateY(-4px);
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
