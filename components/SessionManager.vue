<script setup>
const sessions = ref([])
const isLoading = ref(false)
const showModal = ref(false)
const editingSession = ref(null)

const form = reactive({
  sessionName: '',
  monthlyDeposit: '',
  yearlyDeposit: '',
  totalDeposit: ''
})

// Fetch all sessions - Updated path
const fetchSessions = async () => {
 sessions.value = useSessionsStore().session;
 console.log(sessions.value);
}

// Create new session - Updated path
const createSession = async () => {
  if (!form.sessionName || !form.monthlyDeposit || !form.yearlyDeposit) {
    alert('Please fill all required fields')
    return
  }
  
  isLoading.value = true
  try {
    // For POST request to api/session/session.post.ts
    await $fetch('/api/crud/Sessions', {
      method: 'POST',
      body: {
        sessionName: form.sessionName,
        monthlyDeposit: parseFloat(form.monthlyDeposit),
        yearlyDeposit: parseFloat(form.yearlyDeposit),
        totalDeposit: parseFloat(form.totalDeposit) || 0
      }
    })
    
    resetForm()
    await fetchSessions()
    showModal.value = false
  } catch (error) {
    console.error('Error creating session:', error)
  } finally {
    isLoading.value = false
  }
}

// Update session - Updated path
const updateSession = async () => {
  if (!editingSession.value) return
  
  isLoading.value = true
  try {
    // For PUT request to api/session/session/[id].put.ts
    await $fetch(`/api/crud/Sessions?id=${editingSession.value.id}`, {
      method: 'PUT',
      body: {
        sessionName: form.sessionName,
        monthlyDeposit: parseFloat(form.monthlyDeposit),
        yearlyDeposit: parseFloat(form.yearlyDeposit),
        totalDeposit: parseFloat(form.totalDeposit) || 0
      }
    })
    
    resetForm()
    await fetchSessions()
    showModal.value = false
    editingSession.value = null
  } catch (error) {
    console.error('Error updating session:', error)
  } finally {
    isLoading.value = false
  }
}

// Delete session - Updated path
const deleteSession = async (id, sessionName) => {
  if (!confirm(`Are you sure you want to delete session "${sessionName}"?`)) return
  
  isLoading.value = true
  try {
    // For DELETE request to api/session/session/[id].delete.ts
    await $fetch(`/api/crud/Sessions?id=${id}`, {
      method: 'DELETE'
    })
    await fetchSessions()
  } catch (error) {
    console.error('Error deleting session:', error)
  } finally {
    isLoading.value = false
  }
}

// Edit session
const editSession = (session) => {
  editingSession.value = session
  form.sessionName = session.sessionName
  form.monthlyDeposit = session.monthlyDeposit
  form.yearlyDeposit = session.yearlyDeposit
  form.totalDeposit = session.totalDeposit
  showModal.value = true
}

// Reset form
const resetForm = () => {
  form.sessionName = ''
  form.monthlyDeposit = ''
  form.yearlyDeposit = ''
  form.totalDeposit = ''
}

// Open create modal
const openCreateModal = () => {
  editingSession.value = null
  resetForm()
  showModal.value = true
}

onMounted(() => {
  fetchSessions()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-bold text-gray-800">সেশন ম্যানেজমেন্ট</h2>
      <button 
        @click="openCreateModal"
        class="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all"
      >
        <i class="fas fa-plus mr-2"></i> নতুন সেশন
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-purple-500 mx-auto"></div>
      <p class="mt-4 text-gray-500">লোড হচ্ছে...</p>
    </div>

    <!-- Sessions Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="session in sessions" 
        :key="session.id"
        class="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all"
      >
        <div class="bg-gradient-to-r from-purple-500 to-pink-500 p-4 flex items-center justify-between">
          <h3 class="text-xl font-bold text-white">{{ session.sessionName }}</h3>
          <NuxtLink :to="`/session/${session.sessionName}`"> Details </NuxtLink>
        </div>
        
        <div class="p-4 space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-gray-600">মাসিক জমা:</span>
            <span class="text-lg font-semibold text-green-600">৳{{ session.monthlyDeposit.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">বার্ষিক জমা:</span>
            <span class="text-lg font-semibold text-blue-600">৳{{ session.yearlyDeposit.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-gray-600">মোট জমা:</span>
            <span class="text-lg font-semibold text-purple-600">৳{{ session.totalDeposit.toLocaleString() }}</span>
          </div>
          <div class="flex justify-between items-center pt-3 border-t">
            <button 
              @click="editSession(session)"
              class="text-blue-600 hover:text-blue-800"
            >
              <i class="fas fa-edit mr-1"></i> এডিট
            </button>
            <button 
              @click="deleteSession(session.id, session.sessionName)"
              class="text-red-600 hover:text-red-800"
            >
              <i class="fas fa-trash mr-1"></i> ডিলিট
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && sessions.length === 0" class="text-center py-12 bg-white rounded-2xl">
      <i class="fas fa-calendar-alt text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-500 text-lg">কোনো সেশন পাওয়া যায়নি</p>
      <button 
        @click="openCreateModal"
        class="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-xl"
      >
        প্রথম সেশন তৈরি করুন
      </button>
    </div>

    <!-- Modal for Create/Edit -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl max-w-md w-full p-6">
        <h3 class="text-2xl font-bold mb-4">
          {{ editingSession ? 'সেশন এডিট করুন' : 'নতুন সেশন তৈরি করুন' }}
        </h3>
        
        <form @submit.prevent="editingSession ? updateSession() : createSession()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">সেশনের নাম *</label>
            <input 
              v-model="form.sessionName"
              type="text"
              required
              placeholder="যেমন: ২০২৪-২৫"
              class="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">মাসিক জমার পরিমাণ *</label>
            <input 
              v-model.number="form.monthlyDeposit"
              type="number"
              required
              placeholder="০"
              class="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">বার্ষিক জমার পরিমাণ *</label>
            <input 
              v-model.number="form.yearlyDeposit"
              type="number"
              required
              placeholder="০"
              class="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">মোট জমার পরিমাণ</label>
            <input 
              v-model.number="form.totalDeposit"
              type="number"
              placeholder="০"
              class="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div class="flex gap-3 pt-4">
            <button 
              type="submit"
              class="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-xl hover:shadow-lg transition-all"
            >
              {{ editingSession ? 'আপডেট করুন' : 'তৈরি করুন' }}
            </button>
            <button 
              type="button"
              @click="showModal = false"
              class="flex-1 bg-gray-300 text-gray-700 py-2 rounded-xl hover:bg-gray-400 transition-all"
            >
              বাতিল করুন
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>