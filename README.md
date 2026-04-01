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

Install `pbiviz` globally if needed:

```bash
npm install -g powerbi-visuals-tools
```

## Getting Started

Install dependencies:

```bash
npm install
```

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
