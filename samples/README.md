# Table API Sample Requests

This directory contains geographically realistic sample table requests for testing the Solvice Maps table sync API.

## Sample Files

### Standard Sizes (50km bounding box around Brussels)
- **`sample-table-10-geographic.json`** - 10 coordinates, 100 calculations
- **`sample-table-25-geographic.json`** - 25 coordinates, 625 calculations  
- **`sample-table-50-geographic.json`** - 50 coordinates, 2,500 calculations
- **`sample-table-100-geographic.json`** - 100 coordinates, 10,000 calculations

### Specialized Scenarios
- **`sample-table-urban-dense.json`** - 30 coordinates in 15km radius (dense urban delivery)
- **`sample-table-regional.json`** - 40 coordinates in 75km radius (regional distribution)
- **`sample-table-antwerp.json`** - 20 coordinates around Antwerp center

## Features

✅ **Realistic Geographic Distribution**
- Coordinates spread within specified bounding boxes
- Clustered patterns simulate real-world logistics scenarios

✅ **Complete Request Structure**
- Full matrix calculation (all-to-all sources and destinations)
- Standard annotations: duration and distance
- CAR vehicle type with OSM engine

✅ **Metadata Included**
- Generation timestamp
- Center coordinates and bounding box size
- Coordinate count and clustering information

## Usage

Copy any sample JSON content into the Table Sync demo text area to test different scenarios:

1. **Small test**: Use 10-coordinate sample for quick validation
2. **Medium test**: Use 25-50 coordinate samples for moderate complexity
3. **Stress test**: Use 100-coordinate sample for performance testing
4. **Scenario test**: Use specialized samples for specific use cases

## Regeneration

To generate new samples with different parameters, run:

```bash
node scripts/generate-table-samples.js
```

The script supports customization of:
- Coordinate count
- Bounding box size
- Center location
- Clustering vs random distribution
- Vehicle type and engine selection