<script setup>
definePageMeta({ middleware: "admin" });

const requests = ref([]);
const loading = ref(true);
const saving = ref(null); // id of the row being saved

async function load() {
  loading.value = true;
  try {
    const res = await $fetch("/api/admin/payment-requests");
    requests.value = res.requests.map(r => ({
      ...r,
      _status: r.status,
      _txnId: r.txnId ?? "",
      _adminNotes: r.adminNotes ?? "",
    }));
  }
  finally {
    loading.value = false;
  }
}

async function save(req) {
  saving.value = req.id;
  try {
    await $fetch(`/api/admin/payment-requests/${req.id}`, {
      method: "PATCH",
      body: {
        status: req._status,
        txnId: req._txnId,
        adminNotes: req._adminNotes,
      },
    });
    req.status = req._status;
    req.txnId = req._txnId;
    req.adminNotes = req._adminNotes;
    if (req._status === "paid") req.paidAt = Date.now();
    if (req._status === "verified") req.verifiedAt = Date.now();
  }
  finally {
    saving.value = null;
  }
}

function isDirty(req) {
  return (
    req._status !== req.status
    || req._txnId !== (req.txnId ?? "")
    || req._adminNotes !== (req.adminNotes ?? "")
  );
}

const statusColors = {
  pending: "badge-warning",
  verified: "badge-info",
  paid: "badge-success",
  rejected: "badge-error",
};

onMounted(load);
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-6">
      Admin — Payout Requests
    </h1>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div v-else-if="requests.length === 0" class="text-center py-12 opacity-60">
      No payment requests yet.
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="req in requests"
        :key="req.id"
        class="card bg-base-100 shadow"
      >
        <div class="card-body gap-3">
          <!-- Header row -->
          <div class="flex flex-wrap items-center gap-3">
            <span class="font-semibold text-lg">{{ req.userName }}</span>
            <span class="text-sm opacity-60">{{ req.userEmail }}</span>
            <span :class="['badge', statusColors[req.status] ?? 'badge-ghost']">
              {{ req.status }}
            </span>
            <span class="text-xs opacity-50 ml-auto">
              Requested: {{ new Date(req.requestedAt).toLocaleString() }}
            </span>
          </div>

          <!-- Submitted info -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
            <div>
              <div class="opacity-60 text-xs">Mobile</div>
              <div class="font-mono font-medium">{{ req.mobileNumber }}</div>
            </div>
            <div>
              <div class="opacity-60 text-xs">Method</div>
              <div class="font-medium">{{ req.paymentMethod }}</div>
            </div>
            <div>
              <div class="opacity-60 text-xs">GitHub</div>
              <div class="font-medium">{{ req.githubId }}</div>
            </div>
            <div>
              <div class="opacity-60 text-xs">Paid At</div>
              <div>{{ req.paidAt ? new Date(req.paidAt).toLocaleString() : "—" }}</div>
            </div>
          </div>

          <div class="divider my-0" />

          <!-- Admin controls -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="form-control">
              <label class="label py-0">
                <span class="label-text text-xs">Status</span>
              </label>
              <select v-model="req._status" class="select select-bordered select-sm">
                <option value="pending">pending</option>
                <option value="verified">verified</option>
                <option value="paid">paid</option>
                <option value="rejected">rejected</option>
              </select>
            </div>

            <div class="form-control">
              <label class="label py-0">
                <span class="label-text text-xs">Transaction ID</span>
              </label>
              <input
                v-model="req._txnId"
                type="text"
                placeholder="TXN123..."
                class="input input-bordered input-sm"
              >
            </div>

            <div class="form-control">
              <label class="label py-0">
                <span class="label-text text-xs">Admin Notes</span>
              </label>
              <input
                v-model="req._adminNotes"
                type="text"
                placeholder="Optional note..."
                class="input input-bordered input-sm"
              >
            </div>
          </div>

          <div class="flex justify-end">
            <button
              class="btn btn-primary btn-sm"
              :disabled="!isDirty(req) || saving === req.id"
              @click="save(req)"
            >
              <span v-if="saving === req.id" class="loading loading-spinner loading-xs" />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
