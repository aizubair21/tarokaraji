<script setup>
const auth = useAuthStore();
const data = useDataStore()

if (!auth.isAuthenticated || !auth.isAdmin) {
  await navigateTo('/login')
}

const deposits = ref(useDepositsStore().all);
const users = ref(useUsersStore().user);
const error = ref();


</script>


<template>
	<DepositOverview :deposits />
	<br>
	<Seperator> দ্রুত পদক্ষেপ </Seperator>
	
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">

		<NuxtLink 
			to="/deposits/add" 
			class="group bg-gradient-to-br from-purple-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
		>
			<div class="flex items-center justify-between mb-3">
				<i class="fas fa-plus text-3xl opacity-90"></i>
				<i class="fas fa-arrow-right opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1"></i>
			</div>
			<h3 class="text-xl font-bold mb-1"> যুক্ত করুন </h3>
			<p class="text-sm opacity-90"> সদস্যদের আমানত যোগ করুন   </p>
		</NuxtLink>

		<!-- Quick Action: অবদান (Contribution) -->
		<NuxtLink 
			to="/deposits/contributions" 
			class="group bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
		>
			<div class="flex items-center justify-between mb-3">
				<i class="fas fa-hand-holding-heart text-3xl opacity-90"></i>
				<i class="fas fa-arrow-right opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1"></i>
			</div>
			<h3 class="text-xl font-bold mb-1">অবদান</h3>
			<p class="text-sm opacity-90"> সদস্যদের অবদান দেখুন  </p>
		</NuxtLink>

		<!-- Quick Action: ডিপজিত শিট (Deposit Sheet) -->
		<NuxtLink 
			to="/deposits/sheet" 
			class="group bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
		>
			<div class="flex items-center justify-between mb-3">
				<i class="fas fa-table text-3xl opacity-90"></i>
				<i class="fas fa-arrow-right opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1"></i>
			</div>
			<h3 class="text-xl font-bold mb-1">ডিপজিত শিট</h3>
			<p class="text-sm opacity-90">সকল আমানত দেখুন</p>
		</NuxtLink>

		<!-- Quick Action: মাসিক রিপোর্ট (Monthly Report) -->
		<NuxtLink 
			to="/reports/monthly" 
			class="group bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
		>
			<div class="flex items-center justify-between mb-3">
				<i class="fas fa-chart-line text-3xl opacity-90"></i>
				<i class="fas fa-arrow-right opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1"></i>
			</div>
			<h3 class="text-xl font-bold mb-1">মাসিক রিপোর্ট</h3>
			<p class="text-sm opacity-90">মাসভিত্তিক রিপোর্ট দেখুন</p>
		</NuxtLink>

		<!-- Quick Action: সদস্য তালিকা (Member List) -->
		<!-- <NuxtLink 
			to="/users" 
			class="group bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
		>
			<div class="flex items-center justify-between mb-3">
				<i class="fas fa-users text-3xl opacity-90"></i>
				<i class="fas fa-arrow-right opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1"></i>
			</div>
			<h3 class="text-xl font-bold mb-1">সদস্য তালিকা</h3>
			<p class="text-sm opacity-90">সকল সদস্য দেখুন</p>
		</NuxtLink> -->

		<!-- Quick Action: বার্ষিক রিপোর্ট (Yearly Report) -->
		<NuxtLink 
			to="/reports/yearly" 
			class="group bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
		>
			<div class="flex items-center justify-between mb-3">
				<i class="fas fa-calendar-alt text-3xl opacity-90"></i>
				<i class="fas fa-arrow-right opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1"></i>
			</div>
			<h3 class="text-xl font-bold mb-1">বার্ষিক রিপোর্ট</h3>
			<p class="text-sm opacity-90">বার্ষিক রিপোর্ট দেখুন</p>
		</NuxtLink>

		<!-- Quick Action: এক্সপোর্ট ডাটা (Export Data) -->
		<NuxtLink 
			to="/export" 
			class="group bg-gradient-to-br from-teal-500 to-green-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
		>
			<div class="flex items-center justify-between mb-3">
				<i class="fas fa-download text-3xl opacity-90"></i>
				<i class="fas fa-arrow-right opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1"></i>
			</div>
			<h3 class="text-xl font-bold mb-1">এক্সপোর্ট ডাটা</h3>
			<p class="text-sm opacity-90">ডাটা এক্সপোর্ট করুন</p>
		</NuxtLink>

		<!-- Quick Action: স্ট্যাটিস্টিক্স (Statistics) -->
		<NuxtLink 
			to="/statistics" 
			class="group bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
		>
			<div class="flex items-center justify-between mb-3">
				<i class="fas fa-chart-pie text-3xl opacity-90"></i>
				<i class="fas fa-arrow-right opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1"></i>
			</div>
			<h3 class="text-xl font-bold mb-1">স্ট্যাটিস্টিক্স</h3>
			<p class="text-sm opacity-90">বিস্তারিত পরিসংখ্যান</p>
		</NuxtLink>

		<!-- Quick Action: সেটিংস (Settings) - Admin only -->
		<!-- <NuxtLink 
			v-if="auth.isAdmin"
			to="/settings" 
			class="group bg-gradient-to-br from-gray-600 to-gray-800 rounded-2xl p-6 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
		>
			<div class="flex items-center justify-between mb-3">
				<i class="fas fa-cog text-3xl opacity-90"></i>
				<i class="fas fa-arrow-right opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1"></i>
			</div>
			<h3 class="text-xl font-bold mb-1">সেটিংস</h3>
			<p class="text-sm opacity-90">সিস্টেম সেটিংস</p>
		</NuxtLink> -->
	</div>

	<!-- Alternative: Compact Button Style (Optional) -->
	<!-- 
	<div class="flex flex-wrap gap-3 mt-6">
		<NuxtLink to="/deposits/new" class="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all">
			<i class="fas fa-hand-holding-heart mr-2"></i> অবদান
		</NuxtLink>
		<NuxtLink to="/sheet" class="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all">
			<i class="fas fa-table mr-2"></i> ডিপজিত শিট
		</NuxtLink>
		<NuxtLink to="/reports/monthly" class="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all">
			<i class="fas fa-chart-line mr-2"></i> মাসিক রিপোর্ট
		</NuxtLink>
		<NuxtLink to="/users" class="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all">
			<i class="fas fa-users mr-2"></i> সদস্য তালিকা
		</NuxtLink>
	</div>
	-->
</template>

<style>
</style>