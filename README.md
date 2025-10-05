
---

# HLS Player - Frontend

Check out the live demo: `[Add your deployed URL here]`

---

## Overview

HLS Player is a React-based frontend for streaming and managing videos in **HLS (HTTP Live Streaming) format**. It integrates with a backend service for video processing, uploads, and deletion. Users can authenticate via **Clerk**, upload videos, view a gallery of previously uploaded videos, and play them using **Video.js HLS player**.

---

## Highlights

* 🔐 **Clerk Authentication** (sign in/out support)
* 🎬 **Video Upload** with drag-and-drop or file selection
* 📁 **Video Gallery**: View, refresh, and delete uploaded videos
* ⚡ **Real-time Updates** for video operations
* 🎨 **Clean UI** built with React, Tailwind CSS, and DaisyUI
* 🧰 **Developer Tools**: Load test videos or paste API responses for testing
* 🖥️ **Video Playback** using Video.js HLS player
* 📝 **Metadata Display**: View master playlist, variant URLs, video ID, and path

---

## Features

### 1. Authentication

* Sign in using Clerk authentication.
* Shows user button when signed in.
* Prompts sign-in for guests.

### 2. Video Upload

* Drag-and-drop or select video file.
* Supported formats: MP4, MOV, MKV.
* Upload progress indicator with spinner.
* Upload response returned immediately; background processing continues in backend.

### 3. Video Gallery

* Lists all uploaded videos grouped by folder.
* Refresh button to reload latest videos.
* Play video using HLS player.
* Delete video functionality with loading indicators.

### 4. Developer/Testing Tools

* Developer modal to load **test video** or paste **API responses** for testing.
* Quickly simulate frontend behavior with backend HLS responses.

### 5. Video Player

* Video.js HLS Player embedded for playback.
* Master playlist and variant URLs displayed for reference.
* Copy-to-clipboard buttons for sharing URLs.
* Supports multiple resolutions (360p, 480p, 720p, etc.).

---

## Tech Stack

* **Frontend:** React, Tailwind CSS, DaisyUI, Video.js
* **Authentication:** Clerk
* **State Management:** React hooks & local component state
* **Video Streaming:** HLS via Video.js
* **File Uploads:** HTML file input & drag-and-drop
* **HTTP Client:** Axios