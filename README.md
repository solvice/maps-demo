# Solvice Maps Demo

A comprehensive interactive mapping application built with Next.js, MapLibre GL JS, and the Solvice API. Features real-time routing with automatic traffic comparison, distance/duration matrix calculations, speed analysis, turn-by-turn navigation, and URL-shareable routes.

🌐 **Live Demo**: [https://maps-demo.solvice.io](https://maps-demo.solvice.io)

## 🚀 Features

### Dual Demo Experience
- **Unified Interface**: Seamless navigation between Route Planning and Table Sync demos
- **Shared Map**: Single persistent map instance across both demos for smooth transitions
- **Consistent Design**: Unified layout with centered navigation and equal-sized control panels

### Route Planning Demo
- **Interactive Map**: MapLibre GL JS with Solvice Maps tiles (light/dark themes)
- **Click-to-Place Markers**: Click on map to set origin/destination with drag-and-drop repositioning
- **Real-time Routing**: Instant route calculation with zero-delay during marker dragging
- **Multiple Vehicle Types**: Car, truck, bike support with different routing profiles
- **URL Route Sharing**: Share routes via URL parameters for easy collaboration

### Table Sync Demo  
- **Distance/Duration Matrix**: Calculate travel times/distances between multiple points
- **JSON Input**: Paste table requests with coordinates, sources, destinations, and parameters
- **Interactive Visualization**: Blue circle markers with hover tooltips showing coordinates
- **Connection Visualization**: Hover over markers to see distance/duration to other points
- **Real-time Calculation**: Automatic matrix calculation with performance timing notifications

### Advanced Analytics
- **Always-On Traffic Comparison**: Automatic dual requests showing regular vs traffic-aware routes
- **Speed Profile Charts**: Interactive speed analysis comparing regular and traffic conditions
- **Route Highlighting**: Hover over speed chart to highlight route segments on map
- **Route Statistics**: Distance, duration, and traffic delay metrics with color-coded highlighting

### Smart Controls
- **Automatic Traffic Integration**: No toggle needed - traffic data always included when available
- **Address Autocomplete**: Google Places integration with intelligent search suggestions  
- **Map Style Toggle**: Light/dark theme switching with smooth transitions
- **Context-Aware Help**: Interactive help system with live examples

### User Experience
- **Mobile Responsive**: Touch-friendly interface with responsive design
- **Context Menus**: Right-click to set origin/destination anywhere on map
- **Smart Address Search**: Google Places autocomplete with fallback support
- **Real-time Feedback**: Toast notifications and intelligent loading states
- **Interactive Help**: Comprehensive help system with clickable examples

## 🛠 Tech Stack

- **Frontend**: Next.js 15.4.2 with App Router, TypeScript, Tailwind CSS v4
- **Mapping**: MapLibre GL JS with Solvice Maps tiles and TomTom attribution
- **UI Components**: shadcn/ui with Radix UI primitives and popover interactions
- **Charts**: Recharts for dual-route speed profile visualization
- **API Integration**: Solvice Routing API + Google Places API with secure server-side proxy
- **Testing**: Playwright (E2E), Vitest (unit), comprehensive test coverage with 354 tests
- **Development**: ESLint, TypeScript strict mode, automated traffic comparison

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
SOLVICE_API_KEY=your_solvice_api_key_here
GOOGLE_MAPS_API_KEY=your_google_places_api_key_here
```

### 3. Run Development Server
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application menu, or go directly to [http://localhost:3000/route](http://localhost:3000/route) for route planning or [http://localhost:3000/table](http://localhost:3000/table) for table sync demo.

### 4. Basic Usage

#### Route Planning Demo
1. **Navigate to Route Demo**: Click "Route Planning" in the top navigation
2. **Place Markers**: Click on the map to set origin (green) and destination (red)
3. **Configure Route**: Use vehicle type toggles (Car/Truck/Bike) in the control panel
4. **View Traffic Comparison**: Speed profile automatically shows regular vs traffic routes
5. **Share Routes**: Copy URL to share routes with URL parameters
6. **Interactive Exploration**: Hover over speed chart to highlight route segments

#### Table Sync Demo  
1. **Navigate to Table Demo**: Click "Table Sync" in the top navigation
2. **Paste JSON Request**: Enter table request JSON with coordinates and parameters
3. **View Matrix Results**: Blue markers appear on map with coordinate tooltips
4. **Explore Connections**: Hover over markers to see distance/duration to other points
5. **Performance Tracking**: Toast notifications show calculation timing

### 5. URL Route Sharing
Share routes using URL parameters:
```
https://maps-demo.solvice.io/route?origin=3.7174,51.0543&destination=3.7274,51.0643&engine=TOMTOM&steps=true
```

**Supported Parameters:**
- `origin=lng,lat` - Start coordinates
- `destination=lng,lat` - End coordinates  
- `vehicle=CAR|TRUCK|BIKE` - Vehicle type
- `engine=OSM|TOMTOM|GOOGLE` - Routing engine
- `steps=true|false` - Show turn-by-turn instructions

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
├── app/                      # Next.js App Router
│   ├── page.tsx             # Demo navigation homepage
│   ├── route/               # Route planning demo
│   │   └── page.tsx         # Route demo with DemoLayout
│   ├── table/               # Table sync demo
│   │   └── page.tsx         # Table demo with DemoLayout
│   ├── layout.tsx           # Root layout with error boundary
│   └── api/                 # Secure API endpoints
│       ├── route/           # Route API proxy
│       └── table/           # Table API proxy
├── components/              # React components
│   ├── ui/                 # shadcn/ui components
│   ├── demo-*.tsx          # Unified demo layout components
│   ├── map-*.tsx           # Mapping components
│   ├── route-*.tsx         # Route-specific components
│   ├── table-*.tsx         # Table-specific components
│   └── *.tsx               # Shared feature components
├── contexts/               # React Context providers
├── hooks/                  # Custom React hooks
│   ├── use-route.ts        # Route calculation logic
│   └── use-table.ts        # Table calculation logic
├── lib/                    # Utilities and API clients
│   ├── solvice-api.ts      # Route API client
│   └── solvice-table-api.ts # Table API client
├── tests/                  # Test suites
└── docs/                   # Documentation
```

## 🔗 API Integration

### Solvice Routing API
- **Endpoint**: `https://routing.solvice.io/route`
- **Authentication**: API key via Authorization header
- **Features**: Multi-modal routing, traffic data, turn-by-turn instructions
- **Security**: Server-side proxy to protect API credentials

### Solvice Table Sync API
- **Endpoint**: `https://routing.solvice.io/table/sync`
- **Authentication**: API key via Authorization header
- **Features**: Distance/duration matrix calculations, synchronous processing
- **Input**: Coordinates array with sources, destinations, and configuration options
- **Security**: Server-side proxy to protect API credentials

### Request Configuration

#### Route API
- **Vehicle Types**: CAR, TRUCK, BIKE, ELECTRIC_CAR, ELECTRIC_BIKE
- **Routing Engines**: OSM (free), TOMTOM (traffic), GOOGLE, ANYMAP
- **Geometry Formats**: polyline (5 decimal), polyline6 (6 decimal)
- **Additional Options**: alternatives, steps, annotations, departure time

#### Table API
- **Vehicle Types**: CAR, TRUCK, BIKE, ELECTRIC_CAR, ELECTRIC_BIKE
- **Routing Engines**: OSM (free), TOMTOM (traffic), GOOGLE, ANYMAP
- **Annotations**: distance, duration, speed
- **Matrix Options**: sources, destinations arrays for partial matrices

## 🎯 Key Features Deep Dive

### Traffic Comparison & Speed Analysis
- **Always-On Traffic**: Automatic dual requests comparing regular vs traffic-aware routing
- **Data Source**: Real Solvice API step/leg annotations with traffic integration
- **Dual Visualization**: Interactive charts showing both regular and traffic speeds
- **Color-Coded Results**: Green for no delay, yellow/red for traffic delays
- **Route Integration**: MapLibre geometry highlighting for selected segments

### Smart Controls
- **Automatic Traffic**: Always-on traffic comparison without manual toggling
- **Real-time Updates**: Instant route recalculation on configuration changes  
- **Debug Support**: Copy request JSON for API development and testing
- **Interactive Help**: Clickable examples and comprehensive parameter documentation

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

### Recently Completed
- [x] **URL Route Sharing**: Complete URL parameter system with comma-separated coordinates
- [x] **Always-On Traffic**: Automatic traffic comparison without manual toggles
- [x] **Google Places Integration**: Real address autocomplete with intelligent fallback
- [x] **Interactive Help System**: Clickable examples and comprehensive documentation
- [x] **Dual Speed Profiles**: Traffic vs regular route comparison with color coding
- [x] **Table Sync Demo**: Distance/duration matrix calculations with interactive visualization
- [x] **Unified Demo Layout**: Shared map with seamless navigation between route/table demos

### Immediate Improvements
- [ ] Enhanced accessibility features (ARIA labels, keyboard navigation)
- [ ] Performance optimizations for large route datasets  
- [ ] Advanced error recovery and retry mechanisms
- [ ] Mobile-first responsive improvements

### Future Features
- [ ] Historical route comparison and route analytics
- [ ] Advanced traffic visualization with real-time updates
- [ ] Multi-waypoint routing support with optimization
- [ ] Route export and offline capabilities
- [ ] Integration with calendar applications for departure time optimization

## 📚 Documentation

For detailed technical documentation, see:

- **[URL Parameters Guide](docs/url-parameters.md)** - Complete URL sharing and parameter reference
- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and component relationships  
- **[API Documentation](docs/API.md)** - Internal API reference and examples
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Production deployment instructions
- **[Development Setup](docs/DEVELOPMENT.md)** - Detailed development environment setup

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