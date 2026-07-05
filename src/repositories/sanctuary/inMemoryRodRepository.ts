import type { Rod, RodCraftJob, FishingRodId } from "@/src/domain/sanctuary";
import {
  ROD_CATALOG,
  ROD_CRAFT_COSTS,
  advanceRodCraftJob,
  createRodInstance,
  investStoredWonderForRod,
  startRodCraftJob,
} from "@/src/domain/sanctuary";
import type { RodRepository } from "./interfaces";
import { createInMemoryWonderRepository } from "./inMemoryWonderRepository";

type RodStore = {
  rods: Map<string, Rod[]>;
  jobs: Map<string, RodCraftJob[]>;
};

const store: RodStore = {
  rods: new Map(),
  jobs: new Map(),
};

function jobId() {
  return `rod_job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function defaultRodsForUser(userId: string): Rod[] {
  return (Object.keys(ROD_CATALOG) as FishingRodId[]).map((rodId) =>
    createRodInstance(rodId, rodId === "basic" ? "ready" : "locked"),
  );
}

export function createInMemoryRodRepository(
  wonderRepo = createInMemoryWonderRepository(),
): RodRepository {
  return {
    async listRods(userId) {
      if (!store.rods.has(userId)) {
        store.rods.set(userId, defaultRodsForUser(userId));
      }
      return store.rods.get(userId) ?? [];
    },
    async saveRod(userId, rod) {
      const rods = await this.listRods(userId);
      const idx = rods.findIndex((r) => r.id === rod.id);
      if (idx >= 0) rods[idx] = rod;
      else rods.push(rod);
      store.rods.set(userId, rods);
    },
    async startCraft(userId, rodId) {
      const account = await wonderRepo.getAccount(userId);
      const cost = ROD_CRAFT_COSTS[rodId];
      const { account: next } = investStoredWonderForRod(
        account,
        jobId(),
        cost.storedWonder,
        rodId,
      );
      await wonderRepo.saveAccount(next);

      const job = startRodCraftJob(userId, jobId(), rodId);
      const jobs = store.jobs.get(userId) ?? [];
      jobs.push(job);
      store.jobs.set(userId, jobs);

      const rods = await this.listRods(userId);
      const rod = rods.find((r) => r.id === rodId);
      if (rod) {
        await this.saveRod(userId, {
          ...rod,
          state: "crafting",
          storedWonderInvested: cost.storedWonder,
        });
      }
      return job;
    },
    async collectCraft(userId, jobIdValue) {
      const jobs = (store.jobs.get(userId) ?? []).map((j) => advanceRodCraftJob(j));
      store.jobs.set(userId, jobs);
      const job = jobs.find((j) => j.id === jobIdValue);
      if (!job || job.status !== "ready_to_collect") {
        throw new Error("Craft job not ready");
      }
      job.status = "cancelled";
      const rods = await this.listRods(userId);
      const rod = rods.find((r) => r.id === job.rodId);
      if (!rod) throw new Error("Rod not found");
      const ready = { ...rod, state: "ready" as const, dullnessCount: 0 };
      await this.saveRod(userId, ready);
      return ready;
    },
  };
}

export function resetInMemoryRodStore() {
  store.rods.clear();
  store.jobs.clear();
}
