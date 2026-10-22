<script setup>
// import Button from '~/components/Button.vue'

import {Home, User, Users, ChartPie, Settings, BangladeshiTaka, NotebookText, LogOut, FileText, UserPlus} from "@lucide/vue";

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
    { name: 'ড্যাশবোর্ড', path: '/', icon: Home},
    { name: 'সদস্যবৃন্দ', path: '/users', icon: Users },
    { name: 'রিপোর্টস', path: '/reports', icon: ChartPie },
    { name: 'সেটিংস', path: '/settings', icon: Settings }
  ]
  
  // Add deposits link only for admin
  if (auth.isAdmin) {
    items.push({ name: 'আমানত', path: '/deposits', icon:BangladeshiTaka })
  }
  
  return items
})

const globalNavItems = [
  {name:'জানুন', path: '/about-us', icon: FileText},
  {name:'নিয়মাবলি', path: '/constitution', icon:NotebookText},
  {name:'কিভাবে যুক্ত হবেন', path: '/', icon: UserPlus}
];

// Bottom tab items for mobile
const bottomTabItems = computed(() => {
  const items = [
    { name: 'হোম', path: '/', icon: Home }
  ]
  
  // Add profile/me for all authenticated users
  items.push({ name: 'প্রোফাইল', path: `/users/${auth.user?.user_id}`, icon: User })
  
  // Add constitution for all
  items.push({ name: 'বিধান', path: '/constitution', icon: NotebookText })
  
  // Add settings for admin only
  if (auth.isAdmin) {
    items.push({ name: 'সেটিংস', path: '/settings', icon: Settings})
    items.push({ name: 'জমা', path: '/deposits/add', icon: BangladeshiTaka})
  }
  
  // Add logout
  items.push({ name: 'লগআউট', path: '#', icon: LogOut, action: logout })
  
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
    <div v-if="isAsideOpen" @click="isAsideOpen = false" class="print:hidden fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"></div>

    <!-- Aside (Sidebar) - Sticky on desktop -->
    <aside 
      class="print:hidden w-64 bg-white shadow-2xl fixed md:sticky top-0 inset-y-0 left-0 z-50 transform -translate-x-full transition-transform duration-300 ease-in-out md:translate-x-0 md:block h-screen overflow-y-auto"
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
            <component :is="item.icon" :size="15" class="mr-3" />
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
            <component :is="gi.icon" :size="15" class="mr-3" />
            {{gi.name}}
          </NuxtLink>
        </nav>
      </div>
    </aside>

    <!-- Main content area -->
    <div class="flex-1 flex flex-col min-h-screen overflow-hidden">
      <!-- Header - Sticky on desktop -->
      <header class="print:hidden border-b shadow p-4 flex justify-between items-center bg-white bg-opacity-90 backdrop-blur-md static top-0 z-40">
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
            <span class="text-gray-800"> তারকারাজী  </span>
          </h1>
        </div>
        <Button variant="danger" @click="logout" class="hidden md:flex">
          <svg class="w-5 h-5 " fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
        </Button>
      </header>

      <!-- Main scrollable content -->
      <main class="flex-1 p-2 sm:p-6 overflow-y-auto pb-20 md:pb-6">
        <div class="z-1">

          <!-- Error Message -->
          <!-- div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-2xl">
            <p>{{ error }}</p>
          </div> -->

          <div class="hidden print:block">
            <h1 class="text-3xl pb-6 text-center"> তারকারাজী বিজনেস </h1>
          </div>

          <slot></slot>
        </div>
      </main>
    </div>
  </div>

  <!-- Bottom Tab Bar for Mobile -->
  <div v-if="isMobile" class="print:hidden fixed bottom-0 left-0 right-0 bg-white bg-opacity-95 backdrop-blur-md shadow-2xl border-t border-gray-200 z-50">
    <div class="flex justify-around items-center">
      <button
        v-for="item in bottomTabItems"
        :key="item.name"
        @click="item.action ? item.action() : navigateTo(item.path)"
        class="flex flex-col items-center justify-center py-2 px-3 transition-all duration-200 hover:bg-purple-50 active:scale-95"
        :class="{
          'text-purple-600': $route.path === item.path,
          'text-gray-600': $route.path !== item.path && !item.action
        }"
      >
        <component :is="item.icon" :size="15"  />
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