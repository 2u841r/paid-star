<!-- components/PaymentForm.vue -->
<script setup>
import { reactive } from "vue";

const props = defineProps({
  githubUsername: {
    type: String,
    required: true,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["submit", "cancel"]);

const form = reactive({
  mobileNumber: "",
  paymentMethod: "",
});

const paymentMethods = [
  "GP (Grameenphone)",
  "BL (Banglalink)",
  "Robi",
  "Airtel",
  "Teletalk",
  "bKash",
  "Nagad",
  "Rocket",
];

function handleSubmit() {
  emit("submit", {
    mobileNumber: form.mobileNumber,
    paymentMethod: form.paymentMethod,
    githubId: props.githubUsername,
  });
}
</script>

<template>
  <div class="max-w-md mx-auto">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h2 class="card-title text-2xl mb-6">
          Payment Request Form
        </h2>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div class="form-control">
            <label for="mobileNumber" class="label">
              <span class="label-text">Mobile Number</span>
            </label>
            <input
              id="mobileNumber"
              v-model="form.mobileNumber"
              type="tel"
              pattern="01[0-9]{9}"
              placeholder="01XXXXXXXXX"
              class="input input-bordered"
              required
            >
            <label class="label">
              <span class="label-text-alt">11 digits starting with 0</span>
            </label>
          </div>

          <div class="form-control">
            <label for="paymentMethod" class="label">
              <span class="label-text">Payment Method</span>
            </label>
            <select
              id="paymentMethod"
              v-model="form.paymentMethod"
              class="select select-bordered"
              required
            >
              <option value="">
                Select payment method
              </option>
              <option
                v-for="method in paymentMethods"
                :key="method"
                :value="method"
              >
                {{ method }}
              </option>
            </select>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">GitHub Name</span>
            </label>
            <div class="input input-bordered bg-base-200 text-base-content/70">
              {{ githubUsername || 'Loading...' }}
            </div>
            <label class="label">
              <span class="label-text-alt">
                Automatically detected from your GitHub account
              </span>
            </label>
          </div>

          <div class="flex gap-3 pt-4">
            <button
              type="button"
              class="btn btn-outline flex-1"
              @click="$emit('cancel')"
            >
              Back
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="btn btn-primary flex-1"
            >
              <span
                v-if="submitting"
                class="loading loading-spinner loading-sm"
              />
              {{ submitting ? 'Submitting...' : 'Submit Request' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
