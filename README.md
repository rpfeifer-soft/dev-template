# Development template

Template to start a new web-application (Docker+Rollup+Typescript)!

![GitHub package.json version](https://img.shields.io/github/package-json/v/rpfeifer-soft/dev-template)
![GitHub last commit](https://img.shields.io/github/last-commit/rpfeifer-soft/dev-template?style=plastic)
![GitHub Workflow Status](https://img.shields.io/github/workflow/status/rpfeifer-soft/dev-template/Node.js%20CI)

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
The options for debug-version lies in src/server-directory:
    {
        "port": 3001,
        "portWebSockets": 8080,
        "baseUrl": "http://localhost/",
        "prodPath": "/app/dist/prod/",
        "production": false
    }

### Either start by using terminals extension

    Cmd+Shift+P

    Terminals:Run

### or start the processes manually

Starting devenv

    npm run devenv

### open the website

    http://localhost
