<script setup>
const auth = useAuthStore()
const data = useDataStore()


if (!auth.isAuthenticated) {
  await navigateTo('/login')
}

const deposits = ref([])
const editing = ref(null)
const users = ref([])
const form = reactive({
  user_id: '',
  amount: 0,
  type: '',
  session: '',
  month: '',
  method: '',
  pay_to: '',
  send_from: '',
  send_to: '',
  date: '',
  trx_id: ''
})

const fetchDeposits = async () => {
  deposits.value = useDepositsStore().all;
}

const fetchUsers = async () => {
  users.value = useUsersStore().user;
}

const addDeposit = async () => {
  await $fetch('/api/crud/Transactions', {
    method: 'POST',
    body: { ...form, created_at: new Date().toISOString() }
  })
  navigateTo('/deposits')
}

const editDeposit = (deposit) => {
  editing.value = deposit.id
  Object.assign(form, deposit)
}

const updateDeposit = async () => {
  await $fetch(`/api/crud/Transactions?id=${editing.value}`, {
    method: 'PUT',
    body: form
  })
  editing.value = null
  resetForm()
  await useDepositsStore().fetchDeposits()
}

const deleteDeposit = async (id) => {
  await $fetch(`/api/crud/Transactions?id=${id}`, {
    method: 'DELETE',
  })
  await useDepositsStore().fetchDeposits()
}

const resetForm = () => {
  form.user_id = ''
  form.amount = 0
  form.type = ''
  form.session = ''
  form.month = ''
  form.method = ''
  form.pay_to = ''
  form.send_from = ''
  form.send_to = ''
  form.date = ''
  form.trx_id = ''
}

onMounted(async () => {
  await fetchDeposits()
  await fetchUsers()
})
</script>

<template>
  <div class="bg-white bg-opacity-90 backdrop-blur-md rounded-2xl p-6 shadow-2xl">
    <h1 class="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">আমানত যুক্ত করুন</h1>
    <form @submit.prevent="addDeposit()" class="space-y-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <select v-model="form.user_id" required class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200">
          <option value="">Select Member</option>
          <option v-for="user in users" :key="user.id" :value="user.user_id">
             {{ user.user_id }} - {{ user.name_english }} - {{ user.phone_number }}
          </option>
        </select>
        <input v-model.number="form.amount" placeholder="Amount" required class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200" />
        <select v-model="form.type" required class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200">
          <option value="">Select Type</option>
          <option v-for="type in data.types" :value="type"> {{ type }} </option>
        </select>
        <select v-model="form.session" required class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200">
          <option value="">Select Session</option>
          <option v-for="session in data.sessions" :value="session"> {{ session }} </option>
        </select>
        <select v-model="form.month" required class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200">
          <option value="">Select Month</option>
          <option v-for="month in data.months" :value="month" > {{ month }} </option>
        </select> 
        <select v-model="form.method" required class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200">
          <option value="">Select Methods</option>
          <option v-for="month in data.methods" :value="month" > {{ month }} </option>
        </select> 
       
        <input v-model="form.pay_to" placeholder="Pay To" class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200" />
        <input v-model="form.send_from" placeholder="Send Number" class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200" />
        <input v-model="form.send_to" placeholder="Receive Number" class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200" />
        <input v-model="form.date" type="date" required class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200" />
        <input v-model="form.trx_id" placeholder="Transaction ID" class="border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200" />
      </div>
      <div class="flex space-x-4">
        <button type="submit" class="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl py-3 px-6 hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-purple-300 transform hover:scale-105 transition-all duration-200 font-semibold shadow-lg">
          যুক্ত করুন
        </button>
        <NuxtLink to="/deposits" class="bg-gray-500 text-white rounded-xl py-3 px-6 hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300 transform hover:scale-105 transition-all duration-200 font-semibold shadow-lg inline-block text-center">
          বাতিল করুন
        </NuxtLink>
      </div>
    </form>
  </div>
</template>
