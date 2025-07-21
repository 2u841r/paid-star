<script setup>
import { computed, onMounted, ref } from "vue";

// Auth store
const authStore = useAuthStore();

// Reactive data
const loading = ref(true);
const tasks = ref([]);
const completedTasks = ref([]);
const githubStatus = ref({});
const showPaymentForm = ref(false);
const submitting = ref(false);
const seeding = ref(false);
const paymentRequestStatus = ref(null);

const paymentForm = ref({
  mobileNumber: "",
  paymentMethod: "",
  githubId: "",
});

// Computed property to get GitHub username from authenticated user
const githubUsername = computed(() => {
  if (!authStore.user)
    return "";

  // For GitHub users, the name field typically contains the GitHub username
  // If not, we can extract it from the email (GitHub emails are usually username@users.noreply.github.com)
  if (authStore.user.name) {
    return authStore.user.name;
  }

  // Fallback: try to extract username from email
  if (authStore.user.email && authStore.user.email.includes("@users.noreply.github.com")) {
    return authStore.user.email.split("@")[0];
  }

  return "";
});

// Computed properties
const progressPercentage = computed(() => {
  if (tasks.value.length === 0)
    return 0;

  // Count tasks that are completed (either in completedTasks array or already done on GitHub)
  const totalCompleted = tasks.value.reduce((count, task) => {
    const isCompleted = completedTasks.value.includes(task.id) || isTaskCompletedOnGitHub(task.id);
    return count + (isCompleted ? 1 : 0);
  }, 0);

  return Math.round((totalCompleted / tasks.value.length) * 100);
});

const allTasksCompleted = computed(() => {
  if (tasks.value.length === 0)
    return false;

  // Check if all tasks are completed (either in completedTasks array or already done on GitHub)
  return tasks.value.every(task =>
    completedTasks.value.includes(task.id) || isTaskCompletedOnGitHub(task.id),
  );
});

// Computed property for total completed tasks count
const totalCompletedCount = computed(() => {
  return tasks.value.reduce((count, task) => {
    const isCompleted = completedTasks.value.includes(task.id) || isTaskCompletedOnGitHub(task.id);
    return count + (isCompleted ? 1 : 0);
  }, 0);
});

// Computed property to check if user has already submitted payment request
const hasSubmittedPaymentRequest = computed(() => {
  return paymentRequestStatus.value?.hasPaymentRequest || false;
});

// Helper function to check if task is already completed on GitHub
function isTaskCompletedOnGitHub(taskId) {
  const status = githubStatus.value[taskId];
  if (!status)
    return false;

  return status.starred === true || status.followed === true;
}

// Methods
async function loadTasks() {
  try {
    loading.value = true;
    const response = await $fetch("/api/tasks/status");
    tasks.value = response.tasks;
    completedTasks.value = response.completedTasks;
    githubStatus.value = response.githubStatus;
  }
  catch (error) {
    console.error("Error loading tasks:", error);
  }
  finally {
    loading.value = false;
  }
}

async function loadPaymentRequestStatus() {
  try {
    const response = await $fetch("/api/payment-request");
    paymentRequestStatus.value = response;
  }
  catch (error) {
    console.error("Error loading payment request status:", error);
  }
}

async function completeTask(task) {
  try {
    const response = await $fetch(`/api/tasks/${task.id}/complete`, { method: "POST" });

    if (response.success) {
      // Reload tasks to get updated completion status
      await loadTasks();

      // Show success message
      if (response.manual) {
        console.log("Task completed manually due to GitHub API limitations");
      }
      else {
        console.log("Task completed successfully!");
      }
    }
  }
  catch (error) {
    console.error("Error completing task:", error);
    // You could add a toast notification here
  }
}

async function seedTasks() {
  try {
    seeding.value = true;
    const response = await $fetch("/api/tasks/seed", { method: "POST" });

    if (response.success) {
      // Reload tasks after seeding
      await loadTasks();
    }
  }
  catch (error) {
    console.error("Error seeding tasks:", error);
  }
  finally {
    seeding.value = false;
  }
}

async function submitPaymentRequest() {
  try {
    submitting.value = true;

    // Validate mobile number
    if (!/^01\d{9}$/.test(paymentForm.value.mobileNumber)) {
      console.error("Invalid mobile number format");
      return;
    }

    // Use the computed GitHub username
    const formData = {
      mobileNumber: paymentForm.value.mobileNumber,
      paymentMethod: paymentForm.value.paymentMethod,
      githubId: githubUsername.value,
    };

    const response = await $fetch("/api/payment-request", {
      method: "POST",
      body: formData,
    });

    if (response.success) {
      console.log("Payment request submitted successfully! Admin will verify and process your payment.");
      showPaymentForm.value = false;
      paymentForm.value = { mobileNumber: "", paymentMethod: "", githubId: "" };
      // Reload payment request status
      await loadPaymentRequestStatus();
    }
  }
  catch (error) {
    console.error("Error submitting payment request:", error);
  }
  finally {
    submitting.value = false;
  }
}

// Lifecycle
onMounted(async () => {
  // Initialize auth store
  await authStore.init();
  // Load tasks and payment request status
  await Promise.all([loadTasks(), loadPaymentRequestStatus()]);
});
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-4xl font-bold mb-8 text-center">
      Task Dashboard
    </h1>

    <!-- Seed Tasks Button (for development) -->
    <div v-if="tasks.length === 0 && !loading" class="text-center mb-6">
      <button
        class="btn btn-secondary"
        :disabled="seeding"
        @click="seedTasks"
      >
        <span v-if="seeding" class="loading loading-spinner loading-sm" />
        {{ seeding ? 'Adding Tasks...' : 'Add Sample Tasks' }}
      </button>
    </div>

    <!-- OAuth Scope Notice -->
    <!-- <div class="alert alert-warning mb-6">
      <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
      </svg>
      <div>
        <h3 class="font-bold">
          GitHub Permissions
        </h3>
        <p class="text-sm">
          If you encounter permission errors, you may need to
          <a href="/sign-out" class="link link-primary">sign out and sign in again</a>
          to grant the required GitHub permissions for starring repositories and following users.
        </p>
      </div>
    </div> -->

    <!-- Task List -->
    <div v-if="!showPaymentForm" class="space-y-6">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-4">
            Complete Tasks to Earn Money
          </h2>

          <div v-if="loading" class="flex flex-col items-center justify-center py-8">
            <span class="loading loading-spinner loading-lg text-primary" />
            <p class="mt-4 text-base-content/70">
              Loading tasks...
            </p>
          </div>

          <div v-else-if="tasks.length === 0" class="text-center py-8">
            <p class="text-base-content/70">
              No tasks available at the moment.
            </p>
          </div>

          <div v-else class="space-y-4">
            <div
              v-for="task in tasks"
              :key="task.id"
              class="card bg-base-200 hover:shadow-lg transition-shadow"
            >
              <div class="card-body">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <h3 class="font-semibold text-base-content">
                      {{ task.description }}
                    </h3>
                    <p class="text-sm text-base-content/70 mt-1">
                      {{ task.type === 'repo' ? 'Repository' : 'User' }}:
                      <a
                        :href="task.type === 'repo' ? `https://github.com/${task.target}` : `https://github.com/${task.target}`"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-primary hover:text-primary-focus underline transition-colors"
                      >
                        {{ task.target }}
                      </a>
                    </p>
                  </div>

                  <div class="flex items-center gap-3">
                    <div
                      v-if="completedTasks.includes(task.id)"
                      class="badge badge-success gap-2"
                    >
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                      Completed
                    </div>

                    <div
                      v-else-if="isTaskCompletedOnGitHub(task.id)"
                      class="badge badge-info gap-2"
                    >
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                      </svg>
                      Already {{ task.action === 'star' ? 'Starred' : 'Following' }}
                    </div>

                    <button
                      v-else
                      class="btn btn-primary"
                      @click="completeTask(task)"
                    >
                      {{ task.action === 'star' ? '⭐ Star' : '👥 Follow' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress Summary -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h3 class="card-title text-xl mb-4">
            Progress
          </h3>
          <div class="space-y-4">
            <div class="flex justify-between text-sm">
              <span>Completed</span>
              <span>{{ totalCompletedCount }} / {{ tasks.length }}</span>
            </div>
            <progress
              class="progress progress-primary w-full"
              :value="progressPercentage"
              max="100"
            />
          </div>

          <div v-if="allTasksCompleted && !hasSubmittedPaymentRequest" class="alert alert-success mt-4">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <div>
              <h3 class="font-bold">
                All tasks completed!
              </h3>
              <p class="text-sm">
                You can now submit your payment request.
              </p>
            </div>
            <button
              class="btn btn-success"
              @click="showPaymentForm = true"
            >
              Submit Payment Request
            </button>
          </div>

          <div v-if="allTasksCompleted && hasSubmittedPaymentRequest" class="alert alert-info mt-4">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <div>
              <h3 class="font-bold">
                Payment Request Submitted!
              </h3>
              <p class="text-sm">
                Please wait a few hours to maybe days to get your rewards. We'll process your payment request as soon as possible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Request Form -->
    <div v-if="showPaymentForm" class="max-w-md mx-auto">
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl mb-6">
            Payment Request Form
          </h2>

          <form class="space-y-4" @submit.prevent="submitPaymentRequest">
            <div class="form-control">
              <label for="mobileNumber" class="label">
                <span class="label-text">Mobile Number</span>
              </label>
              <input
                id="mobileNumber"
                v-model="paymentForm.mobileNumber"
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
                v-model="paymentForm.paymentMethod"
                class="select select-bordered"
                required
              >
                <option value="">
                  Select payment method
                </option>
                <option value="GP">
                  GP (Grameenphone)
                </option>
                <option value="BL">
                  BL (Banglalink)
                </option>
                <option value="Robi">
                  Robi
                </option>
                <option value="Airtel">
                  Airtel
                </option>
                <option value="Teletalk">
                  Teletalk
                </option>
                <option value="bKash">
                  bKash
                </option>
                <option value="Nagad">
                  Nagad
                </option>
                <option value="Rocket">
                  Rocket
                </option>
              </select>
            </div>

            <!-- Hidden input for GitHub username -->
            <input
              type="hidden"
              :value="githubUsername"
            >

            <!-- Display GitHub username -->
            <div class="form-control">
              <label class="label">
                <span class="label-text">GitHub Name</span>
              </label>
              <div class="input input-bordered bg-base-200 text-base-content/70">
                {{ githubUsername || 'Loading...' }}
              </div>
              <label class="label">
                <span class="label-text-alt">Automatically detected from your GitHub account</span>
              </label>
            </div>

            <div class="flex gap-3 pt-4">
              <button
                type="button"
                class="btn btn-outline flex-1"
                @click="showPaymentForm = false"
              >
                Back
              </button>
              <button
                type="submit"
                :disabled="submitting"
                class="btn btn-primary flex-1"
              >
                <span v-if="submitting" class="loading loading-spinner loading-sm" />
                {{ submitting ? 'Submitting...' : 'Submit Request' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
