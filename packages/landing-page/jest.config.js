const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: __dirname,
});

const customJestConfig = {
  displayName: '@retex-web/landing-page',
  rootDir: __dirname,
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/next/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: 'test-output/jest/coverage',
};

// O `next/jest` reescreve o `transformIgnorePatterns`, por isso não basta
// declará-lo acima: temos de o ajustar depois de ele montar a configuração.
// next-intl/use-intl são publicados apenas em ESM e precisam de passar pelo
// transform, senão o jest rebenta em `export`.
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();

  return {
    ...config,
    transformIgnorePatterns: [
      ...(config.transformIgnorePatterns ?? []).filter(
        (pattern) => !pattern.includes('node_modules')
      ),
      '/node_modules/(?!(next-intl|use-intl|intl-messageformat|@formatjs)/)',
    ],
  };
};
