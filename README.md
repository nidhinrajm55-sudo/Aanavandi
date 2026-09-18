# 🌴 Kerala Care Net (Aanavandi)

> **A 3D Interactive Hyper-Local Community Care Network for Kerala's Single-Living Elders**

[![Next.js](https://img.shields.io/badge/Framework-Next.js%2016-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MapLibre GL](https://img.shields.io/badge/Map-MapLibre%203D%20Globe-teal?style=flat-square)](https://maplibre.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 📌 The Problem

Kerala faces a unique demographic challenge:
1. **High Aging Population**: Kerala has the highest proportion of elderly citizens in India (over 16% and growing).
2. **Mass Overseas Migration**: Millions of working-age Keralites live in the Gulf (GCC), Europe, and North America, leaving elderly parents living alone in family homes across rural and semi-urban panchayats.
3. **Emergency Blind Spots**: When routine health anomalies, missed medication, or falls occur, overseas family members are helpless, and traditional medical services are only called after critical delays.

---

## 💡 The Solution: Kerala Care Net

**Kerala Care Net** bridges the distance by combining passive non-intrusive monitoring with Kerala's existing strong community structures: **Neighborhood Friends, ASHA Health Workers, and Kudumbashree Units**.

### Key Innovations:
- **3D Living Kerala Care Map**: A interactive satellite globe displaying real-time care nodes across all 14 districts of Kerala (Pathanamthitta, Trivandrum, Ernakulam, Thrissur, Kozhikode, Wayanad, Kottayam, Alappuzha, Kollam, Kannur, Palakkad, Malappuram, Idukki, Kasaragod).
- **3-Tier Escalation Ladder**:
  1. **Tier 1 (Within 200m)**: Local trusted neighbor dispatched for immediate physical check-in (15-20 min SLA).
  2. **Tier 2 (Panchayat level)**: Government ASHA Health Worker escalation for medical verification.
  3. **Tier 3 (Global)**: Direct automated notification & status updates to overseas family members in Dubai/Sharjah.
- **Passive Vitals & Zero-Intrusion Tracking**: Integrates smart pillboxes, BP monitors, and ambient kettle/motion sensors to detect deviations without requiring elders to operate complex apps.
- **Real-Time SOS Camera Fly-To**: Instant emergency broadcast pinpointing live location on the 3D terrain map.

---

## 🚀 Interactive Portal Features

| Module | Description | Target User |
| :--- | :--- | :--- |
| **3D Care Map (Landing Page)** | Satellite globe view of Kerala wards with 28 live elder nodes & quick verification actions | Operations & Community Coordinators |
| **Ward Hub (`/ward`)** | Panchayat ward management, active concern scores, and ASHA worker task lists | Ward Members & Health Officials |
| **Neighbor Care (`/neighbor`)** | One-tap emergency check-in verification, WhatsApp contact, and dispatch flow | Local Volunteer Neighbors |
| **Authorized Dossier (`/elder-profile-escalation`)** | Deep medical baselines, contact ladders, passive vitals timeline, and care logs | Doctors & Care Managers |
| **Family View (`/family`)** | Live peace-of-mind dashboard for NRKs (Non-Resident Keralites) overseas | Gulf / NRI Family Members |

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 16 (App Router, Turbopack, React 19)
- **Styling**: Tailwind CSS & Custom Modern Aesthetics
- **3D Visualization**: MapLibre GL 3D Globe with Satellite Imagery (Esri World Imagery & OpenStreetMap)
- **State Management**: Local Reactive Care Store & API Endpoints
- **Deployment**: Vercel Cloud Platform

---

## ⚙️ Getting Started

### Prerequisites
- Node.js 18.x or 20.x or newer
- npm / pnpm / yarn

### Installation & Local Setup

```bash
# Clone repository
git clone https://github.com/nidhinrajm55-sudo/Aanavandi.git
cd Aanavandi

# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the 3D Kerala Care Map landing page.

### Build Verification

```bash
# Type check TypeScript files
npm run typecheck

# Production build
npm run build
```

---

## 🗺️ District Coverage (28 Active Elder Nodes)

Kerala Care Net currently covers 28 detailed care nodes across all 14 districts of Kerala:
- **Pathanamthitta**: Ward 4 Kozhencherry (Ammini Amma, K.P. Mathew, Devaki Amma, Varghese Cherian)
- **Thiruvananthapuram**: Ward 12 Kowdiar (Dr. K. Radhakrishnan, Kamala Devi)
- **Ernakulam / Kochi**: Ward 15 Kakkanad (Mariamma Joseph, Sebastian Varghese)
- **Thrissur**: Ward 7 Swaraj Round (P.V. Menon, Sarojini Amma)
- **Kozhikode**: Ward 9 Beach Road (Moideen Koya, Fatima Beevi)
- **Wayanad**: Ward 6 Kalpetta (Captain Raman Nair, Eliyamma Varghese)
- **Kottayam**: Ward 8 Kumarakom (K.C. Chacko)
- **Alappuzha**: Ward 10 Kalarcode (Karthyayani Amma)
- **Kollam**: Ward 11 Asramam (Janardhanan Pillai)
- **Kannur**: Ward 14 Talap (K.V. Raghavan, Leela Nambiar)
- **Palakkad**: Ward 2 Chittur (Subramanian Iyer, Lakshmi Amma)
- **Malappuram**: Ward 4 Manjeri (Aisha Beevi, Usman Haji)
- **Idukki**: Ward 3 Munnar (Thomas Mathew, Pennamma Joseph)
- **Kasaragod**: Ward 1 Nileshwar (B. Madhavan Nair, Suhara Umma)

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.
