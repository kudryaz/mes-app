# React + TypeScript + Vite

Этот шаблон предоставляет минимальную настройку для запуска React с Vite, включая HMR (горячую замену модулей) и некоторые правила ESLint.

## Доступные официальные плагины

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) использует [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) использует [SWC](https://swc.rs/)

## React Компилятор

React Компилятор не включён в этот шаблон из-за его влияния на производительность разработки и сборки. Чтобы добавить его, обратитесь к [документации](https://react.dev/learn/react-compiler/installation).

## Расширение конфигурации ESLint

Если вы разрабатываете production-приложение, рекомендуется обновить конфигурацию для включения правил линтинга с проверкой типов:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Другие конфигурации...

      // Удалите tseslint.configs.recommended и замените на это
      tseslint.configs.recommendedTypeChecked,
      // Или используйте это для более строгих правил
      tseslint.configs.strictTypeChecked,
      // Опционально, добавьте это для стилистических правил
      tseslint.configs.stylisticTypeChecked,

      // Другие конфигурации...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // другие опции...
    },
  },
])
