import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        history: resolve(__dirname, 'history.html'),
        users: resolve(__dirname, 'users.html'),
        addDevice: resolve(__dirname, 'addDevice.html'),
        editDevice: resolve(__dirname, 'editDevice.html'),
        editUser: resolve(__dirname, 'editUser.html'),
      }
    }
  }
});