#!/usr/bin/env node

/**
 * Script to generate realistic sample table requests with coordinates
 * spread geographically within a configurable bounding box.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BRUSSELS_CENTER = [4.3517, 50.8503]; // [lng, lat]
const BBOX_SIZE_KM = 50; // 50km bounding box

/**
 * Calculate approximate degrees for a given distance in km
 * At latitude ~50.85 (Brussels):
 * - 1 degree longitude ≈ 69.5 km
 * - 1 degree latitude ≈ 111 km
 */
function kmToDegrees(km, lat) {
  const latDegrees = km / 111;
  const lngDegrees = km / (111 * Math.cos(lat * Math.PI / 180));
  return { lat: latDegrees, lng: lngDegrees };
}

/**
 * Generate a random coordinate within the bounding box
 */
function generateRandomCoordinate(centerLng, centerLat, maxDistanceKm) {
  const { lat: maxLatOffset, lng: maxLngOffset } = kmToDegrees(maxDistanceKm / 2, centerLat);
  
  // Generate random offset within the bounding box
  const lngOffset = (Math.random() - 0.5) * 2 * maxLngOffset;
  const latOffset = (Math.random() - 0.5) * 2 * maxLatOffset;
  
  return [
    parseFloat((centerLng + lngOffset).toFixed(4)),
    parseFloat((centerLat + latOffset).toFixed(4))
  ];
}

/**
 * Generate clusters of coordinates to simulate real-world scenarios
 */
function generateClusteredCoordinates(count, centerLng, centerLat, bboxSizeKm) {
  const coordinates = [];
  const numClusters = Math.max(3, Math.floor(count / 15)); // Roughly 15 points per cluster
  
  // Generate cluster centers
  const clusterCenters = [];
  for (let i = 0; i < numClusters; i++) {
    clusterCenters.push(generateRandomCoordinate(centerLng, centerLat, bboxSizeKm));
  }
  
  // Generate points around clusters
  for (let i = 0; i < count; i++) {
    const clusterIndex = i % numClusters;
    const [clusterLng, clusterLat] = clusterCenters[clusterIndex];
    
    // Generate point within 5km of cluster center
    const coord = generateRandomCoordinate(clusterLng, clusterLat, 10);
    coordinates.push(coord);
  }
  
  return coordinates;
}

/**
 * Generate a sample table request
 */
function generateTableSample(coordinateCount, options = {}) {
  const {
    center = BRUSSELS_CENTER,
    bboxSizeKm = BBOX_SIZE_KM,
    vehicleType = 'CAR',
    engine = 'OSM',
    clustered = true,
    annotations = ['duration', 'distance']
  } = options;
  
  const [centerLng, centerLat] = center;
  
  // Generate coordinates
  const coordinates = clustered 
    ? generateClusteredCoordinates(coordinateCount, centerLng, centerLat, bboxSizeKm)
    : Array.from({ length: coordinateCount }, () => 
        generateRandomCoordinate(centerLng, centerLat, bboxSizeKm)
      );
  
  // Generate source and destination indices (all-to-all by default)
  const indices = Array.from({ length: coordinateCount }, (_, i) => i);
  
  return {
    coordinates,
    sources: indices,
    destinations: indices,
    annotations,
    vehicleType,
    engine,
    metadata: {
      generated: new Date().toISOString(),
      center: center,
      bboxSizeKm: bboxSizeKm,
      coordinateCount: coordinateCount,
      clustered: clustered
    }
  };
}

/**
 * Generate multiple sample files
 */
function generateSamples() {
  const samples = [
    { count: 10, filename: 'sample-table-10-geographic.json' },
    { count: 25, filename: 'sample-table-25-geographic.json' },
    { count: 50, filename: 'sample-table-50-geographic.json' },
    { count: 100, filename: 'sample-table-100-geographic.json' }
  ];
  
  // Create samples directory if it doesn't exist
  const samplesDir = path.join(__dirname, '..', 'samples');
  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
  }
  
  samples.forEach(({ count, filename }) => {
    console.log(`Generating ${filename} with ${count} coordinates...`);
    
    const sample = generateTableSample(count, {
      clustered: true,
      bboxSizeKm: BBOX_SIZE_KM
    });
    
    const filepath = path.join(samplesDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(sample, null, 2));
    
    console.log(`✅ Generated ${filename}`);
    console.log(`   - Coordinates: ${sample.coordinates.length}`);
    console.log(`   - Matrix size: ${sample.coordinates.length}x${sample.coordinates.length} = ${sample.coordinates.length * sample.coordinates.length} calculations`);
    console.log(`   - Bounding box: ${BBOX_SIZE_KM}km around Brussels`);
    console.log('');
  });
  
  // Also generate some specialized samples
  console.log('Generating specialized samples...');
  
  // Dense urban sample (small bounding box)
  const urbanSample = generateTableSample(30, {
    bboxSizeKm: 15,
    clustered: true
  });
  urbanSample.metadata.description = 'Dense urban delivery routes within 15km of Brussels center';
  fs.writeFileSync(path.join(samplesDir, 'sample-table-urban-dense.json'), JSON.stringify(urbanSample, null, 2));
  console.log('✅ Generated sample-table-urban-dense.json (15km radius)');
  
  // Regional sample (larger bounding box)
  const regionalSample = generateTableSample(40, {
    bboxSizeKm: 75,
    clustered: false
  });
  regionalSample.metadata.description = 'Regional distribution network within 75km of Brussels center';
  fs.writeFileSync(path.join(samplesDir, 'sample-table-regional.json'), JSON.stringify(regionalSample, null, 2));
  console.log('✅ Generated sample-table-regional.json (75km radius)');
  
  // Different center (Antwerp)
  const antwerpSample = generateTableSample(20, {
    center: [4.4025, 51.2194], // Antwerp coordinates
    bboxSizeKm: 40,
    clustered: true
  });
  antwerpSample.metadata.description = 'Antwerp region logistics network';
  fs.writeFileSync(path.join(samplesDir, 'sample-table-antwerp.json'), JSON.stringify(antwerpSample, null, 2));
  console.log('✅ Generated sample-table-antwerp.json (Antwerp center)');
  
  console.log('\n🎉 All sample files generated successfully!');
  console.log(`📁 Files saved to: ${samplesDir}`);
}

// CLI usage
if (require.main === module) {
  console.log('🌍 Geographic Table Sample Generator');
  console.log('=====================================\n');
  
  generateSamples();
}