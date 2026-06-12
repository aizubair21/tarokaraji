<script setup>

const form = ref({
  name_bangla: '',
  name_english: '',
  phone_number: '',
  email: '',
})

const errors = ref({})
const isSubmitting = ref(false)

definePageMeta({
  layout: false,
})

const validateForm = () => {
  errors.value = {}

  // Name validation
  if (!form.value.name_bangla.trim()) {
    errors.value.namebd = 'Name is required'
  } 

  if (!form.value.name_english.trim()) {
    errors.value.nameen = 'Name is required'
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!form.value.email.trim()) {
    errors.value.email = 'Email is required'
  } else if (!emailRegex.test(form.value.email)) {
    errors.value.email = 'Invalid email format'
  }


  // Phone validation
  const phoneRegex = /^(016|017|013|018|019|014|015)\d{8}$/
  if (!form.value.phone_number.trim()) {
    errors.value.phone_number = 'Phone number is required'
  } else if (!phoneRegex.test(form.value.phone_number)) {
    errors.value.phone_number = 'Invalid phone number format'
  }

  return Object.keys(errors.value).length === 0
}

const register = async () => {
  if (!validateForm()) {
    return
  }

  isSubmitting.value = true

  try {
    const response = await $fetch('/api/users', {
      method: 'POST',
      body: form.value
    })

    // Show success toast
    // const toast = useNuxtApp().$toast
    // toast.success('Registration successful! Please login.')

    // Redirect to login
    await navigateTo('/login')
  } catch (error) {
    console.error('Registration error:', error)
    // const toast = useNuxtApp().$toast
    // toast.error(error.data?.message || 'Registration failed. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 relative overflow-hidden py-8">
    <div class="bg-white bg-opacity-90 backdrop-blur-md shadow-2xl rounded-2xl p-10 w-full max-w-lg relative z-10">
      <div class="text-center mb-6">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4 shadow-lg">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
          </svg>
        </div>
        <p class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-sans">তারকারাজী বিজনেস রেজিস্ট্রেশন</p>
      </div>
      <form @submit.prevent="register" class="space-y-4">
       
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-2">Name In Bangoli</label>
          <input
            id="name"
            v-model="form.name_bangla"
            type="text"
            required
            placeholder=" আহমাদুল্লা আয়ান"
            class="border-2 border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200 text-lg"
          />
          <p v-if="errors.namebn" class="text-red-600 text-sm mt-1">{{ errors.namebn }}</p>
        </div>

        <div>
          <label for="name" class="block text-sm font-medium text-gray-700 mb-2">Name In English</label>
          <input
            id="name"
            v-model="form.name_english"
            type="text"
            required
            placeholder="Ahmadullah Ayan"
            class="border-2 border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200 text-lg"
          />
          <p v-if="errors.nameen" class="text-red-600 text-sm mt-1">{{ errors.nameen }}</p>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            required
            placeholder="youremail@gmail.com"
            class="border-2 border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200 text-lg"
          />
          <p v-if="errors.email" class="text-red-600 text-sm mt-1">{{ errors.email }}</p>
        </div>

        <div>
          <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <input
            id="phone"
            v-model="form.phone"
            type="tel"
            required
            placeholder="011*********"
            class="border-2 border-gray-300 rounded-xl px-4 py-2 w-full focus:outline-none focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200 text-lg"
          />
          <p v-if="errors.phone" class="text-red-600 text-sm mt-1">{{ errors.phone_number }}</p>
        </div>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl py-3 w-full hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-4 focus:ring-purple-300 transform hover:scale-105 transition-all duration-200 text-lg font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isSubmitting ? 'Registering...' : 'Register' }}
        </button>
      </form>
      <div class="text-center mt-6">
        <p class="text-gray-600">Already have an account? <NuxtLink to="/login" class="text-purple-600 hover:text-purple-800 font-semibold">Login here</NuxtLink></p>
      </div>
    </div>
  </div>
</template>
