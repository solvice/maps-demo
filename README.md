# Solvice Maps Demo

A comprehensive interactive mapping application built with Next.js, MapLibre GL JS, and the Solvice API. Features real-time routing, speed analysis, turn-by-turn navigation, and interactive map controls.

## 🚀 Features

### Core Mapping
- **Interactive Map**: MapLibre GL JS with Solvice Maps tiles (light/dark themes)
- **Route Planning**: Click-to-place markers with drag-and-drop repositioning
- **Real-time Routing**: Instant route calculation with zero-delay during marker dragging
- **Multiple Vehicle Types**: Car, truck, bike support with different routing profiles
- **Alternative Routes**: Toggle between main route and alternatives

### Advanced Analytics
- **Speed Profile Charts**: Real-time speed analysis using Solvice API step data
- **Interactive Highlighting**: Hover over speed chart to highlight route segments on map
- **Route Statistics**: Distance, duration, and speed metrics with hover effects
- **Turn-by-Turn Instructions**: Embedded navigation with route visualization

### Expert Controls
- **Traffic-Aware Routing**: Toggle between OSM (free) and TomTom (traffic-aware) engines
- **Precision Control**: Switch between polyline and polyline6 geometry formats
- **Map Style Toggle**: Light/dark theme switching
- **Debug Tools**: Copy API request JSON for development and debugging

### User Experience
- **Mobile Responsive**: Touch-friendly interface with responsive design
- **Context Menus**: Right-click to set origin/destination anywhere on map
- **Autocomplete Search**: Address search with geocoding (mock implementation)
- **Real-time Feedback**: Toast notifications and loading states
- **Comprehensive Tooltips**: Helpful guidance for all controls

## 🛠 Tech Stack

- **Frontend**: Next.js 15.4.2 with App Router, TypeScript, Tailwind CSS v4
- **Mapping**: MapLibre GL JS with Solvice Maps tiles
- **UI Components**: shadcn/ui with Radix UI primitives
- **Charts**: Recharts for speed profile visualization
- **API**: Solvice Routing API with secure server-side integration
- **Testing**: Playwright (E2E), Vitest (unit), comprehensive test coverage
- **Development**: ESLint, TypeScript strict mode, pnpm package management

## 📋 Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Solvice API key

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <repository-url>
cd maps-demo
pnpm install
```

### 2. Environment Setup
Create `.env.local`:
```bash
SOLVICE_API_KEY=your_api_key_here
```

### 3. Run Development Server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 4. Basic Usage
1. **Place Markers**: Click on the map to set origin (green) and destination (red)
2. **Configure Route**: Use vehicle type toggles and expert controls in top-right
3. **Analyze Speed**: Enable turn-by-turn steps to see speed profile chart
4. **Interactive Exploration**: Hover over speed chart to highlight route segments

## 🧪 Testing

### Run All Tests
```bash
pnpm test        # Unit tests with Vitest
pnpm test:e2e    # End-to-end tests with Playwright
pnpm test:watch  # Watch mode for development
```

### Test Coverage
- **Unit Tests**: Component logic, hooks, utilities
- **Integration Tests**: API integration, route calculation
- **E2E Tests**: Complete user journeys, mobile workflows, cross-browser
- **Performance Tests**: Route calculation timing, memory usage
- **Accessibility Tests**: ARIA compliance, keyboard navigation

### Test Structure
```
tests/
├── unit/           # Vitest unit tests
├── integration/    # API integration tests  
└── e2e/           # Playwright end-to-end tests
```

## 🔧 Development

### Code Quality
```bash
pnpm lint          # ESLint checking
pnpm type-check    # TypeScript validation
pnpm build         # Production build verification
```

### Key Commands
```bash
pnpm dev           # Development server
pnpm build         # Production build
pnpm start         # Production server
pnpm lint          # Code linting
pnpm lint:fix      # Auto-fix linting issues
```

### Development Workflow
1. **Feature Development**: Use TDD approach with unit tests first
2. **API Testing**: Use debug copy button to inspect request JSON
3. **Integration Testing**: Test with real Solvice API endpoints
4. **E2E Validation**: Run Playwright tests for complete workflows

## 📁 Project Structure

```
maps-demo/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main application component
│   ├── layout.tsx         # Root layout
│   └── api/route/         # Secure API endpoints
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── map-*.tsx         # Mapping components
│   ├── route-*.tsx       # Routing components
│   └── *.tsx             # Feature components
├── contexts/             # React Context providers
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and API clients
├── tests/                # Test suites
└── docs/                 # Documentation
```

## 🔗 API Integration

### Solvice Routing API
- **Endpoint**: `https://routing.solvice.io/route`
- **Authentication**: API key via Authorization header
- **Features**: Multi-modal routing, traffic data, turn-by-turn instructions
- **Security**: Server-side proxy to protect API credentials

### Request Configuration
- **Vehicle Types**: CAR, TRUCK, BIKE, ELECTRIC_CAR, ELECTRIC_BIKE
- **Routing Engines**: OSM (free), TOMTOM (traffic), GOOGLE, ANYMAP
- **Geometry Formats**: polyline (5 decimal), polyline6 (6 decimal)
- **Additional Options**: alternatives, steps, annotations, departure time

## 🎯 Key Features Deep Dive

### Speed Profile Analysis
- **Data Source**: Real Solvice API step/leg annotations
- **Calculation**: distance/duration for each route segment
- **Visualization**: Interactive area chart with hover highlighting
- **Integration**: MapLibre geometry highlighting for selected segments

### Expert Controls
- **MapLibre Style**: Consistent 8x8 button controls with tooltips
- **Traffic Toggle**: Smart engine switching with timestamp management
- **Real-time Updates**: Instant route recalculation on configuration changes
- **Debug Support**: Copy request JSON for API development

### Interactive Features
- **Drag & Drop**: Real-time route updates during marker repositioning
- **Hover Effects**: Route highlighting and speed segment selection
- **Context Menus**: Right-click origin/destination placement
- **Mobile Support**: Touch-friendly responsive interface

## 🔐 Security

- **API Key Protection**: Server-side routing prevents client exposure
- **Input Validation**: Comprehensive coordinate and parameter validation
- **Error Handling**: Graceful degradation with user-friendly messages
- **Rate Limiting**: Built-in API request management

## 📊 Performance

- **Optimized Rendering**: Efficient React patterns with minimal re-renders
- **Debounced Updates**: Smart request coordination during user interaction
- **Lazy Loading**: Component code splitting for faster initial load
- **Memory Management**: Proper MapLibre resource cleanup

## 🛣 Roadmap

### Immediate Improvements
- [ ] Replace mock geocoding with real service integration
- [ ] Enhanced accessibility features (ARIA labels, keyboard navigation)
- [ ] Performance optimizations for large route datasets
- [ ] Comprehensive API documentation

### Future Features
- [ ] Route sharing and permalink generation
- [ ] Historical route comparison
- [ ] Advanced traffic visualization
- [ ] Multi-waypoint routing support
- [ ] Route optimization algorithms

## 📚 Documentation

For detailed technical documentation, see:

- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and component relationships
- **[API Documentation](docs/API.md)** - Internal API reference and examples
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Development Setup](docs/DEVELOPMENT.md)** - Detailed development environment setup
- **[Contributing Guidelines](docs/CONTRIBUTING.md)** - Code standards and contribution process

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md) for:
- Code standards and style guide
- Pull request process
- Issue reporting guidelines
- Development workflow

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: Report bugs and feature requests via GitHub Issues
- **Documentation**: Check the `/docs` folder for detailed guides
- **API Questions**: Refer to Solvice API documentation
- **Development**: Use debug tools and comprehensive test suite for troubleshooting

---

Built with ❤️ using Next.js, MapLibre GL JS, and the Solvice API.