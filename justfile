import? 'justfile.local'

login:
    npm login

build:
    bun turbo run build

# Publish package to npm (Run this after login)
publish:
    bun turbo run publish

[parallel]
ci: lint format test

lint:
    bun biome lint

format:
    bun biome format

typecheck:
    bun turbo run typecheck

test:
    bun turbo run test
