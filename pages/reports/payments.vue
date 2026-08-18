<script setup>
const deposits = ref([]);

onMounted(() => {
	deposits.value = useDepositsStore().all;
})


const paymentMethodStats = computed(() => {
  const methods = {}

  deposits.value.forEach((deposit, index) => {
    const method = deposit.method
    const amount = parseFloat(deposit.amount) || 0
    if (!methods[method]) methods[method] = {
    	trx: 0,
    	amount: 0,
    }
    methods[method]['trx'] += 1
    methods[method]['amount'] += amount
  })

  return methods;

  // return Object.entries(methods).map((method) => ({
  //   method
  // }))
})
</script>



<template >
	<div class="flex items-center justify-between mb-5">
		<h1 class="text-3xl text-gray-600 font-bold"> প্যামেন্ট মেথড  </h1>

		<div class="flex items-center gap-3">
		<select class="bg-white p-3"> 
			<option value="" selected> All </option>
			<option value="" v-for="(mt, i) in paymentMethodStats"> {{i}} </option>
		</select>
		<button class="p-3 print:hidden" onclick="window.print()"> <i class="fas fa-print"></i> </button>
		</div>
	</div>


	<div>
		<table class="w-full">
			<thead>
				<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"> মেডথ </th>
				<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"> টার্ম </th>
				<th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"> পরিমান </th>
			</thead>


			<tbody class="divide-y divide-gray-200">
				<tr v-for="(md, index) in paymentMethodStats" class="hover:bg-white transition-colors">
					<td class="px-4 py-2 text-sm" > {{index}} </td>
					<td class="px-4 py-2 text-sm" > {{md.trx}} </td>
					<td class="px-4 py-2 text-sm" > {{md.amount}} </td>
				</tr>
			</tbody>
		</table>
	</div>
</template>





<style >
</style>