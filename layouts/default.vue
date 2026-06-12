<script setup>
// import Button from '~/components/Button.vue'

const auth = useAuthStore()
const isAsideOpen = ref(false)
const isMobile = ref(false)

const logout = () => {
  auth.logout()
  navigateTo('/login')
}

// Check if mobile on mount and resize
const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
}

// Navigation items based on user role
const mainNavItems = computed(() => {
  const items = [
    { name: 'ড্যাশবোর্ড', path: '/', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z' },
     { name: 'প্রোফাইল', path: `/users/${auth.userId}`, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { name: 'সদস্যবৃন্দ', path: '/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
    { name: 'রিপোর্টস', path: '/reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { name: 'সেটিংস', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
  ]
  
  // Add deposits link only for admin
  if (auth.isAdmin) {
    items.push({ name: 'আমানত', path: '/deposits', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' })
  }
  
  return items
})

const globalNavItems = [
  {name:'জানুন', path: '/about-us', icon:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'},
  {name:'নিয়মাবলি', path: '/constitution', icon:'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'},
  {name:'কিভাবে যুক্ত হবেন', path: '/', icon:'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z'}
];

// Bottom tab items for mobile
const bottomTabItems = computed(() => {
  const items = [
    { name: 'হোম', path: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }
  ]
  
  // Add profile/me for all authenticated users
  items.push({ name: 'প্রোফাইল', path: `/users/${auth.user?.user_id}`, icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' })
  
  // Add constitution for all
  items.push({ name: 'বিধান', path: '/constitution', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' })
  
  // Add settings for admin only
  if (auth.isAdmin) {
    items.push({ name: 'সেটিংস', path: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' })
    items.push({ name: 'জমা', path: '/deposits/add', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' })
  }
  
  // Add logout
  items.push({ name: 'লগআউট', path: '#', icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1', action: logout })
  
  return items
})

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<template>
  <!-- <div class="min-h-screen  flex bg-gradient-to-br from-purple-400 via-pink-500 to-red-500"> -->
  <div class="min-h-screen flex">
    
    <!-- Mobile backdrop -->
    <div v-if="isAsideOpen" @click="isAsideOpen = false" class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"></div>

    <!-- Aside (Sidebar) - Sticky on desktop -->
    <aside 
      class="w-64 bg-white shadow-2xl fixed md:sticky top-0 inset-y-0 left-0 z-50 transform -translate-x-full transition-transform duration-300 ease-in-out md:translate-x-0 md:block h-screen overflow-y-auto"
      :class="{ 'translate-x-0': isAsideOpen }">
      <div class="p-4">
        <div class="text-center mb-6">
          <Logo />
          <p class="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-sans">
            {{ auth.isAdmin ? 'পরিচালক' : 'সদস্য' }}
          </p>
        </div>

        <nav class="space-y-2">
          <NuxtLink 
            v-for="item in mainNavItems" 
            :key="item.path"
            :to="item.path" 
            class="flex items-center py-3 px-4 rounded-lg hover:bg-gray-100 hover:text-gray-600 transition-colors"
            @click="isAsideOpen = false"
          >
            <svg class="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon"></path>
            </svg>
            {{ item.name }}
          </NuxtLink>
          
          <hr class="my-2 border-gray-200" />
          
          <!-- Additional global navigation links -->
          <NuxtLink 
            v-for="gi in globalNavItems"
            :key="gi.path"
            :to="gi.path" 
            class="flex items-center py-3 px-4 rounded-lg hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <svg class="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="gi.icon"></path>
            </svg>
            {{gi.name}}
          </NuxtLink>
        </nav>
      </div>
    </aside>

    <!-- Main content area -->
    <div class="flex-1 flex flex-col min-h-screen overflow-hidden">
      <!-- Header - Sticky on desktop -->
      <header class="border-b shadow p-4 flex justify-between items-center bg-white bg-opacity-90 backdrop-blur-md sticky top-0 z-40">
        <div class="flex items-center">
          <button @click="isAsideOpen = !isAsideOpen" class="md:hidden mr-2 text-gray-600 hover:text-gray-800">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <h1 class="text-xl font-semibold flex items-center justify-start space-x-2">
            <div v-if="auth.isLoading" class="flex justify-center items-center mr-3">
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
            </div>
            <span class="text-gray-800">{{ auth.user?.name_english || "Anonimous" }}</span>
          </h1>
        </div>
        <Button variant="danger" @click="logout" class="hidden md:flex">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          <p>লগআউট</p>
        </Button>
      </header>

      <!-- Main scrollable content -->
      <main class="flex-1 p-2 sm:p-6 overflow-y-auto pb-20 md:pb-6">
        <div class="z-1">

          <!-- Error Message -->
          <!-- div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl">
            <p>{{ error }}</p>
          </div> -->

          <slot></slot>
        </div>
      </main>
    </div>
  </div>

  <!-- Bottom Tab Bar for Mobile -->
  <div v-if="isMobile" class="fixed bottom-0 left-0 right-0 bg-white bg-opacity-95 backdrop-blur-md shadow-2xl border-t border-gray-200 z-50">
    <div class="flex justify-around items-center">
      <button
        v-for="item in bottomTabItems"
        :key="item.name"
        @click="item.action ? item.action() : navigateTo(item.path)"
        class="flex flex-col items-center py-2 px-3 transition-all duration-200 hover:bg-purple-50 active:scale-95"
        :class="{
          'text-purple-600': $route.path === item.path,
          'text-gray-600': $route.path !== item.path && !item.action
        }"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.icon"></path>
        </svg>
        <span class="text-xs mt-1 font-medium">{{ item.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Desktop sidebar styling */
@media (min-width: 768px) {
  aside {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
  }
  
  /* Custom scrollbar for sidebar */
  aside::-webkit-scrollbar {
    width: 6px;
  }
  
  aside::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  aside::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
  
  aside::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
}

/* Main content scrollbar styling */
main::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

main::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

main::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

main::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* Active route styling */
.router-link-active {
  border-left: 5px solid rebeccapurple;
  color: rebeccapurple;
  font-weight: bold;
  background: linear-gradient(45deg, #fff3ff, aliceblue);
}

.router-link-active svg {
  color:rebeccapurple;
}

/* Mobile optimizations */
@media (max-width: 768px) {
  main {
    -webkit-overflow-scrolling: touch;
  }
}

/* Bottom tab active styling */
.bottom-tab-active {
  position: relative;
}

.bottom-tab-active::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 3px;
  background: linear-gradient(to right, #8b5cf6, #ec4899);
  border-radius: 3px;
}

/* Ensure proper height on all screens */
.min-h-screen {
  min-height: 100vh;
}

/* Fix for content area */
.flex-1 {
  flex: 1;
  min-width: 0; /* Prevents flex overflow issues */
}

/* Hide scrollbar for header */
header {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

header::-webkit-scrollbar {
  display: none;
}
</style>