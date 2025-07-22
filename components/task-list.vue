<!-- components/TaskList.vue -->
<script setup>
import TaskCard from "./task-card.vue";

defineProps({
  tasks: {
    type: Array,
    required: true,
  },
  completedTasks: {
    type: Array,
    required: true,
  },
  githubStatus: {
    type: Object,
    required: true,
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["completeTask"]);
</script>

<template>
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
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          :completed-tasks="completedTasks"
          :github-status="githubStatus"
          @complete="$emit('completeTask', $event)"
        />
      </div>
    </div>
  </div>
</template>
