<script setup>
// Correct way to define props
const props = defineProps({
  deposits: {
    type: Array,
    required: true,
    default: () => []
  }
})

const auth = useAuthStore();

const getAmount = (deposit) => {
  return parseFloat(deposit.amount) || 0
}
// Helper function to get type from indexed array
const getType = (deposit) => {
  return deposit.type || ''
}

// Helper function to get month from indexed array
const getMonth = (deposit) => {
  return deposit.month || ''
}

// Helper function to get session from indexed array
const getSession = (deposit) => {
  return deposit.session || ''
}

const totalDeposit = computed(() => {
  return props.deposits?.reduce((sum, d) => sum + getAmount(d), 0) || 0
})

const monthlyDeposit = computed(() => {
  return props.deposits?.filter(d => getType(d) === 'Monthly')
    .reduce((sum, d) => sum + getAmount(d), 0) || 0
})

const yearlyDeposit = computed(() => {
  return props.deposits?.filter(d => getType(d) === 'Yearly')
    .reduce((sum, d) => sum + getAmount(d), 0) || 0
})

const costDeposit = computed(() => {
  return props.deposits?.filter(d => getType(d) === 'Maintainanc')
    .reduce((sum, d) => sum + getAmount(d), 0) || 0
})

const currentMonthDeposit = computed(() => {
  return props.deposits?.filter(d => getMonth(d) === auth.currentMonth && getSession(d) === auth.currentSession)
    .reduce((sum, d) => sum + getAmount(d), 0) || 0
})

const currentSessionDeposit = computed(() => {
  return props.deposits?.filter(d => getSession(d) === auth.currentSession)
    .reduce((sum, d) => sum + getAmount(d), 0) || 0
})


</script>

<template>
	
 <!-- Deposits Overview Section -->
<div class="px-5">
  <h2 class="text-sm font-bold mb-4 pb-2"> অভারভিউ </h2>
  
  <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
    <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <h3 class="text-sm font-medium text-gray-600 mb-2">মোট আমানত</h3>
      <p class="text-2xl font-bold text-green-600">{{ totalDeposit.toLocaleString() }} ৳</p>
    </div>
     
    <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <h3 class="text-sm font-medium text-gray-600 mb-2">মাসিক আমানত</h3>
      <p class="text-2xl font-bold text-teal-600">{{ monthlyDeposit.toLocaleString() }} ৳</p>
    </div>
    
    <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <h3 class="text-sm font-medium text-gray-600 mb-2">বার্ষিক আমানত</h3>
      <p class="text-2xl font-bold text-indigo-600">{{ yearlyDeposit.toLocaleString() }} ৳</p>
    </div>
    
    <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <h3 class="text-sm font-medium text-gray-600 mb-2">খরচ</h3>
      <p class="text-2xl font-bold text-red-600">{{ costDeposit.toLocaleString() }} ৳</p>
    </div>
    
    <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <h3 class="text-sm font-medium text-gray-600 mb-2">চলতি মাসের আমানত</h3>
      <p class="text-2xl font-bold text-orange-600">{{ currentMonthDeposit.toLocaleString() }} ৳</p>
    </div>
    
    <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <h3 class="text-sm font-medium text-gray-600 mb-2">চলতি সেশনের আমানত</h3>
      <p class="text-2xl font-bold text-cyan-600">{{ currentSessionDeposit.toLocaleString() }} ৳</p>
    </div>
  </div>
</div>

</template>

<style>
	

</style>