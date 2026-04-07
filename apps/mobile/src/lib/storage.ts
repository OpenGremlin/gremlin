// Use SecureStore on native, localStorage on web
let _getItem: (key: string) => Promise<string | null>;
let _setItem: (key: string, value: string) => Promise<void>;
let _deleteItem: (key: string) => Promise<void>;

if (process.env.EXPO_OS === "web") {
  _getItem = async (key) => localStorage.getItem(key);
  _setItem = async (key, value) => localStorage.setItem(key, value);
  _deleteItem = async (key) => localStorage.removeItem(key);
} else {
  // Lazy-load SecureStore only on native
  const SecureStorePromise = import("expo-secure-store");
  _getItem = async (key) => (await SecureStorePromise).getItemAsync(key);
  _setItem = async (key, value) =>
    (await SecureStorePromise).setItemAsync(key, value);
  _deleteItem = async (key) => (await SecureStorePromise).deleteItemAsync(key);
}

export const storage = {
  getItem: _getItem,
  setItem: _setItem,
  deleteItem: _deleteItem,
};
