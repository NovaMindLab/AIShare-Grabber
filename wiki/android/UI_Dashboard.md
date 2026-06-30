# Android Transfer Console Dashboard UI

This document describes the redesigned file sync dashboard (`transfer_console_view.dart`) including layout, tab structure, and interaction model.

---

## 🎨 Overall Layout

The Transfer Console (`AppState.connected`) is a full-screen dark UI:

```
+-------------------------------------------+
|        Top Status Header (connection info)  |
+-------------------------------------------+
|  Active Transfer Progress Bar (if sending) |  ← Only visible during transfer
+-------------------------------------------+
|  [📸 Media] [🎵 Music] [📄 Docs] [📥 Queue] |  ← TabBar (sub-category selector)
+-------------------------------------------+
|                                           |
|         Tab Content Area                  |  ← Scrollable per tab
|         (GridView or ListView)            |
|                                           |
|               ( 发送 (N) )                |  ← Floating Action Button (FAB)
|                                           |  ← Only visible when items are selected
+-------------------------------------------+
```

**Removed** from previous design:
- Speed metrics cards ("Transfer Speed KB/s", "Sync Progress X/Y")
- Tab selector row switching between "Gallery" and "Connection Logs"
- Connection log console view
- Persistent bottom transmit bar (replaced with dynamic FAB)

---

## 📑 Tab Descriptions

### 📸 Media Tab (default)

Displays all photo and video assets from the device gallery using `photo_manager`.

- **Layout**: 3-column `GridView` with `AssetEntityImage` thumbnails
- **Videos**: Overlaid with a ▶ play icon and duration badge (e.g., `01:45`)
- **Selection**: Tap any item to toggle selection. Selected items show:
  - Purple border (`Color(0xFF8B5CF6)`)
  - Purple tint overlay
  - Circular ✓ checkmark badge (top-right)
- **Transfer status badges** (bottom-right of cell, shown after sending):
  - ⏳ Pending → 🔄 Transferring → ✅ Completed / ❌ Failed

### 🎵 Music Tab

Automatically queries and displays music files from the device MediaStore.

- Shows track titles, duration badges, and music emojis.
- Tap any item to toggle selection (shows purple background tint, border, and checkmark).
- Displays inline transfer status badges (⏳ Pending, 🔄 Transferring, ✅ Completed, ❌ Failed) next to the checkmark.

### 📄 Docs Tab

Allows picking any non-media file (documents, archives, etc.) using `file_picker`.

- Shows picked files as list items with 📄 icon, filename, and file size.
- "Select Document Files" button opens unrestricted file picker.
- Per-item ✕ remove button.

### 📥 Queue Tab

Aggregates all currently selected assets across all other tabs:

```
MEDIA ALBUM ASSETS (N)
  🖼️ IMG_1234.jpg — Photo
  🎥 VID_5678.mp4 — Video (02:30)

SELECTED MUSIC (N)
  🎵 song.mp3 — Audio (04:12)

CUSTOM STORAGE FILES (N)
  📄 report.pdf — 1.1 MB
```

- Tap ✕ on any item to deselect/remove it.
- Empty state shows a placeholder with instructions.

---

## 🔘 Transmit Button (FAB)

The Transmit Button is implemented as an extended Floating Action Button (FAB). It is **only visible when at least one item is selected** (`totalCount > 0`).

- **Label**: `发送 (N)` where N is the total selected count.
- **Enabled State**: Enabled while not transmitting; disabled during active transfer (`activeTransferName == null`).
- **Trigger**: Calls `viewModel.syncAllSelected()` which processes selected media, audios, and files sequentially.

---

## 🏗️ Key Widgets

| Widget | Description |
|---|---|
| `Scaffold` | Container containing the status header, tab bar contents, and the floating action button. |
| `_buildMediaGridContent` | 3-col GridView of `AssetEntity` with selection/status overlays. |
| `_buildMusicPickerContent` | ListView of MediaStore audio items with checkmark toggling. |
| `_buildDocPickerContent` | ListView of document `PlatformFile` items picked via FilePicker. |
| `_buildQueueListContent` | Aggregated list of selected media, audio, and picked documents. |
| `_buildListFileItem` | Shared row item UI (emoji, name, size, ✕ button). |
| `_buildActiveTransferBanner` | Progress bar shown only during an active transfer. |
| `_buildTopStatusHeader` | Connection status header with animated pulse indicator. |
| `_formatDuration` | Converts `int seconds` → `"MM:SS"` string. |

---

## 🎨 Design Tokens

| Token | Value | Usage |
|---|---|---|
| Background | `#090D16` | Scaffold background |
| Surface | `#0F172A` | Cards, tab bar, bottom bar |
| Border | `#1E293B` | Card outlines |
| Accent | `#8B5CF6` | Selection, progress, active labels |
| Text primary | `#FFFFFF` | Item names |
| Text secondary | `#64748B` | Sizes, subtitles, section headers |
| Danger | `#EF4444` | Delete buttons |
| Success | `#10B981` | Completed transfer badges |
