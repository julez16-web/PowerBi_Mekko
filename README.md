# PowerBi_Mekko

A custom Marimekko / Mekko chart visual for Power BI Desktop.

## Features

- **100%-stacked bars** with variable column widths proportional to bar totals
- **8 configurable label modes**: Amount, % of Total, % within Bar, combined modes, and Category prefix variants
- **Bar totals** displayed above each column
- **Format panel** with full control over fonts, colors, decimal places, display units (k/M/B), currency symbols
- **Accessibility**: ARIA attributes, keyboard focusable segments, contrast-friendly defaults
- **Microsoft AppSource & certification ready**: No external calls, MIT-licensed dependencies only

## Data Roles

| Role | Type | Description |
|------|------|-------------|
| Category | Grouping | X-axis categories (e.g. Final_OH) |
| Series | Grouping | Legend / stack series (e.g. Cost Element main category) |
| Values | Measure | Numeric measure (absolute cost amounts) |

## Label Content Modes

1. **Amount** (default) — absolute value (e.g. `123,456` or `123.5k`)
2. **% of Total** — segment value / grand total
3. **% within Bar** — segment value / bar total
4. **Amount | % of Total** — combined
5. **Category (Amount)** — series name with amount
6. **Category (% of Total)** — series name with % of total
7. **Category (% within Bar)** — series name with % within bar
8. **Category (Amount | % of Total)** — series name with both

## Development

```bash
npm install
npm run build
npm start       # for development server (requires pbiviz)
npm run package # to create .pbiviz file
```

## License

MIT
