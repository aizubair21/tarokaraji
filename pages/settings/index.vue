<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="bg-white bg-opacity-90 rounded-2xl p-6 ">
      <h1 class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        সেটিংস
      </h1>
      <p class="text-sm text-gray-500 mt-1">সিস্টেম কনফিগারেশন ও ব্যক্তিগত সেটিংস</p>
    </div>

    <div class="flex flex-col gap-6">
      
      <!-- Sidebar Navigation -->
      <div class="lg:col-span-1">
        <div class="bg-white overflow-hidden sticky top-20">
          <div class="flex gap-3 overflow-x-scroll">
            <button
              v-for="tab in settingsTabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="w-full flex items-center gap-3 px-3 rounded-xl transition-all duration-200"
              :class="activeTab === tab.id 
                ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-r-4 border-purple-600' 
                : 'text-gray-600 hover:bg-gray-50'"
            >
              <i :class="[tab.icon, 'text-md']"></i>
              <span class="inline-flex font-nowrap texy-nowrap nowrap texy-md">{{ tab.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="lg:col-span-2">
        <!-- Profile Settings -->
        <div v-if="activeTab === 'profile'" class="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div class="p-6 border-b border-gray-200">
            <h2 class="text-xl font-bold text-gray-800">প্রোফাইল সেটিংস</h2>
            <p class="text-sm text-gray-500 mt-1">আপনার ব্যক্তিগত তথ্য আপডেট করুন</p>
          </div>
          
          <form @submit.prevent="updateProfile" class="p-6 space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">বাংলা নাম</label>
                <input 
                  v-model="profileForm.name_bangla"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">ইংরেজি নাম</label>
                <input 
                  v-model="profileForm.name_english"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">ইমেইল ঠিকানা</label>
                <input 
                  v-model="profileForm.email"
                  type="email"
                  class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">মোবাইল নম্বর</label>
                <input 
                  v-model="profileForm.phone"
                  type="tel"
                  class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">ঠিকানা</label>
                <textarea 
                  v-model="profileForm.address"
                  rows="3"
                  class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                ></textarea>
              </div>
            </div>
            
            <div class="flex justify-end gap-3 pt-4">
              <button type="button" @click="resetProfileForm" class="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all">
                বাতিল করুন
              </button>
              <button type="submit" class="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all">
                সংরক্ষণ করুন
              </button>
            </div>
          </form>
        </div>

        <!-- Password Settings -->
        <div v-if="activeTab === 'password'" class="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div class="p-6 border-b border-gray-200">
            <h2 class="text-xl font-bold text-gray-800">পাসওয়ার্ড পরিবর্তন</h2>
            <p class="text-sm text-gray-500 mt-1">আপনার অ্যাকাউন্টের পাসওয়ার্ড আপডেট করুন</p>
          </div>
          
          <form @submit.prevent="changePassword" class="p-6 space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">বর্তমান পাসওয়ার্ড</label>
              <input 
                v-model="passwordForm.current_password"
                type="password"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">নতুন পাসওয়ার্ড</label>
              <input 
                v-model="passwordForm.new_password"
                type="password"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p class="text-xs text-gray-500 mt-1">পাসওয়ার্ড কমপক্ষে ৬ ক্যারেক্টার হতে হবে</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">নতুন পাসওয়ার্ড (পুনরায়)</label>
              <input 
                v-model="passwordForm.confirm_password"
                type="password"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            
            <div class="flex justify-end gap-3 pt-4">
              <button type="button" @click="resetPasswordForm" class="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all">
                বাতিল করুন
              </button>
              <button type="submit" class="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all">
                পাসওয়ার্ড পরিবর্তন
              </button>
            </div>
          </form>
        </div>

        <!-- Session Settings -->
        <div v-if="activeTab === 'session'" class="bg-white overflow-hidden">
          <!-- <div class="p-6 border-b border-gray-200">
            <h2 class="text-xl font-bold text-gray-800">সেশন কনফিগারেশন</h2>
            <p class="text-sm text-gray-500 mt-1">বর্তমান সেশন এবং অর্থবছর সেট করুন</p>
          </div> -->
          
          <div class="py-6 px-3 space-y-5">
            <div class="flex items-center justify-start gap-3">
              <label class="block text-sm font-medium text-gray-700 mb-2">সেশন {{auth.currentSession}} </label>
              <label class="block text-sm font-medium text-gray-700 mb-2">বর্তমান মাস {{auth.currentMonth}} </label>
            </div>
            
            <div class="pt-4">
              <SessionManager />
	      <!-- <NuxtLink to="/session" class="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all">
                সেসন দেখুন
              </NuxtLink> -->
            </div>
          </div>
        </div>

        <!-- Notification Settings -->
        <div v-if="activeTab === 'notifications'" class="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div class="p-6 border-b border-gray-200">
            <h2 class="text-xl font-bold text-gray-800">নোটিফিকেশন সেটিংস</h2>
            <p class="text-sm text-gray-500 mt-1">আপনি কোন নোটিফিকেশন পেতে চান</p>
          </div>
          
          <div class="p-6 space-y-4">
            <div class="flex items-center justify-between py-3 border-b">
              <div>
                <h3 class="font-medium text-gray-800">ইমেইল নোটিফিকেশন</h3>
                <p class="text-sm text-gray-500">নতুন আমানত এবং আপডেটের জন্য ইমেইল পান</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="notificationSettings.email" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            
            <div class="flex items-center justify-between py-3 border-b">
              <div>
                <h3 class="font-medium text-gray-800">এসএমএস নোটিফিকেশন</h3>
                <p class="text-sm text-gray-500">গুরুত্বপূর্ণ আপডেটের জন্য এসএমএস পান</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="notificationSettings.sms" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            
            <div class="flex items-center justify-between py-3">
              <div>
                <h3 class="font-medium text-gray-800">ব্রাউজার নোটিফিকেশন</h3>
                <p class="text-sm text-gray-500">ব্রাউজারে পপআপ নোটিফিকেশন দেখান</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" v-model="notificationSettings.browser" class="sr-only peer">
                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            
            <div class="flex justify-end pt-4">
              <button @click="saveNotificationSettings" class="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all">
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>

        <!-- System Settings (Admin Only) -->
        <div v-if="activeTab === 'system' && auth.isAdmin" class="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div class="p-6 border-b border-gray-200">
            <h2 class="text-xl font-bold text-gray-800">সিস্টেম সেটিংস</h2>
            <p class="text-sm text-gray-500 mt-1">অ্যাডমিন প্যানেল সেটিংস</p>
          </div>
          
          <div class="p-6 space-y-5">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">ডিফল্ট পৃষ্ঠা সীমা</label>
              <select 
                v-model="systemSettings.defaultPageLimit"
                class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="10">১০টি রেকর্ড</option>
                <option value="25">২৫টি রেকর্ড</option>
                <option value="50">৫০টি রেকর্ড</option>
                <option value="100">১০০টি রেকর্ড</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">ডিফল্ট থিম</label>
              <select 
                v-model="systemSettings.defaultTheme"
                class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="light">হালকা</option>
                <option value="dark">গা dark ়</option>
                <option value="system">সিস্টেম</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">ডাটা ব্যাকআপ ফ্রিকোয়েন্সি</label>
              <select 
                v-model="systemSettings.backupFrequency"
                class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <option value="daily">দৈনিক</option>
                <option value="weekly">সাপ্তাহিক</option>
                <option value="monthly">মাসিক</option>
              </select>
            </div>
	    

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> Active Tab </label>
              <select
                v-model="systemSettings.tabName"
                class="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2">
                <option value="Transactions"> Primary </option>
                <option value="Api"> Secondary </option>                                                <option value="monthly">মাসিক</option>
              </select>
            </div>

            
            <div class="flex justify-end pt-4">
              <button @click="saveSystemSettings" class="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all">
                সংরক্ষণ করুন
              </button>
            </div>
          </div>
        </div>

        <!-- About Section -->
        <div v-if="ractiveTab === 'about'" class="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div class="p-6 border-b border-gray-200">
            <h2 class="text-xl font-bold text-gray-800">সিস্টেম সম্পর্কে</h2>
            <p class="text-sm text-gray-500 mt-1">সিস্টেম তথ্য এবং সংস্করণ</p>
          </div>
          
          <div class="p-6 space-y-4">
            <div class="flex justify-between py-2 border-b">
              <span class="text-gray-600">সফটওয়্যার সংস্করণ</span>
              <span class="font-medium text-gray-800">v2.0.0</span>
            </div>
            <div class="flex justify-between py-2 border-b">
              <span class="text-gray-600">লাস্ট আপডেট</span>
              <span class="font-medium text-gray-800">{{ new Date().toLocaleDateString('bn-BD') }}</span>
            </div>
            <div class="flex justify-between py-2 border-b">
              <span class="text-gray-600">সংযুক্ত গুগল শীট</span>
              <span class="font-medium text-gray-800">{{ spreadsheetId?.slice(0, 15) }}...</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-gray-600">স্টোরেজ স্ট্যাটাস</span>
              <span class="font-medium text-green-600">সক্রিয়</span>
            </div>
            
            <div class="mt-4 p-4 bg-gray-50 rounded-xl text-center">
              <p class="text-sm text-gray-600">© ২০২৪ - ডেভেলপড বিডি আইটি সলিউশন</p>
              <p class="text-xs text-gray-500 mt-1">সকল অধিকার সংরক্ষিত</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
const auth = useAuthStore()
const spreadsheetId = process.env.NUXT_PUBLIC_SPREADSHEET_ID

// Active tab state
const activeTab = ref('session')

// Settings tabs configuration
const settingsTabs = [
  // { id: 'profile', name: 'প্রোফাইল', icon: 'fas fa-user' },
  // { id: 'password', name: 'পাসওয়ার্ড', icon: 'fas fa-lock' },
  { id: 'session', name: 'সেশন', icon: 'fas fa-calendar-alt' },
  // { id: 'notifications', name: 'নোটিফিকেশন', icon: 'fas fa-bell' },
  // { id: 'about', name: 'সিস্টেম সম্পর্কে', icon: 'fas fa-info-circle' }
]

// Add system tab for admin only
if (auth.isAdmin) {
  settingsTabs.splice(3, 0, { id: 'system', name: 'সিস্টেম', icon: 'fas fa-cog' })
}

// Profile form
const profileForm = reactive({
  name_bangla: auth.userName || '',
  name_english: '',
  email: auth.userEmail || '',
  phone: '',
  address: ''
})

// Password form
const passwordForm = reactive({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

// Session configuration
const sessions = ref(['২০২৩-২৪', '২০২৪-২৫', '২০২৫-২৬'])
const months = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
]

const sessionConfig = reactive({
  currentSession: auth.currentSession || '২০২৪-২৫',
  currentMonth: auth.currentMonth || months[new Date().getMonth()]
})

// Notification settings
const notificationSettings = reactive({
  email: true,
  sms: false,
  browser: true
})

// System settings (admin only)
const systemSettings = reactive({
  defaultPageLimit: '25',
  defaultTheme: 'light',
  backupFrequency: 'weekly',
  tabName: 'Transactions'
})

// Profile methods
const updateProfile = async () => {
  try {
    // API call to update profile
    await $fetch('/api/auth/update-profile', {
      method: 'PUT',
      body: profileForm
    })
    alert('প্রোফাইল সফলভাবে আপডেট হয়েছে')
  } catch (error) {
    console.error('Profile update error:', error)
    alert('প্রোফাইল আপডেট করতে ব্যর্থ হয়েছে')
  }
}

const resetProfileForm = () => {
  profileForm.name_bangla = auth.userName || ''
  profileForm.email = auth.userEmail || ''
  profileForm.name_english = ''
  profileForm.phone = ''
  profileForm.address = ''
}

// Password methods
const changePassword = async () => {
  if (passwordForm.new_password !== passwordForm.confirm_password) {
    alert('নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না')
    return
  }
  
  if (passwordForm.new_password.length < 6) {
    alert('পাসওয়ার্ড কমপক্ষে ৬ ক্যারেক্টার হতে হবে')
    return
  }
  
  try {
    await $fetch('/api/auth/change-password', {
      method: 'POST',
      body: {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      }
    })
    alert('পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে')
    resetPasswordForm()
  } catch (error) {
    console.error('Password change error:', error)
    alert('পাসওয়ার্ড পরিবর্তন করতে ব্যর্থ হয়েছে')
  }
}

const resetPasswordForm = () => {
  passwordForm.current_password = ''
  passwordForm.new_password = ''
  passwordForm.confirm_password = ''
}

// Session methods
const updateSessionConfig = async () => {
  try {
    await $fetch('/api/auth/update-session', {
      method: 'POST',
      body: sessionConfig
    })
    auth.currentSession = sessionConfig.currentSession
    auth.currentMonth = sessionConfig.currentMonth
    alert('সেশন কনফিগারেশন আপডেট হয়েছে')
  } catch (error) {
    console.error('Session update error:', error)
    alert('সেশন আপডেট করতে ব্যর্থ হয়েছে')
  }
}

// Notification methods
const saveNotificationSettings = async () => {
  try {
    await $fetch('/api/auth/notifications', {
      method: 'POST',
      body: notificationSettings
    })
    alert('নোটিফিকেশন সেটিংস সংরক্ষিত হয়েছে')
  } catch (error) {
    console.error('Notification settings error:', error)
    alert('সেটিংস সংরক্ষণ করতে ব্যর্থ হয়েছে')
  }
}

// System settings method (admin only)
const saveSystemSettings = async () => {
  try {
    await $fetch('/api/crud/Settings', {
      method: 'POST',
      body: systemSettings
    })
    alert('সিস্টেম সেটিংস সংরক্ষিত হয়েছে')
  } catch (error) {
    console.error('System settings error:', error)
    alert(erroe);
  }
}

// Load saved settings on mount
onMounted(async () => {
  try {
    // Load user profile
   # const profile = await $fetch('/api/auth/profile')
    const profile = [];
    if (profile) {
      profileForm.name_bangla = profile.name_bangla || auth.userName
      profileForm.email = profile.email || auth.userEmail
      profileForm.phone = profile.phone || ''
      profileForm.address = profile.address || ''
    }
    
    // Load notification settings
    const notifSettings = [];
   # await $fetch('/api/auth/notifications')
    if (notifSettings) {
      notificationSettings.email = notifSettings.email ?? true
      notificationSettings.sms = notifSettings.sms ?? false
      notificationSettings.browser = notifSettings.browser ?? true
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
})
</script>

<style scoped>
input:focus, select:focus, textarea:focus {
  outline: none;
}
</style>
