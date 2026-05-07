// Jest setup provided by Grafana scaffolding
import './.config/jest-setup';

class TestIntersectionObserver {
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
}

global.IntersectionObserver ??= TestIntersectionObserver;
