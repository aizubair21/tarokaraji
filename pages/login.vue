<script setup>

const auth = useAuthStore()
const email = ref('')
const error = ref('')
const isModelOpen = ref(0)
const config = useRuntimeConfig();
import {Send} from "@lucide/vue";
if (auth.isAuthenticated) {
  await navigateTo('/')
}

definePageMeta({
  layout:false,  
})

const login = async () => {
  try {
    await auth.login(email.value)
    await navigateTo('/')
  } catch (e) {
    //console.log(e);
    error.value = e.message || 'Login failed'
  }
}


</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 relative overflow-hidden p-2">
   
    <div class="bg-white bg-opacity-90 backdrop-blur-md shadow-2xl rounded-2xl p-10 w-full max-w-md relative z-10 transform transition-transform duration-300">
      <div class="text-center mb-6">
        <div class="flex items-center justify-center">
           <Logo />
        </div>
        <p class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-sans"> তারকারাজী বিজনেস</p>
      </div>
      <form @submit.prevent="login" class="space-y-6">
        <div class="relative">
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">Your Email</label>
          <div class="relative">
            <input
              id="phone"
              v-model="email"
              type="email"
              placeholder="test@example.com"
              required
              class="border-2 border-gray-300 rounded-xl px-4 py-3 pl-12 w-full focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200 text-lg"
            />
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
		<Send class="text-purple-600" size="17"/>
            </div>
          </div>
        </div>
        <button
          type="submit"
          class="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl py-3 w-full hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-purple-300 transform hover:scale-105 transition-all duration-200 text-lg font-semibold shadow-lg"
        >
          Continue
        </button>
      </form>
      <p v-if="error" class="text-red-600 text-sm text-center mt-6 bg-red-50 p-3 rounded-lg border border-red-200">{{ error }}</p>
      <div class="text-center mt-6">
        <p class="text-gray-600">Don't have an account? <NuxtLink to="/register" class="text-purple-600 hover:text-purple-800 font-semibold">Register here</NuxtLink></p>
      </div>
    </div>
  </div>
</template>


