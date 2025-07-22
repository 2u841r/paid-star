<script setup>
import { computed } from "vue";

const props = defineProps({
  task: {
    type: Object,
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
});

defineEmits(["complete"]);

const githubUrl = computed(() => {
  return `https://github.com/${props.task.target}`;
});

const isCompleted = computed(() => {
  return props.completedTasks.includes(props.task.id);
});

const isAlreadyDone = computed(() => {
  const status = props.githubStatus[props.task.id];
  if (!status)
    return false;
  return status.starred === true || status.followed === true;
});
</script>

<template>
  <div class="card bg-base-200 hover:shadow-lg transition-shadow">
    <div class="card-body">
      <div class="flex items-center justify-between">
        <div class="flex-1">
          <h3 class="font-semibold text-base-content">
            {{ task.description }}
          </h3>
          <p class="text-sm text-base-content/70 mt-1">
            {{ task.type === 'repo' ? 'Repository' : 'User' }}:
            <a
              :href="githubUrl"
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
            v-if="isCompleted"
            class="badge badge-success gap-2"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clip-rule="evenodd"
              />
            </svg>
            Completed
          </div>

          <div
            v-else-if="isAlreadyDone"
            class="badge badge-info gap-2"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clip-rule="evenodd"
              />
            </svg>
            Already {{ task.action === 'star' ? 'Starred' : 'Following' }}
          </div>

          <button
            v-else
            class="btn btn-primary"
            @click="$emit('complete', task)"
          >
            {{ task.action === 'star' ? '⭐ Star' : '👥 Follow' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
