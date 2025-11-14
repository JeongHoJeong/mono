import? 'justfile.local'

login:
    npm login

build:
    bun turbo run build

# Publish package to npm (Run this after login)
publish:
    bun turbo run publish

ci:
    bun turbo run ci

test:
    bun turbo run test
