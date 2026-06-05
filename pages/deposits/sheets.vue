<script setup>
import Input from '~/components/Input.vue'

const auth = useAuthStore();
const data = useDataStore()

if (!auth.isAuthenticated) {
  await navigateTo('/login')
}

const isFilterModalOpen = ref(false)
const isLoading = ref(true)
const error = ref(null)
                                                                          
const deposits = ref([]);
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

// Index mapping based on your API response
const INDEX = {
  user_id: 0,
  session: 1,
  amount: 2,
  type: 3,
  month: 4,
  method: 5,
  pay_to: 6,
  send_from: 7,
  date: 10
}

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


// Map filter keys to their index positions
const filterKeyToIndex = {
  user_id: INDEX.user_id,
  session: INDEX.session,
  month: INDEX.month,
  type: INDEX.type,
  method: INDEX.method,
  pay_to: INDEX.pay_to,
  send_from: INDEX.send_from,
  date: INDEX.date
}

// Computed filtered deposits
const filteredDeposits = computed(() => {
  if (!deposits.value.length) return []
  
  return deposits.value.filter(deposit => {
    // Check each active filter
    for (const [filterKey, filterConfig] of Object.entries(filters)) {
      // Skip if no items selected or filter not active
      if (!filterConfig.active || filterConfig.selected.length === 0) continue
      
      const fieldIndex = filterKeyToIndex[filterKey]
      const depositValue = deposit[fieldIndex]
      
      // If deposit value doesn't exist in selected options, filter it out
      if (!filterConfig.selected.includes(depositValue)) {
        return false
      }
    }
    return true
  })
})

// Get unique options for each filter from the data
const updateFilterOptions = () => {
  Object.keys(filters).forEach(filterKey => {
    const fieldIndex = filterKeyToIndex[filterKey]
    const uniqueValues = [...new Set(
      deposits.value
        .map(d => d[fieldIndex])
        .filter(v => v !== null && v !== undefined && v !== '' && v !== 'undefined')
        .sort()
    )]
    filters[filterKey].options = uniqueValues
  })
}

const toggleSelection = (key, value) => {
  const currentSelected = filters[key].selected
  const index = currentSelected.indexOf(value)
  if (index > -1) {
    filters[key].selected = currentSelected.filter(v => v !== value)
  } else {
    filters[key].selected = [...currentSelected, value]
  }
  // Update active status
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

const fetchDeposits = async () => {
  auth.isLoading = true;
  isLoading.value = true
  error.value = null
  
  try {
    deposits.value = useDepositsStore().all
    
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
  editing.value = deposit[INDEX.user_id]
  Object.assign(form, {
    user_id: deposit[INDEX.user_id],
    session: deposit[INDEX.session],
    amount: deposit[INDEX.amount],
    month: deposit[INDEX.month],
    type: deposit[INDEX.type],
    method: deposit[INDEX.method],
    pay_to: deposit[INDEX.pay_to] || '',
    send_from: deposit[INDEX.send_from] || '',
    date: deposit[INDEX.date] || ''
  })
}

const updateDeposit = async () => {
  try {
    await $fetch(`/api/sheets/deposits/${editing.value}`, {
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
    await $fetch(`/api/sheets/deposits/${userId}`, {
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
    const amount = parseFloat(deposit[INDEX.amount])
    return sum + (isNaN(amount) ? 0 : amount)
  }, 0)
})

const stats = computed(() => {
  const byType = {}
  const byMethod = {}
  const bySession = {}
  
  deposits.value.forEach(deposit => {
    const amount = parseFloat(deposit[INDEX.amount]) || 0
    const type = deposit[INDEX.type]
    const method = deposit[INDEX.method]
    const session = deposit[INDEX.session]
    
    byType[type] = (byType[type] || 0) + amount
    byMethod[method] = (byMethod[method] || 0) + amount
    bySession[session] = (bySession[session] || 0) + amount
  })
  
  return { byType, byMethod, bySession }
})

onMounted(() => {
  fetchDeposits()
  if(!auth.isAdmin)
  {
    filters.user_id.selected = auth.userId;
    filters.user_id.active = true;
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white bg-opacity-90 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
      <div class="flex justify-between items-center mb-4">
        <div>
          <h1 class="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            আমানত
          </h1>
          <p class="text-sm text-gray-500 mt-1">Connected to Google Sheets</p>
        </div>
        <button 
          @click="fetchDeposits" 
          class="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl py-3 px-6 hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transform hover:scale-105 transition-all duration-200 font-semibold shadow-lg"
        >
          <i class="fas fa-sync-alt mr-2"></i>
        </button>
      </div>
      
      <!-- Filter Bar -->
      <div v-if='auth.isAdmin' class=" flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-200">
        <div class="flex items-center justify-between gap-3">
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
            <i class="fas fa-times-circle mr-1"></i> Clear Filters
          </button>
        </div>
        
        <!-- Active Filters Display - FIXED: Changed 'filter' to 'filterConfig' -->
        <div class="text-sm text-gray-500">
          Showing {{ filteredDeposits.length }} of {{ deposits.length }} records
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <DepositOverview :deposits />

    <!-- Loading State -->

    <!-- Data Table -->
   <!--  <div v-else-if="deposits.length > 0" class="bg-white bg-opacity-90 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
      <div class="overflow-x-auto">
        <table class="min-w-full table-auto bordered">
          <thead>
            <tr class="bg-gray-50">
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UID</th>
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
            <tr v-for="(deposit, index) in filteredDeposits"  class="hover:bg-gray-50">
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ index + 1 }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ deposit[INDEX.user_id] }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                <span class="px-2 py-1 rounded-full text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-800': deposit[INDEX.type] === 'Monthly',
                    'bg-blue-100 text-blue-800': deposit[INDEX.type] === 'Yearly',
                    'bg-purple-100 text-purple-800': deposit[INDEX.type] === 'Maintainanc'
                  }"
                >
                  {{ deposit[INDEX.type] }}
                </span>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm font-semibold text-green-600">৳{{ parseFloat(deposit[INDEX.amount]).toLocaleString() }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ deposit[INDEX.session] }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ deposit[INDEX.month] }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ deposit[INDEX.method] }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ deposit[INDEX.pay_to] || '-' }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ deposit[INDEX.send_from] || '-' }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{{ deposit[INDEX.date] || '-' }}</td>
              <td v-if="auth.isAdmin" class="px-4 py-3 whitespace-nowrap text-sm font-medium">
                <button @click="editDeposit(deposit)" class="text-indigo-600 hover:text-indigo-900 mr-3">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button @click="deleteDeposit(deposit[INDEX.user_id])" class="text-red-600 hover:text-red-900">
                  <i class="fas fa-trash"></i> Delete
                </button>
              </td>
            </tr>
            <tr v-if="filteredDeposits.length === 0">
              <td :colspan="auth.isAdmin ? 11 : 10" class="text-center py-8 text-gray-500">
                No matching records found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div> -->

    <!-- Empty State -->
    <!-- <div v-else class="bg-white bg-opacity-90 backdrop-blur-md rounded-2xl p-12 shadow-2xl text-center">
      <i class="fas fa-table text-6xl text-gray-300 mb-4"></i>
      <p class="text-gray-500 text-lg">No data found in Google Sheets.</p>
      <p class="text-gray-400 text-sm mt-2">Please check your Google Sheet configuration.</p>
    </div> -->
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
      
      <div class="max-h-96 overflow-y-auto" style="display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gaps:10">

        <!-- FIXED: Changed 'filter' to 'filterConfig' and 'key' to 'filterKey' -->

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
                {{ deposits.filter(d => d[filterKeyToIndex[filterKey]] === option).length }}
              </span>
            </div>
            
            <div v-if="filterConfig.options.filter(opt => !filterConfig.search || String(opt).toLowerCase().includes(filterConfig.search.toLowerCase())).length === 0" 
                 class="text-center py-4 text-gray-500">
              No matching options
            </div>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end gap-3 pt-2">
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