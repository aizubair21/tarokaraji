<script setup>
const auth = useAuthStore()
const data = useDataStore()

auth.isLoading = false;

if (!auth.isAuthenticated) {
  await navigateTo('/login')
}

const members = ref(useUsersStore().user)
const searchQuery = ref('')
const selectedRole = ref('user') // 'all', 'admin', 'user'
const isLoading = ref(false)

// Search and filter functionality
const filteredMembers = computed(() => {
  let filtered = members.value

  // Filter by role
  if (selectedRole.value !== 'all') {
    filtered = filtered.filter(member => member.role === selectedRole.value)
  }

  // Filter by search query (name, email, or user_id)
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(member => {
      return (
        member.name_bangla?.toLowerCase().includes(query) ||
        member.name_english?.toLowerCase().includes(query) ||
        member.email?.toLowerCase().includes(query) ||
        member.user_id?.toString().toLowerCase().includes(query) ||
        member.user_id?.toString().toLowerCase().includes(query)
      )
    })
  }

  return filtered
})

// Statistics
const stats = computed(() => {
  const totalAdmins = members.value.filter(m => m.role == 'admin').length
  const totalUsers = members.value.filter(m => m.status == 'active' && m.role == 'users').length
  const tusr = members.value.filter(m => m.status == 'active').length
  return {
    total: tusr,
    admins: totalAdmins,
    users: totalUsers,
    filtered: filteredMembers.value.length
  }
})

const deleteMember = async (id) => {
  if (!confirm('আপনি কি এই সদস্যকে মুছে ফেলতে চান?')) return

  try {
    await $fetch(`/api/curd/Users?id=${id}`, {
      method: 'DELETE'
    })
    await fetchMembers()
  } catch (error) {
    console.error('Error deleting member:', error)
  }
}

const getRoleBadgeClass = (role) => {
  return role === 'admin'
    ? 'bg-purple-100 text-purple-800'
    : 'bg-blue-100 text-blue-800'
}

const getRoleText = (role) => {
  return role === 'admin' ? 'পরিচালক' : 'সদস্য'
}

</script>

<template>
  <div>
    <!-- Header Section -->
    <div class="bg-white bg-opacity-90 backdrop-blur-md border-b p-6 mb-6">
      <div class="flex justify-between items-start md:items-center gap-4">
        <div>
          <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            সদস্যবৃন্দ
          </h1>
          <p class="text-sm text-gray-500 mt-1">মোট সদস্য: {{ stats.total }} জন</p>
        </div>

        <NuxtLink v-if="auth.isAdmin" to="/members/add"
          class="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl py-3 px-6 hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-purple-300 transform hover:scale-105 transition-all duration-200 font-semibold shadow-lg inline-block">
          <i class="fas fa-plus mr-2"></i> যুক্ত করুন
        </NuxtLink>

      </div>
    </div>

    <!-- Search and Filter Section -->
    <div class="bg-white bg-opacity-90 backdrop-blur-md p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Search Input -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="fas fa-search mr-2"></i> অনুসন্ধান করুন
          </label>
          <div class="relative">
            <input v-model="searchQuery" type="text" placeholder="নাম, ইমেইল বা আইডি দ্বারা অনুসন্ধান..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200" />
            <i class="fas fa-search absolute left-3 top-4 text-gray-400"></i>
            <button v-if="searchQuery" @click="searchQuery = ''"
              class="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            <i class="fas fa-info-circle mr-1"></i>
            বাংলা নাম, ইংরেজি নাম, ইমেইল বা আইডি দিয়ে অনুসন্ধান করুন
          </p>
        </div>

        <!-- Role Filter -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            <i class="fas fa-filter mr-2"></i> ফিল্টার
          </label>
          <div class="flex gap-2">
            <!-- <button 
              @click="selectedRole = 'all'"
              class="flex-1 px-4 py-2 rounded-xl transition-all duration-200 font-medium"
              :class="selectedRole === 'all' 
                ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
            >
              সব ({{ stats.total }})
            </button> -->
            <button @click="selectedRole = 'admin'"
              class="flex-1 px-4 py-2 rounded-xl transition-all duration-200 font-medium" :class="selectedRole === 'admin'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'">
              পরিচালক ({{ stats.admins }})
            </button>
            <button @click="selectedRole = 'user'"
              class="flex-1 px-4 py-2 rounded-xl transition-all duration-200 font-medium" :class="selectedRole === 'user'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'">
              সদস্য ({{ stats.users }})
            </button>
          </div>
        </div>
      </div>

      <!-- Filter Results Summary -->
      <div v-if="searchQuery || selectedRole !== 'all'" class="mt-4 pt-4 border-t border-gray-200">
        <div class="flex justify-between items-center text-sm">
          <div class="text-gray-600">
            <i class="fas fa-chart-line mr-1"></i>
            {{ stats.filtered }} টি ফলাফল {{ stats.total }} টির মধ্যে
          </div>
          <button @click="searchQuery = ''; selectedRole = 'all'" class="text-red-600 hover:text-red-800 font-medium">
            <i class="fas fa-undo-alt mr-1"></i> ফিল্টার রিসেট
          </button>
        </div>
      </div>
    </div>

    <!-- Members List -->
    <div class="bg-white bg-opacity-90 backdrop-blur-md overflow-hidden">
      <div v-if="isLoading" class="p-12 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
        <p class="mt-4 text-gray-500">লোড হচ্ছে...</p>
      </div>

      <div v-else-if="filteredMembers.length === 0" class="p-12 text-center">
        <i class="fas fa-users-slash text-6xl text-gray-300 mb-4"></i>
        <p class="text-gray-500 text-lg">কোনো সদস্য পাওয়া যায়নি</p>
        <p class="text-gray-400 text-sm mt-2">অনুগ্রহ করে অনুসন্ধান পরিবর্তন করুন</p>
      </div>

      <div v-else class="divide-y divide-gray-200">
        <div v-for="(member, index) in filteredMembers" :key="member.user_id"
          class="p-4 hover:bg-gray-50 transition-colors">
          <div :class="['flex flex-col md:flex-row md:items-center md:justify-between gap-4']">
            <!-- Member Info -->
            <div class="flex-1">
              <div class="flex items-start gap-3">
                <!-- Avatar -->
                <div
                  class="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {{ member.name_bangla?.charAt(0) || '?' }}
                </div>

                <!-- Details -->
                <div v-if="member.status != 'inactive'" class="flex-1">
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <h3 class="text-lg font-semibold text-gray-900">
                      {{ member.name_bangla || 'নাম নেই' }}
                    </h3>
                    <!-- <span class="text-sm text-gray-500">
                      ({{ member.name_english || 'N/A' }})
                    </span> -->
                    <span :class="['px-2 py-1 rounded-full text-xs font-medium', getRoleBadgeClass(member.role)]">
                      {{ getRoleText(member.role) }}
                    </span>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div class="flex items-center text-gray-600">
                      <i class="fas fa-id-card w-5 text-purple-500"></i>
                      <span class="ml-2">আইডি: TBU-{{ member.user_id }}</span>
                    </div>
                    <div v-if="auth.userId == member.user_id || auth.isAdmin" class="flex items-center text-gray-600">
                      <i class="fas fa-envelope w-5 text-purple-500"></i>
                      <span class="ml-2">{{ member.email || 'ইমেইল নেই' }}</span>
                    </div>
                    <div v-if="auth.userId == member.user_id || auth.isAdmin" class="flex items-center text-gray-600">
                      <i class="fas fa-phone w-5 text-purple-500"></i>
                      <span class="ml-2">{{ member.phone_number || 'ফোন নেই' }}</span>
                    </div>
                    <div class="flex items-center text-gray-600">
                      <i class="fas fa-briefcase w-5 text-purple-500"></i>
                      <span class="ml-2">{{ member.occupation || 'পেশা নেই' }}</span>
                    </div>
                  </div>

                  <!-- Additional Info (Collapsible for mobile) -->
                  <div class="mt-2 text-sm text-gray-500">
                    <details class="cursor-pointer">
                      <summary class="text-purple-600 hover:text-purple-700">
                        <i class="fas fa-info-circle mr-1"></i> আরও তথ্য
                      </summary>
                      <div class="mt-2 space-y-1 pl-4">
                        <p><span class="font-medium">পিতার নাম:</span> {{ member.father_name || 'N/A' }}</p>
                        <p><span class="font-medium">মাতার নাম:</span> {{ member.mother_name || 'N/A' }}</p>
                        <p><span class="font-medium">শিক্ষাগত যোগ্যতা:</span> {{ member.educational_qualification ||
                          'N/A' }}</p>
                        <p><span class="font-medium">ঠিকানা:</span> {{ member.permanent_address || 'N/A' }}</p>
                      </div>
                    </details>
                  </div>
                </div>

                <div v-else> সদস্যকে মুছে ফেলা হয়েছে । {{ member.status }} </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex space-x-2 justify-end">
              <NuxtLink v-if="auth.isAdmin || auth.userId == member.user_id" :to="`/users/${member.user_id}`"
                class="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg p-2 hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-purple-300 transform hover:scale-105 transition-all duration-200 shadow-lg inline-flex items-center justify-center"
                title="বিস্তারিত দেখুন">
                <i class="fas fa-eye"></i>
              </NuxtLink>

              <!-- <NuxtLink 
                v-if="auth.isAdmin" 
                :to="`/users/${member[USER_INDEX.user_id_display]}`" 
                class="bg-blue-500 text-white rounded-lg p-2 hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transform hover:scale-105 transition-all duration-200 shadow-lg inline-flex items-center justify-center"
                title="এডিট করুন"
              >
                <i class="fas fa-edit"></i>
              </NuxtLink> -->

              <button v-if="auth.isAdmin && member.role !== 'admin'" @click="deleteMember(member.user_id)"
                class="bg-red-500 text-white rounded-lg p-2 hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-300 transform hover:scale-105 transition-all duration-200 shadow-lg inline-flex items-center justify-center"
                title="ডিলিট করুন">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination (if needed) -->
      <div v-if="filteredMembers.length > 10" class="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <div class="flex justify-between items-center">
          <p class="text-sm text-gray-700">
            দেখানো হচ্ছে <span class="font-medium">1</span> থেকে <span class="font-medium">{{ filteredMembers.length
              }}</span>
            (মোট <span class="font-medium">{{ stats.total }}</span>)
          </p>
          <div class="flex gap-2">
            <button class="px-3 py-1 border rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50" disabled>
              আগের
            </button>
            <button class="px-3 py-1 border rounded-lg text-sm hover:bg-gray-100">
              পরের
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
details summary::-webkit-details-marker {
  display: none;
}

details summary {
  list-style: none;
  display: inline-flex;
  align-items: center;
}
</style>