<script setup>
const props = defineProps({
  totalCompletedCount: {
    type: Number,
    required: true,
  },
  totalTasks: {
    type: Number,
    required: true,
  },
  progressPercentage: {
    type: Number,
    required: true,
  },
  allTasksCompleted: {
    type: Boolean,
    required: true,
  },
  hasSubmittedPaymentRequest: {
    type: Boolean,
    required: true,
  },
});

defineEmits(["show-payment-form"]);
</script>

<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h3 class="card-title text-xl mb-4">
        Progress
      </h3>

      <div class="space-y-4">
        <div class="flex justify-between text-sm">
          <span>Completed</span>
          <span>{{ totalCompletedCount }} / {{ totalTasks }}</span>
        </div>
        <progress
          class="progress progress-primary w-full"
          :value="progressPercentage"
          max="100"
        />
      </div>

      <div
        v-if="allTasksCompleted && !hasSubmittedPaymentRequest"
        class="alert alert-success mt-4"
      >
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clip-rule="evenodd"
          />
        </svg>
        <div>
          <h3 class="font-bold">
            All tasks completed!
          </h3>
          <p class="text-sm">
            You can now submit your payment request.
          </p>
        </div>
        <button class="btn btn-success" @click="$emit('show-payment-form')">
          Submit Payment Request
        </button>
      </div>

      <div
        v-if="allTasksCompleted && hasSubmittedPaymentRequest"
        class="alert alert-info mt-4"
      >
        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clip-rule="evenodd"
          />
        </svg>
        <div>
          <h3 class="font-bold">
            Payment Request Submitted!
          </h3>
          <p class="text-sm">
            Please wait a few hours to maybe days to get your rewards. We'll
            process your payment request as soon as possible.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
