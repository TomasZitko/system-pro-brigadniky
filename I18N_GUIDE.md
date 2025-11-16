# BrigadníkOS - Multilingual Implementation Guide

## Overview

BrigadníkOS is now fully multilingual, supporting **Czech (Čeština)** and **English** across all 4 applications:

1. **Manager Portal** (web-manager) - Port 3001
2. **HQ Analytics Portal** (web-hq) - Port 3002
3. **Accountant Portal** (web-accountant) - Port 3003
4. **Worker Mobile App** (mobile-worker) - React Native/Expo

---

## Technology Stack

### Web Applications (React + Vite)
- `i18next` v23.7.6 - Core internationalization framework
- `react-i18next` v13.5.0 - React bindings for i18next
- `i18next-browser-languagedetector` v7.2.0 - Automatic language detection

### Mobile Application (React Native + Expo)
- `i18next` v23.7.6 - Core internationalization framework
- `react-i18next` v13.5.0 - React Native bindings
- `expo-localization` v14.8.0 - Device locale detection

---

## Supported Languages

| Language | Code | Flag | Default |
|----------|------|------|---------|
| **Czech** | `cs` | 🇨🇿 | ✅ Yes |
| **English** | `en` | 🇬🇧 | No |

**Default Language**: Czech (Čeština) - Primary market for DPP/DPČ contracts

---

## Project Structure

```
web-manager/
├── src/
│   ├── i18n/
│   │   ├── config.ts              # i18n configuration
│   │   ├── index.ts               # Main export
│   │   └── locales/
│   │       ├── cs/                # Czech translations
│   │       │   ├── common.json    # Common UI strings
│   │       │   ├── auth.json      # Authentication
│   │       │   ├── pages.json     # Page-specific strings
│   │       │   └── messages.json  # Toast messages
│   │       └── en/                # English translations
│   │           ├── common.json
│   │           ├── auth.json
│   │           ├── pages.json
│   │           └── messages.json
│   └── components/
│       └── LanguageSwitcher.tsx   # Language selector component
```

**Same structure applies to**:
- `web-hq/`
- `web-accountant/`
- `mobile-worker/` (with React Native-specific config)

---

## Translation Files

### 1. Common Translations (`common.json`)

**Purpose**: App-wide strings (navigation, actions, validation, errors)

```json
{
  "appName": "BrigadníkOS",
  "managerPortal": "Manager Portal",
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "workers": "Workers",
    "shifts": "Shifts"
  }
}
```

### 2. Authentication Translations (`auth.json`)

**Purpose**: Login, logout, user profile

```json
{
  "login": {
    "title": "Login",
    "email": "Email Address",
    "password": "Password",
    "loginButton": "Sign In"
  }
}
```

### 3. Page-Specific Translations (`pages.json`)

**Purpose**: All page content (dashboard, workers, shifts, payroll, etc.)

```json
{
  "dashboard": {
    "title": "Dashboard",
    "stats": {
      "totalWorkers": "Total Workers",
      "shiftsThisMonth": "Shifts This Month"
    }
  },
  "payroll": {
    "title": "Payroll",
    "createPeriod": "Create Period",
    "export": {
      "csszXml": "ČSSZ XML",
      "csv": "CSV for Accounting"
    }
  }
}
```

### 4. Toast Messages (`messages.json`)

**Purpose**: Success/error notifications

```json
{
  "toast": {
    "success": "Operation successful",
    "error": "Something went wrong",
    "saved": "Saved successfully"
  }
}
```

---

## Usage Examples

### Basic Translation

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation(['common']);

  return (
    <Typography>
      {t('appName')} - {t('managerPortal')}
    </Typography>
  );
}
```

### Multiple Namespaces

```tsx
import { useTranslation } from 'react-i18next';

function LoginPage() {
  const { t } = useTranslation(['common', 'auth']);

  return (
    <>
      <Typography>{t('common:appName')}</Typography>
      <TextField label={t('auth:login.email')} />
      <Button>{t('auth:login.loginButton')}</Button>
    </>
  );
}
```

### With Interpolation

```tsx
// Translation file:
{
  "welcome": "Welcome back, {{name}}!"
}

// Component:
<Typography>
  {t('dashboard.welcome', { name: user.firstName })}
</Typography>
```

### Toast Messages

```tsx
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

function PayrollPage() {
  const { t } = useTranslation(['pages']);

  const handleSubmit = async () => {
    try {
      await api.createPayroll();
      toast.success(t('pages:payroll.messages.createSuccess'));
    } catch (error) {
      toast.error(t('pages:payroll.messages.createFailed'));
    }
  };
}
```

---

## Language Switcher Component

All web applications include a **LanguageSwitcher** component in the top navigation:

```tsx
import LanguageSwitcher from '../components/LanguageSwitcher';

function DashboardLayout() {
  return (
    <AppBar>
      <Toolbar>
        <Typography>Manager Portal</Typography>
        <LanguageSwitcher /> {/* Flag icon + dropdown */}
      </Toolbar>
    </AppBar>
  );
}
```

**Features**:
- Click globe icon to open language menu
- Shows current language flag (🇨🇿 or 🇬🇧)
- Persists selection in `localStorage`
- Instant UI update on language change

---

## Installation

### Web Applications

```bash
cd web-manager
npm install

cd ../web-hq
npm install

cd ../web-accountant
npm install
```

### Mobile Application

```bash
cd mobile-worker
npm install
```

---

## Running the Applications

### Web Applications (Development)

```bash
# Manager Portal (Port 3001)
cd web-manager && npm run dev

# HQ Analytics Portal (Port 3002)
cd web-hq && npm run dev

# Accountant Portal (Port 3003)
cd web-accountant && npm run dev
```

### Mobile Application

```bash
cd mobile-worker
npm start

# Then choose platform:
# - Press 'a' for Android
# - Press 'i' for iOS
# - Press 'w' for web
```

---

## Adding New Translations

### 1. Add to JSON Files

**Czech** (`locales/cs/pages.json`):
```json
{
  "newFeature": {
    "title": "Nová funkce",
    "description": "Popis nové funkce"
  }
}
```

**English** (`locales/en/pages.json`):
```json
{
  "newFeature": {
    "title": "New Feature",
    "description": "Description of new feature"
  }
}
```

### 2. Use in Component

```tsx
import { useTranslation } from 'react-i18next';

function NewFeaturePage() {
  const { t } = useTranslation(['pages']);

  return (
    <>
      <Typography variant="h4">
        {t('pages:newFeature.title')}
      </Typography>
      <Typography>
        {t('pages:newFeature.description')}
      </Typography>
    </>
  );
}
```

---

## Adding New Languages

### 1. Create Translation Files

```bash
mkdir src/i18n/locales/sk  # Slovak example
```

### 2. Copy and Translate

```bash
cp -r src/i18n/locales/cs/* src/i18n/locales/sk/
# Then translate all JSON files to Slovak
```

### 3. Update Config

```typescript
// src/i18n/config.ts
import skCommon from './locales/sk/common.json';
import skAuth from './locales/sk/auth.json';
import skPages from './locales/sk/pages.json';
import skMessages from './locales/sk/messages.json';

const resources = {
  cs: { ... },
  en: { ... },
  sk: {  // Add Slovak
    common: skCommon,
    auth: skAuth,
    pages: skPages,
    messages: skMessages,
  },
};
```

### 4. Update Language Switcher

```typescript
// src/components/LanguageSwitcher.tsx
const languages = [
  { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' }, // Add this
];
```

---

## Material-UI Localization

### Czech Locale for Date Pickers

To add Czech locale to MUI components:

```typescript
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { csCZ } from '@mui/material/locale';

const theme = createTheme(
  {
    palette: {
      primary: { main: '#1976d2' },
    },
  },
  csCZ // Czech locale
);

<ThemeProvider theme={theme}>
  <App />
</ThemeProvider>
```

---

## Testing Translations

### Manual Testing

1. **Language Switcher**: Click globe icon → Select language → Verify UI updates
2. **Page Navigation**: Navigate all pages → Verify all text translates
3. **Forms**: Submit forms → Verify validation messages translate
4. **Toast Messages**: Trigger success/error → Verify messages translate

### Automated Testing

```typescript
import { renderWithI18n } from './test-utils';
import { screen } from '@testing-library/react';
import Dashboard from './pages/Dashboard';

test('renders dashboard in Czech', () => {
  renderWithI18n(<Dashboard />, { locale: 'cs' });
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});

test('renders dashboard in English', () => {
  renderWithI18n(<Dashboard />, { locale: 'en' });
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
});
```

---

## Translation Coverage

### Manager Portal (~300+ strings)
- ✅ Navigation (7 items)
- ✅ Dashboard (4 stats + quick actions)
- ✅ Workers page (table, form, messages)
- ✅ Shifts page (calendar, form, status)
- ✅ Attendance page (approval workflow)
- ✅ Payroll page (periods, ČSSZ export, calculations)
- ✅ Gamification page (badges, leaderboard)
- ✅ Feedback page (QR codes, reviews)

### HQ Analytics Portal (~50+ strings)
- ✅ Network analytics
- ✅ Location comparison charts
- ✅ Satisfaction trends

### Accountant Portal (~40+ strings)
- ✅ Payroll exports (ČSSZ XML, CSV)
- ✅ Period management

### Mobile Worker App (~200+ strings)
- ✅ Login/Authentication
- ✅ Home screen (today's shifts, pay estimate)
- ✅ Schedule calendar
- ✅ Shift marketplace
- ✅ GPS clock-in/out
- ✅ Pay breakdown
- ✅ Achievements & badges
- ✅ Profile settings

---

## Performance Considerations

### Lazy Loading (Future Enhancement)

```typescript
import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // Lazy load translations on demand
  });
```

### Bundle Size

Current translation files:
- Czech: ~15KB total (4 files × ~4KB each)
- English: ~15KB total (4 files × ~4KB each)
- **Total**: ~30KB (negligible impact on bundle size)

---

## Troubleshooting

### Missing Translations

**Problem**: Text shows as `pages:dashboard.title` instead of "Dashboard"

**Solution**:
1. Check if translation key exists in JSON file
2. Verify namespace is loaded: `useTranslation(['pages'])`
3. Check JSON file imports in `config.ts`

### Language Not Changing

**Problem**: UI doesn't update after changing language

**Solution**:
1. Clear localStorage: `localStorage.clear()`
2. Hard refresh browser: `Ctrl+Shift+R`
3. Check i18n initialization in `main.tsx`

### TypeScript Errors

**Problem**: TypeScript complains about JSON imports

**Solution**: Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "resolveJsonModule": true,
    "esModuleInterop": true
  }
}
```

---

## Best Practices

1. **Never hardcode strings** - Always use translation keys
2. **Use namespaces** - Organize translations by feature/page
3. **Consistent naming** - Use camelCase for keys
4. **Add context** - Use descriptive keys (`pages:workers.form.firstName` not `name`)
5. **Plural forms** - Use i18next plural syntax when needed
6. **Date/Number formatting** - Use i18next formatting functions

---

## Future Enhancements

- [ ] Add Slovak language (cultural proximity to Czech market)
- [ ] Add Polish language (potential expansion market)
- [ ] RTL support for Arabic/Hebrew
- [ ] Translation management platform (Lokalise, Crowdin)
- [ ] Machine translation integration
- [ ] A/B testing for different translations
- [ ] Translation analytics (which languages are used most)

---

## Support

For questions or issues with translations:
- **Documentation**: This file (I18N_GUIDE.md)
- **i18next Docs**: https://www.i18next.com/
- **React i18next**: https://react.i18next.com/

---

## License

Same as BrigadníkOS project - MIT License

---

**Last Updated**: 2025-11-16
**Version**: 1.0.0
**Maintained by**: BrigadníkOS Development Team
