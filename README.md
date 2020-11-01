# dev-template

Template to start a new web-application (Docker+Rollup+Typescript)!

## Contents

- Server/Client
- Docker
  - node:latest
  - nginx:latest
- Express
- TSLint + Prettier
- Recommended VSCode-extensions
- VSCode debugging
- Rollup
- WebSocket channel
- i18n via ttag

## Start development

Provide a **secrets.json** file with the necessary parameters to run the application (see minimum options):

      {
         "port": 3001,
         "portWebSocket": 8080,
         "prodPath": "/app/build/dist/prod/"
      }

### Either start by using terminals extension

    Cmd+Shift+P

    Terminals:Run

### or start the processes manually

Starting devenv

    npm run devenv

### open the website

    http://localhost
