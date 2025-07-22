<script lang="ts" setup>
const authStore = useAuthStore();
</script>

<template>
  <div class="hero bg-base-300 container mx-auto mt-4">
    <div class="hero-content text-center min-h-96">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">
          Paid Star
        </h1>
        <p class="py-6">
          Win ৳20 mobile recharge or MFS directly by starring some repos on GitHub and following their ID!
        </p>
        <AuthButton v-if="!authStore.user" />
        <NuxtLink v-else to="/dashboard" class="btn btn-primary">
          Start Earning
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
