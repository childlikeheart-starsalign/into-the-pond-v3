import assert from "node:assert/strict";
import { mock, test } from "node:test";

const store = new Map<string, string>();

mock.module("@react-native-async-storage/async-storage", {
  defaultExport: {
    getItem: async (key: string) => store.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: async (key: string) => {
      store.delete(key);
    },
  },
  namedExports: {
    default: {
      getItem: async (key: string) => store.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: async (key: string) => {
        store.delete(key);
      },
    },
  },
});

async function loadStorage() {
  store.clear();
  return import("@/src/services/onboarding/sanctuaryThemeStorage");
}

test("hasPlayedSanctuaryTheme is false until marked", async () => {
  const { hasPlayedSanctuaryTheme, markSanctuaryThemePlayed } = await loadStorage();
  assert.equal(await hasPlayedSanctuaryTheme("uid_a"), false);
  await markSanctuaryThemePlayed("uid_a");
  assert.equal(await hasPlayedSanctuaryTheme("uid_a"), true);
});

test("sanctuary theme played flag is per uid", async () => {
  const { hasPlayedSanctuaryTheme, markSanctuaryThemePlayed } = await loadStorage();
  await markSanctuaryThemePlayed("uid_a");
  assert.equal(await hasPlayedSanctuaryTheme("uid_a"), true);
  assert.equal(await hasPlayedSanctuaryTheme("uid_b"), false);
});
