<script setup>
import Input from '~/components/Input.vue'

const auth = useAuthStore();
const data = useDataStore()

if (!auth.isAuthenticated) {
  await navigateTo('/login')
}


definePageMeta({
  layout:false,  
})

const isFilterModalOpen = ref(false)
const isLoading = ref(true)
const error = ref(null)

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(20)
const itemsPerPageOptions = [20, 25, 50, 100, 250]

// Pagination computed properties
const totalPages = computed(() => {
  return Math.ceil(filteredDeposits.value.length / itemsPerPage.value)
})

const paginatedDeposits = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredDeposits.value.slice(start, end)
})

const showingRange = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value + 1
  const end = Math.min(start + itemsPerPage.value - 1, filteredDeposits.value.length)
  return { start, end }
})

// Generate page numbers for pagination display
const pageNumbers = computed(() => {
  const pages = []
  const maxVisible = 5
  let startPage = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let endPage = Math.min(totalPages.value, startPage + maxVisible - 1)
  
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }
  
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }
  
  return pages
})

const deposits = ref([])
const editing = ref(null)
const form = reactive({                                                                         
  user_id: '',
  session: '',
  amount: '',
  month: '',
  type: '',
  method: '',
  pay_to: '',
  send_from: '',
  date: ''
})

// Unified filter configuration
const filters = reactive({
  user_id: { selected: [], options: [], search: '', active: false },
  session: { selected: [], options: [], search: '', active: false },
  month: { selected: [], options: [], search: '', active: false },
  type: { selected: [], options: [], search: '', active: false },
  method: { selected: [], options: [], search: '', active: false },
  pay_to: { selected: [], options: [], search: '', active: false },
  send_from: { selected: [], options: [], search: '', active: false },
  date: { selected: [], options: [], search: '', active: false }
})

// Computed filtered deposits
const filteredDeposits = computed(() => {
  if (!deposits.value.length) return []
  
  let filtered = deposits.value
  
  // Apply filters
  for (const [filterKey, filterConfig] of Object.entries(filters)) {
    if (filterConfig.active && filterConfig.selected.length > 0) {
      filtered = filtered.filter(deposit => {
        const depositValue = deposit[filterKey]
        return filterConfig.selected.includes(depositValue)
      })
    }
  }
  
  return filtered
})

// Get unique options for each filter from the data
const updateFilterOptions = () => {
  Object.keys(filters).forEach(filterKey => {
    const uniqueValues = [...new Set(
      deposits.value
        .map(d => d[filterKey])
        .filter(v => v !== null && v !== undefined && v !== '' && v !== 'undefined')
        .sort()
    )]
    filters[filterKey].options = uniqueValues
  })
}

// Reset to first page when filters change
watch([filteredDeposits, itemsPerPage], () => {
  currentPage.value = 1
})

const toggleSelection = (key, value) => {
  const currentSelected = filters[key].selected
  const index = currentSelected.indexOf(value)
  if (index > -1) {
    filters[key].selected = currentSelected.filter(v => v !== value)
  } else {
    filters[key].selected = [...currentSelected, value]
  }
  filters[key].active = filters[key].selected.length > 0
}

const selectAll = (key) => {
  filters[key].selected = [...filters[key].options]
  filters[key].active = filters[key].selected.length > 0
}

const clearAll = (key) => {
  filters[key].selected = []
  filters[key].active = false
  filters[key].search = ''
}

const clearAllFilters = () => {
  Object.keys(filters).forEach(key => {
    filters[key].selected = []
    filters[key].active = false
    filters[key].search = ''
  })
}

const activeFiltersCount = computed(() => {
  return Object.values(filters).filter(f => f.active && f.selected.length > 0).length
})

// Pagination methods
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const changeItemsPerPage = (value) => {
  itemsPerPage.value = value
  currentPage.value = 1
}

const fetchDeposits = async () => {
  auth.isLoading = true;
  isLoading.value = true
  error.value = null
  
  try {
    const response = await $fetch('/api/crud/Transactions')
    deposits.value = response
    
    // Populate filter options
    updateFilterOptions()
  } catch (err) {
    error.value = err.message || 'Failed to fetch data from Google Sheets'
    console.error('Error fetching deposits:', err)
  } finally {
    isLoading.value = false
    auth.isLoading = false
  }
}

const editDeposit = (deposit) => {
  editing.value = deposit.user_id
  Object.assign(form, {
    user_id: deposit.user_id,
    session: deposit.session,
    amount: deposit.amount,
    month: deposit.month,
    type: deposit.type,
    method: deposit.method,
    pay_to: deposit.pay_to || '',
    send_from: deposit.send_from || '',
    date: deposit.date || ''
  })
}

const updateDeposit = async () => {
  try {
    await $fetch(`/api/crud/Transactions?id=${editing.value}`, {
      method: 'PUT',
      body: form
    })
    editing.value = null
    resetForm()
    await fetchDeposits()
  } catch (err) {
    error.value = err.message || 'Failed to update deposit'
  }
}

const deleteDeposit = async (userId) => {
  if (!confirm('Are you sure you want to delete this deposit?')) return
  
  try {
    await $fetch(`/api/crud/Transactions?id=${userId}`, {
      method: 'DELETE'
    })
    await fetchDeposits()
  } catch (err) {
    error.value = err.message || 'Failed to delete deposit'
  }
}

const resetForm = () => {
  form.user_id = ''
  form.session = ''
  form.amount = ''
  form.month = ''
  form.type = ''
  form.method = ''
  form.pay_to = ''
  form.send_from = ''
  form.date = ''
}

const totalDepositAmount = computed(() => {
  return filteredDeposits.value.reduce((sum, deposit) => {
    const amount = parseFloat(deposit.amount)
    return sum + (isNaN(amount) ? 0 : amount)
  }, 0)
})

const stats = computed(() => {
  const byType = {}
  const byMethod = {}
  const bySession = {}
  
  deposits.value.forEach(deposit => {
    const amount = parseFloat(deposit.amount) || 0
    const type = deposit.type
    const method = deposit.method
    const session = deposit.session
    
    byType[type] = (byType[type] || 0) + amount
    byMethod[method] = (byMethod[method] || 0) + amount
    bySession[session] = (bySession[session] || 0) + amount
  })
  
  return { byType, byMethod, bySession }
})

onMounted(() => {
  fetchDeposits()
  if(!auth.isAdmin) {
    filters.user_id.selected = [auth.userId]
    filters.user_id.active = true
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="print:hidden bg-white bg-opacity-90 backdrop-blur-md rounded-2xl p-6 ">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            আমানত
          </h1>
          <p class="text-sm text-gray-500 mt-1">Connected to Google Sheets</p>
        </div>
        
        <div class="flex items-center justify-between gap-3">
          <NuxtLink to="/deposits/add"
          class="bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl py-3 px-6 hover:from-purple-600 hover:to-indigo-600 focus:outline-none focus:ring-4 focus:ring-purple-300 transform hover:scale-105 transition-all duration-200 font-semibold shadow-lg"
          >
            <i class="fas fa-plus mr-2"></i>
          </NuxtLink>
          <button 
            @click="fetchDeposits" 
            class="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl py-3 px-6 hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transform hover:scale-105 transition-all duration-200 font-semibold shadow-lg"
          >
            <i class="fas fa-sync-alt mr-2"></i>
          </button>
        </div>
      </div>
      
      <!-- Filter Bar -->
      <div class="md:hidden flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
        <div class="flex items-center gap-3">
          <button 
            @click="isFilterModalOpen = true" 
            class="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl py-2.5 px-5 hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-purple-300 transform hover:scale-105 transition-all duration-200 font-semibold shadow-lg flex items-center gap-2"
          >
            <i class="fas fa-filter"></i>
            Filters
            <span v-if="activeFiltersCount > 0" class="bg-white text-purple-600 rounded-full px-2 py-0.5 text-xs font-bold ml-1">
              {{ activeFiltersCount }}
            </span>
          </button>
          
          <button 
            v-if="activeFiltersCount > 0" 
            @click="clearAllFilters" 
            class="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-2 rounded-lg hover:bg-red-50 transition-all duration-200"
          >
            <i class="fas fa-times-circle mr-1"></i> Clear All Filters
          </button>
        </div>
        
        <div class="text-sm text-gray-500">
          Showing {{ showingRange.start }} - {{ showingRange.end }} of {{ filteredDeposits.length }} records
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <DepositOverview :deposits class="print:hidden" />

    <!-- Error Message -->
    <div v-if="error" class="print:hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl">
      <p>{{ error }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="print:hidden bg-white bg-opacity-90 backdrop-blur-md rounded-2xl p-12 text-center">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-500 mx-auto"></div>
      <p class="mt-4 text-gray-500">Loading data from Google Sheets...</p>
    </div>

    <!-- Data Table -->
    <div v-else-if="deposits.length > 0" class="bg-white bg-opacity-90 backdrop-blur-md p-6">

      <div class="flex ">

        <!-- left filter asside  -->
        <div class="min-w-\[250px\] mr-4 hidden md:block print:hidden">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900">Filter Deposits</h3>
            <button 
              @click="clearAllFilters" 
              class="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Clear
            </button>
          </div>
          
          <div class="overflow-y-auto" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px;">
            <div v-for="(filterConfig, filterKey) in filters" :key="filterKey" class="border rounded-lg p-4">
              <div class=" mb-3">
                <label class="text-lg font-semibold capitalize text-gray-800">{{ filterKey.replace('_', ' ') }}</label>
                <div class="flex justify-between items-center gap-2">
                  <button @click="selectAll(filterKey)" class="text-blue-600 hover:text-blue-800 text-sm">Select All</button>
                  <button @click="clearAll(filterKey)" class="text-red-600 hover:text-red-800 text-sm">Clear</button>
                </div>
              </div>
              
              <input 
                v-model="filterConfig.search" 
                type="text" 
                placeholder="Search..."
                class="w-full p-2 mb-3 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              
              <div class="flex items-center justify-between mb-2 text-sm text-gray-600">
                <span>{{ filterConfig.selected.length }} selected</span>
                <span>{{ filterConfig.options.length }} total</span>
              </div>
              
              <div class="space-y-2 max-h-48 overflow-y-auto">
                <div 
                  v-for="option in filterConfig.options.filter(opt => 
                    !filterConfig.search || 
                    String(opt).toLowerCase().includes(filterConfig.search.toLowerCase())
                  )" 
                  :key="option" 
                  class="flex items-center p-2 hover:bg-gray-50 rounded"
                >
                  <input
                    :id="`${filterKey}-${option}`"
                    type="checkbox"
                    :checked="filterConfig.selected.includes(option)"
                    @change="toggleSelection(filterKey, option)"
                    class="w-4 h-4 mr-3 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <label :for="`${filterKey}-${option}`" class="text-sm text-gray-700 cursor-pointer flex-1">
                    {{ option }}
                  </label>
                  <span class="text-xs text-gray-400">
                    {{ deposits.filter(d => d[filterKey] === option).length }}
                  </span>
                </div>
                
                <div v-if="filterConfig.options.filter(opt => !filterConfig.search || String(opt).toLowerCase().includes(filterConfig.search.toLowerCase())).length === 0" 
                     class="text-center py-4 text-gray-500">
                  No matching options
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end gap-3 pt-2 mt-4">
            <button 
              @click="isFilterModalOpen = false" 
              class="bg-gray-500 text-white rounded-xl py-2.5 px-6 hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all duration-200 font-semibold"
            >
              Close
            </button>
            <button 
              @click="isFilterModalOpen = false" 
              class="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl py-2.5 px-6 hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-purple-300 transition-all duration-200 font-semibold"
            >
              Apply Filters
            </button>
          </div>
        </div>

        <!-- sheet table  -->
        <div class="overflow-x-auto w-full">
          <table class="min-w-full table-auto bordered">
            <thead>
              <tr class="bg-gray-50">
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay To</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Send From</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th v-if="auth.isAdmin" class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="(deposit, index) in paginatedDeposits" :key="deposit.user_id + index" class="hover:bg-gray-50">
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ deposit.user_id }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  <span class="px-2 py-1 rounded-full text-xs font-medium"
                    :class="{
                      'bg-green-100 text-green-800': deposit.type === 'Monthly',
                      'bg-blue-100 text-blue-800': deposit.type === 'Yearly',
                      'bg-purple-100 text-purple-800': deposit.type === 'Maintainanc'
                    }"
                  >
                    {{ deposit.type }}
                  </span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">৳{{ parseFloat(deposit.amount).toLocaleString() }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ deposit.session }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ deposit.month }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ deposit.method }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ deposit.pay_to || '-' }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ deposit.send_from || '-' }}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ deposit.date || '-' }}</td>
                <td v-if="auth.isAdmin" class="px-4 py-3 whitespace-nowrap text-sm font-medium">
                  <button @click="editDeposit(deposit)" class="text-indigo-600 hover:text-indigo-900 mr-3">
                    <i class="fas fa-edit"></i> Edit
                  </button>
                  <button @click="deleteDeposit(deposit.user_id)" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                </td>
              </tr>
              <tr v-if="paginatedDeposits.length === 0">
                <td :colspan="auth.isAdmin ? 11 : 10" class="text-center py-8 text-gray-500">
                  No matching records found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      
      <!-- Pagination Controls -->
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-200">
        <!-- Items per page selector -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-600">Show:</span>
          <select 
            v-model="itemsPerPage"
            @change="changeItemsPerPage($event.target.value)"
            class="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option v-for="option in itemsPerPageOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
          <span class="text-sm text-gray-600">entries</span>
        </div>
        
        <!-- Pagination buttons -->
        <div class="flex items-center gap-2">
          <!-- First page -->
          <button 
            @click="goToPage(1)"
            :disabled="currentPage === 1"
            class="px-3 py-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            :class="currentPage === 1 ? 'text-gray-400' : 'text-gray-700 hover:border-purple-300'"
          >
            <i class="fas fa-angle-double-left"></i>
          </button>
          
          <!-- Previous page -->
          <button 
            @click="prevPage"
            :disabled="currentPage === 1"
            class="px-3 py-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            :class="currentPage === 1 ? 'text-gray-400' : 'text-gray-700 hover:border-purple-300'"
          >
            <i class="fas fa-angle-left"></i>
          </button>
          
          <!-- Page numbers -->
          <div class="flex gap-1">
            <button
              v-for="page in pageNumbers"
              :key="page"
              @click="goToPage(page)"
              class="px-3 py-1.5 rounded-lg transition-all"
              :class="currentPage === page 
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
                : 'border text-gray-700 hover:bg-gray-50'"
            >
              {{ page }}
            </button>
          </div>
          
          <!-- Next page -->
          <button 
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="px-3 py-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            :class="currentPage === totalPages ? 'text-gray-400' : 'text-gray-700 hover:border-purple-300'"
          >
            <i class="fas fa-angle-right"></i>
          </button>
          
          <!-- Last page -->
          <button 
            @click="goToPage(totalPages)"
            :disabled="currentPage === totalPages"
            class="px-3 py-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            :class="currentPage === totalPages ? 'text-gray-400' : 'text-gray-700 hover:border-purple-300'"
          >
            <i class="fas fa-angle-double-right"></i>
          </button>
        </div>
        
        <!-- Info text -->
        <div class="text-sm text-gray-500">
          Page {{ currentPage }} of {{ totalPages || 1 }}
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="bg-white bg-opacity-90 backdrop-blur-md rounded-2xl p-12 shadow-2xl text-center">
      <i class="fas fa-table text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-500 text-lg">No data found in Google Sheets.</p>
      <p class="text-gray-400 text-sm mt-2">Please check your Google Sheet configuration.</p>
    </div>
  </div>

  <!-- Unified Filter Modal -->
  <Modal :isOpen="isFilterModalOpen" @close="isFilterModalOpen = false">
    <div class="">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-gray-900">Filter Deposits</h3>
        <button 
          @click="clearAllFilters" 
          class="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Clear All Filters
        </button>
      </div>
      
      <div class="max-h-96 overflow-y-auto" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px;">
        <div v-for="(filterConfig, filterKey) in filters" :key="filterKey" class="border rounded-lg p-4">
          <div class="flex items-center justify-between mb-3">
            <label class="text-lg font-semibold capitalize text-gray-800">{{ filterKey.replace('_', ' ') }}</label>
            <div class="flex items-center gap-2">
              <button @click="selectAll(filterKey)" class="text-blue-600 hover:text-blue-800 text-sm">Select All</button>
              <button @click="clearAll(filterKey)" class="text-red-600 hover:text-red-800 text-sm">Clear</button>
            </div>
          </div>
          
          <input 
            v-model="filterConfig.search" 
            type="text" 
            placeholder="Search..."
            class="w-full p-2 mb-3 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          
          <div class="flex items-center justify-between mb-2 text-sm text-gray-600">
            <span>{{ filterConfig.selected.length }} selected</span>
            <span>{{ filterConfig.options.length }} total</span>
          </div>
          
          <div class="space-y-2 max-h-48 overflow-y-auto">
            <div 
              v-for="option in filterConfig.options.filter(opt => 
                !filterConfig.search || 
                String(opt).toLowerCase().includes(filterConfig.search.toLowerCase())
              )" 
              :key="option" 
              class="flex items-center p-2 hover:bg-gray-50 rounded"
            >
              <input
                :id="`${filterKey}-${option}`"
                type="checkbox"
                :checked="filterConfig.selected.includes(option)"
                @change="toggleSelection(filterKey, option)"
                class="w-4 h-4 mr-3 text-purple-600 rounded focus:ring-purple-500"
              />
              <label :for="`${filterKey}-${option}`" class="text-sm text-gray-700 cursor-pointer flex-1">
                {{ option }}
              </label>
              <span class="text-xs text-gray-400">
                {{ deposits.filter(d => d[filterKey] === option).length }}
              </span>
            </div>
            
            <div v-if="filterConfig.options.filter(opt => !filterConfig.search || String(opt).toLowerCase().includes(filterConfig.search.toLowerCase())).length === 0" 
                 class="text-center py-4 text-gray-500">
              No matching options
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end gap-3 pt-2 mt-4">
        <button 
          @click="isFilterModalOpen = false" 
          class="bg-gray-500 text-white rounded-xl py-2.5 px-6 hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all duration-200 font-semibold"
        >
          Close
        </button>
        <button 
          @click="isFilterModalOpen = false" 
          class="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl py-2.5 px-6 hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-purple-300 transition-all duration-200 font-semibold"
        >
          Apply Filters
        </button>
      </div>
    </div>
  </Modal>

  <!-- Edit Form Modal -->
  <div v-if="editing" class="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full" @click="editing = null">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-2xl bg-white" @click.stop>
      <div class="mt-3">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Edit Deposit</h3>
        <form @submit.prevent="updateDeposit" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input v-model="form.type" placeholder="Type" required class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-green-300 focus:border-green-500 transition-all duration-200" />
            <input v-model.number="form.amount" placeholder="Amount" required type="number" class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-green-300 focus:border-green-500 transition-all duration-200" />
            <input v-model="form.session" placeholder="Session" required class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-green-300 focus:border-green-500 transition-all duration-200" />
            <input v-model="form.month" placeholder="Month" required class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-green-300 focus:border-green-500 transition-all duration-200" />
            <input v-model="form.method" placeholder="Method" required class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-green-300 focus:border-green-500 transition-all duration-200" />
            <input v-model="form.pay_to" placeholder="Pay To" class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-green-300 focus:border-green-500 transition-all duration-200" />
            <input v-model="form.send_from" placeholder="Send From Number" class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-green-300 focus:border-green-500 transition-all duration-200" />
            <input v-model="form.date" placeholder="Date" class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-green-300 focus:border-green-500 transition-all duration-200" />
          </div>
          <div class="flex space-x-4">
            <button type="submit" class="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl py-3 px-6 hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-4 focus:ring-green-300 transform hover:scale-105 transition-all duration-200 font-semibold shadow-lg">
              Update
            </button>
            <button type="button" @click="editing = null; resetForm()" class="bg-gray-500 text-white rounded-xl py-3 px-6 hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300 transform hover:scale-105 transition-all duration-200 font-semibold shadow-lg">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>