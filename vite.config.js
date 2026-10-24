import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rolldownOptions: {
      onwarn(warning, defaultHandler) {
        // React client directives are not needed in this client-only Vite app.
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        defaultHandler(warning);
      },
      output: { codeSplitting: { groups: [
        { name: 'mui', test: /node_modules[\\/]@mui[\\/]/ },
        { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
      ] } },
    },
  },
});
