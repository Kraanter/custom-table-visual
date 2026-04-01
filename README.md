# Custom Table Power BI Visual

This repository contains a custom Power BI visual named **Custom Table**.

## Overview

- Visual name: `CustomTable`
- Display name: `Custom Table`
- API version: `5.1.0`
- Description: Custom table visual with configurable width settings

## Prerequisites

- Node.js 18+ (recommended)
- npm
- Power BI visuals tools (`pbiviz`)
- Git
- Visual Studio Code (VS Code)

Install `pbiviz` globally if needed:

```bash
npm install -g powerbi-visuals-tools
```

## Getting Started

Clone this repository from GitHub:

```bash
git clone https://github.com/Kraanter/custom-table-visual
```

Open the project folder:

```bash
cd pbiCustomTable
```

Install dependencies:

```bash
npm install
```

## VS Code Setup (Basic)

Open the project in VS Code:

```bash
code .
```

Recommended extensions:

- ESLint
- Prettier - Code formatter

Useful first-time setup in VS Code:

- Open the integrated terminal (`Terminal` -> `New Terminal`)
- Run `npm install` if not already done
- Run `npm run start` to start local development
- Optional: run `npm run lint` before committing changes

Start the local development server:

```bash
npm run start
```

Package the visual:

```bash
npm run package
```

Run lint checks:

```bash
npm run lint
```

## Project Structure

- `src/` - TypeScript source files for the visual
- `style/` - LESS styling for the visual
- `capabilities.json` - Data roles and visual capabilities
- `pbiviz.json` - Visual metadata and build settings
