# IMS25 Hackathon - Stundenplan Manager

Ein moderner Stundenplan-Manager für Studenten mit integrierter ÖV-Routenplanung, entwickelt im Rahmen des IMS25 Hackathons.

## 🎯 Projektübersicht

Diese Next.js-Anwendung ermöglicht es Studenten, ihren Stundenplan zu verwalten und automatisch ÖV-Verbindungen zu ihren Vorlesungen zu finden. Die App unterstützt den Import von ICS-Dateien und bietet eine intuitive Benutzeroberfläche für die Tagesplanung.

## ✨ Features

### 📅 Stundenplan-Management
- **ICS-Import**: Automatischer Import von Stundenplandateien (.ics)
- **Tagesansicht**: Übersichtliche Darstellung der Lektionen pro Tag
- **Navigation**: Einfache Navigation zwischen verschiedenen Tagen
- **Farbkodierung**: Individuelle Farben für verschiedene Veranstaltungen

### 👤 Benutzer-Management
- **Registrierung & Login**: Sichere Authentifizierung mit NextAuth.js
- **Profilverwaltung**: Speichern von Heimatadresse für automatische Routenplanung


## 🛠️ Technologie-Stack

### Frontend
- **Next.js 15.5.0** - React Framework mit App Router
- **React 19.1.0** - UI Library
- **TypeScript** - Typsichere Entwicklung
- **Tailwind CSS** - Utility-first CSS Framework
- **Lucide React** - Icon Library
- **Shadcn/UI** - Components

### Backend & Datenbank
- **Prisma** - ORM für Datenbankzugriff
- **SQLite** - Lokale Datenbank
- **NextAuth.js** - Authentifizierung
- **Next.js API Routes** - Backend-Endpunkte

### Externe APIs
- **SBB API** - ÖV-Verbindungen
- **ICS Parser** - Kalenderdatei-Verarbeitung

## 🚀 Installation & Setup

### Voraussetzungen
- Node.js 18+ 
- npm oder yarn

### 1. Repository klonen
```bash
git clone <repository-url>
cd ims25-hackathon-zeta-renuo
```

### 2. Dependencies installieren
```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren
Erstelle eine `.env` Datei im Root-Verzeichnis:
```env
DATABASE_URL="file:./prisma/dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dein-secret-key-hier"
```

### 4. Datenbank einrichten
```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Entwicklungsserver starten
```bash
npm run dev
```

Die Anwendung ist dann unter [http://localhost:3000](http://localhost:3000) verfügbar.

## 📁 Projektstruktur

```
ims25-hackathon-zeta-renuo/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentifizierungsseiten
│   ├── api/               # API Endpunkte
│   │   ├── auth/          # Auth API Routes
│   │   ├── events/        # Event Management
│   │   ├── ics/           # ICS Import
│   │   └── sbb/           # SBB API Integration
│   ├── dashboard/         # Hauptdashboard
│   └── settings/          # Benutzereinstellungen
├── components/            # React Komponenten
│   └── ui/               # UI Komponenten (shadcn/ui)
├── lib/                  # Utility Funktionen
│   ├── auth.ts           # NextAuth Konfiguration
│   ├── prisma.ts         # Prisma Client
│   └── locationMap.ts    # Adresszuordnung
├── prisma/               # Datenbankschema
└── types/                # TypeScript Typen
```

## 🔐 Sicherheit

- **Passwort-Hashing**: Sichere Passwort-Speicherung
- **JWT Sessions**: Sichere Session-Verwaltung
- **CSRF Protection**: Cross-Site Request Forgery Schutz
- **Input Validation**: Eingabevalidierung auf Client und Server

## 🚀 Deployment

### Vercel (Empfohlen)
1. Repository zu Vercel verbinden
2. Umgebungsvariablen in Vercel Dashboard setzen
3. Automatisches Deployment bei Git-Push

### Lokales Production Build
```bash
npm run build
npm start
```

## 📝 License

Dieses Projekt wurde im Rahmen des IMS25 Hackathons entwickelt.

## 👥 Team

Entwickelt von Team Zeta im Rahmen des IMS25 Hackathons.

