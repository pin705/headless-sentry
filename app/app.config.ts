// file: app.config.ts

export default defineAppConfig({
  ui: {
    colors: {
      primary: 'black',
      // secondary: 'purple',
      // success: 'green',
      // info: 'blue',
      // warning: 'yellow',
      // error: 'red',
      neutral: 'zinc'
    },
    modal: {
      slots: {
        content: 'sm:max-w-xl md:max-w-2xl lg:max-w-3xl',
        footer: 'justify-end'
      }
    }
  }
})
