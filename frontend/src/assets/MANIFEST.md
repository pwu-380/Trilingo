# Frontend Assets

## Alister (AI Tutor) Portraits

| File | Usage | Size |
|------|-------|------|
| `Al-profile-pic-large.jpg` | Profile page, about screen, welcome splash | Large |
| `Al-profile-icon-small.png` | Chat message avatar (neutral/default) | Small icon |
| `Al-profile-icon-small-confused.png` | Chat message avatar (confused emotion) | Small icon |
| `Al-profile-icon-small-mad.png` | Chat message avatar (mad emotion) | Small icon |

## Placeholders

| File | Usage | Size |
|------|-------|------|
| `Al-under-construction.jpg` | Placeholder for unbuilt features (Flash Cards tab, Games tab, etc.) | Large |

### Emotion Mapping

The chat API returns an `emotion` field on assistant messages: `"neutral"`, `"confused"`, or `"mad"`.
Map to icons:

```ts
const AL_ICONS: Record<string, string> = {
  neutral: AlIconNeutral,    // Al-profile-icon-small.png
  confused: AlIconConfused,  // Al-profile-icon-small-confused.png
  mad: AlIconMad,            // Al-profile-icon-small-mad.png
};
```
