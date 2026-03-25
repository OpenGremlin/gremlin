export default {
  addEventListener: () => () => {},
  fetch: () =>
    Promise.resolve({ isConnected: true, isInternetReachable: true }),
};
