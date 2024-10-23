// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        event: resolve(__dirname, 'event/index.html'),
        create: resolve(__dirname, 'create/index.html'),
        attendance: resolve(__dirname, 'attendance/index.html'),
        ticket: resolve(__dirname, 'ticket/index.html'),
      },
    },
  },
})