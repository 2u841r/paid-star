<!-- pages/dashboard.vue -->
<script setup>
import { computed, onMounted, ref } from "vue";

import PaymentForm from "~/components/payment-form.vue";
import ProgressCard from "~/components/progress-card.vue";
import TaskList from "~/components/task-list.vue";

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
const loadingTasks = ref(new Set()); // Track which tasks are loading

// Computed properties
const githubUsername = computed(() => {
  if (!authStore.user)
    return "";

  if (authStore.user.name) {
    return authStore.user.name;
  }

  if (
    authStore.user.email
    && authStore.user.email.includes("@users.noreply.github.com")
  ) {
    return authStore.user.email.split("@")[0];
  }

  return "";
});

const progressPercentage = computed(() => {
  if (tasks.value.length === 0)
    return 0;

  const totalCompleted = tasks.value.reduce((count, task) => {
    const isCompleted
      = completedTasks.value.includes(task.id)
        || isTaskCompletedOnGitHub(task.id);
    return count + (isCompleted ? 1 : 0);
  }, 0);

  return Math.round((totalCompleted / tasks.value.length) * 100);
});

const allTasksCompleted = computed(() => {
  if (tasks.value.length === 0)
    return false;

  return tasks.value.every(
    task =>
      completedTasks.value.includes(task.id)
      || isTaskCompletedOnGitHub(task.id),
  );
});

const totalCompletedCount = computed(() => {
  return tasks.value.reduce((count, task) => {
    const isCompleted
      = completedTasks.value.includes(task.id)
        || isTaskCompletedOnGitHub(task.id);
    return count + (isCompleted ? 1 : 0);
  }, 0);
});

const hasSubmittedPaymentRequest = computed(() => {
  return paymentRequestStatus.value?.hasPaymentRequest || false;
});

// Helper functions
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
    // Add task to loading set for immediate feedback
    loadingTasks.value.add(task.id);

    const response = await $fetch(`/api/tasks/${task.id}/complete`, {
      method: "POST",
    });

    if (response.success) {
      // Immediately update the completed tasks for instant feedback
      if (!completedTasks.value.includes(task.id)) {
        completedTasks.value.push(task.id);
      }

      if (response.manual) {
        console.error("Task completed manually due to GitHub API limitations");
      }
      else {
        console.error("Task completed successfully!");
      }

      // Refresh stats after a 2-second delay to allow GitHub API to update
      setTimeout(async () => {
        await loadTasks();
      }, 2000);
    }
  }
  catch (error) {
    console.error("Error completing task:", error);
  }
  finally {
    // Remove task from loading set
    loadingTasks.value.delete(task.id);
  }
}

async function seedTasks() {
  try {
    seeding.value = true;
    const response = await $fetch("/api/tasks/seed", { method: "POST" });

    if (response.success) {
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

async function submitPaymentRequest(formData) {
  try {
    submitting.value = true;

    if (!/^01\d{9}$/.test(formData.mobileNumber)) {
      console.error("Invalid mobile number format");
      return;
    }

    const response = await $fetch("/api/payment-request", {
      method: "POST",
      body: formData,
    });

    if (response.success) {
      console.error(
        "Payment request submitted successfully! Admin will verify and process your payment.",
      );
      showPaymentForm.value = false;
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
  await authStore.init();
  await Promise.all([loadTasks(), loadPaymentRequestStatus()]);
});
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-4xl font-bold mb-8 text-center">
      Task Dashboard
    </h1>

    <!-- Seed Tasks Button -->
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

    <!-- Main Content -->
    <div v-if="!showPaymentForm" class="space-y-6">
      <TaskList
        :tasks="tasks"
        :completed-tasks="completedTasks"
        :github-status="githubStatus"
        :loading="loading"
        :loading-tasks="loadingTasks"
        @complete-task="completeTask"
      />

      <ProgressCard
        :total-completed-count="totalCompletedCount"
        :total-tasks="tasks.length"
        :progress-percentage="progressPercentage"
        :all-tasks-completed="allTasksCompleted"
        :has-submitted-payment-request="hasSubmittedPaymentRequest"
        :is-updating="loadingTasks.size > 0"
        @show-payment-form="showPaymentForm = true"
      />
    </div>

    <!-- Payment Form -->
    <PaymentForm
      v-if="showPaymentForm"
      :github-username="githubUsername"
      :submitting="submitting"
      @submit="submitPaymentRequest"
      @cancel="showPaymentForm = false"
    />
  </div>
</template>
