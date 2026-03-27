# Productivity Suite - Master Plan

**Category:** Architecture
**Last Updated:** 2026-03-27
**Status:** Active
**Maintainer:** Productivity Team

---

## Quick Summary

A comprehensive, open-source web productivity suite deployed on Cloudflare Pages. Built CSR-first with edge-assisted sync, AI-native orchestration, and a unified document model that makes all apps composable views of the same underlying data graph.

## Vision

Build the "Palantir + Google Workspace + Figma + Notion + LibreOffice" of the browser — edge-first, AI-native, and fully open-source. The suite is an integral part of a larger WebOS vision.

## Core Architecture

### Platform-First Approach

Build the platform layer first, then mount applications as views on top of a unified document model. Everything (docs, sheets, slides, kanban, diagrams) becomes different views/editors of the same graph.

### Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | React 19 + Vite 6 | CSR-first, fast HMR, excellent Cloudflare Pages support |
| Language | TypeScript 5.7 | Type safety across entire codebase |
| State | Zustand + Yjs | Lightweight state + CRDT collaboration |
| Styling | Tailwind CSS 4 + CSS Variables | Utility-first with design tokens |
| Routing | React Router 7 | SPA routing, code-splitting |
| Rich Text | TipTap (ProseMirror) | Best-in-class extensible editor |
| Spreadsheet | TanStack Virtual + fast-formula-parser | Virtualized grid, MIT-licensed formula engine |
| Diagrams | React Flow | Purpose-built for node/edge editors |
| Design | Fabric.js | Canvas-based vector editor |
| Import/Export | SheetJS CE + Mammoth + pdf-lib | File I/O for all document types |
| Storage | IndexedDB + OPFS | Offline-first local storage |
| Sync | Yjs + Cloudflare Durable Objects | CRDT collaboration + room coordination |
| Metadata | Cloudflare D1 | Serverless SQL for tenants, permissions, versions |
| Files | Cloudflare R2 | Binary/blob storage |
| Jobs | Cloudflare Queues | Async imports, exports, AI tasks |
| Search | Cloudflare Vectorize | Semantic document search |
| Cache | Cloudflare KV | Metadata and session cache |
| Auth | Cloudflare Access / OAuth | Zero-infra auth |
| AI | Workers AI + AI Gateway + ZAI | Orchestrated multi-model AI |
| Deploy | Wrangler + Cloudflare Pages | Edge-first deployment |
| Package Manager | pnpm | Fast, efficient, great monorepo support |

### Critical Design Decisions

1. **One Document Model** — prevents fragmentation across apps
2. **CRDT-first** — enables real-time collaboration + offline editing
3. **App = View, not product** — everything becomes composable
4. **AI = system layer** — not a feature bolt-on

## Phases

### Phase 0: Foundation
App shell, routing, design system, project infrastructure, Cloudflare Pages deployment

### Phase 1: Core Engine
Universal document model, storage layer, CRDT sync, workspace manager

### Phase 2: Documents (Word Processor)
TipTap-based rich text editor with formatting, comments, export

### Phase 3: Spreadsheets
Grid engine, formula engine, cell rendering, basic charts

### Phase 4: Presentations
Slide editor, presenter mode, transitions, templates

### Phase 5: Diagrams & Flowcharts
Node/edge canvas, auto-layout, shape library, templates

### Phase 6: Projects (Notion-like)
Kanban boards, task management, databases, multiple views

### Phase 7: Designer (Figma-like)
Canvas-based vector design, layers, components, prototyping

### Phase 8: AI Orchestration
AI command palette, cross-app transformations, smart actions

### Phase 9: Collaboration & Sharing
Real-time sync via Durable Objects, permissions, comments, version history

### Phase 10: PWA & Offline
Full offline editing, installable app, background sync

### Phase 11: Polish & Ecosystem
Plugin SDK, template gallery, marketplace, extensions

## Contents

- [Architecture Details](./ARCHITECTURE.md)
- [Task Breakdown](./TASKS.md)
- [Progress Log](./PROGRESS.md)
