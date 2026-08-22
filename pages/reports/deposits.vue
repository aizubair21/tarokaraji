<script setup lang="ts">
const usersStore = ref(useUsersStore();
const sessionsStore = ref(useSesssionsStore());
const transactionsStore = ref(useDepositsStore());

  onMounted(()=>{
  //userStore = useUsersStore();
  //sessionsStore = useSessionsStore();
  //transactionsStore = useDepositsStore();
})
  
const selectedUser = ref('')
const selectedSession = ref('')

const report = computed(() => {
  return buildDepositReport({
    users: usersStore.users,
    sessions: sessionsStore.sessions,
    transactions: transactionsStore.transactions,

    userId: selectedUser.value || null,
    session: selectedSession.value || null,
  })
})
</script>

<template>
  <div class="p-6">

    <div class="mb-6">
      <h1 class="text-2xl font-bold">
        Deposit Report
      </h1>

      <button class="print:hidden" onClick="window.print()" > <i class='fas fa print' </ button>
    </div>


    <!-- Filters -->

    <div class="print:hidden grid gap-4 md:grid-cols-2">

      <div>
        <label class="mb-1 block text-sm font-medium">
          User
        </label>

        <select
          v-model="selectedUser"
          class="w-full rounded-lg border px-3 py-2"
        >
          <option value="">
            All Users
          </option>

          <option
            v-for="user in usersStore.users"
            :key="user.user_id"
            :value="user.user_id"
          >
            {{ user.user_name }}
          </option>
        </select>
      </div>


      <div>
        <label class="mb-1 block text-sm font-medium">
          Session
        </label>

        <select
          v-model="selectedSession"
          class="w-full rounded-lg border px-3 py-2"
        >
          <option value="">
            All Sessions
          </option>

          <option
            v-for="session in sessionsStore.sessions"
            :key="session.session_name"
            :value="session.session_name"
          >
            {{ session.session_name }}
          </option>
        </select>
      </div>

    </div>


    <!-- Summary -->

    <div class="mt-6 grid gap-4 sm:grid-cols-3">

      <SummaryCard
        title="Total Expected"
        :amount="report.summary.expected"
      />

      <SummaryCard
        title="Total Paid"
        :amount="report.summary.paid"
      />

      <SummaryCard
        title="Total Due"
        :amount="report.summary.due"
      />

    </div>


    <!-- Deposit breakdown -->

    <!-- <div class="hidden mt-6 grid gap-4 md:grid-cols-3">

      <DepositCard
        title="Monthly Deposit"
        :data="report.monthly"
      />

      <DepositCard
        title="Yearly Deposit"
        :data="report.yearly"
      />

      <DepositCard
        title="Cost"
        :data="report.cost"
      />

    </div> -->


    <!-- Details -->

    <div class="mt-8 overflow-hidden rounded-xl border">

      <div class="border-b p-4">
        <h2 class="font-semibold">
          User Details
        </h2>
      </div>

      <table class="w-full text-sm">

        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left">User</th>
            <th class="px-4 py-3 text-right">Monthly</th>
            <th class="px-4 py-3 text-right">Yearly</th>
            <th class="px-4 py-3 text-right">Cost</th>
            <th class="px-4 py-3 text-right">Total</th>
            <th class="px-4 py-3 text-right">Due</th>
          </tr>
        </thead>

        <tbody>

          <tr
            v-for="row in report.users"
            :key="row.userId"
            class="border-t"
          >

            <td class="px-4 py-3">
              {{ row.userName }}
            </td>

            <td class="px-4 py-3 text-right">
              ৳{{ row.monthly.paid }}
              /
              ৳{{ row.monthly.due }}
            </td>

            <td class="px-4 py-3 text-right">
              ৳{{ row.yearly.paid }}
              /
              ৳{{ row.yearly.due }}
            </td>

            <td class="px-4 py-3 text-right">
              ৳{{ row.cost.paid }}
              /
              ৳{{ row.cost.due }}
            </td>

            <td class="px-4 py-3 text-right font-medium">
              ৳{{ row.total.paid }}
            </td>

            <td class="px-4 py-3 text-right font-medium">
              ৳{{ row.total.due }}
            </td>

          </tr>

        </tbody>

      </table>

    </div>

  </div>
</template>
