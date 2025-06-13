import? 'justfile.local'

login:
    npm login

# Publish package to npm (Run this after login)
publish:
    bun turbo run publish
