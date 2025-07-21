import { useMemo } from 'react';
import { RouteResponse } from '@/lib/solvice-api';
import { formatDistance } from '@/lib/format';

export interface SpeedDataPoint {
  distance: number;
  speed: number;
  trafficSpeed?: number;
  distanceLabel: string;
  stepIndex: number;
  geometry?: string;
  locationName?: string;
  routeRef?: string;
  destinations?: string;
}

export interface CombinedDataPoint {
  distance: number;
  speed: number | null;
  trafficSpeed?: number | null;
  distanceLabel: string;
  stepIndex: number;
  geometry?: string;
  locationName?: string;
  routeRef?: string;
  destinations?: string;
}

export interface UseSpeedDataParams {
  route: RouteResponse | null;
  trafficRoute?: RouteResponse | null;
  selectedRouteIndex?: number;
}

export interface UseSpeedDataResult {
  regularSpeedData: SpeedDataPoint[];
  trafficSpeedData: SpeedDataPoint[];
  combinedData: CombinedDataPoint[];
  avgSpeed: number;
  avgTrafficSpeed: number | null;
}

// Helper function to extract speed data from a route
function extractSpeedData(route: RouteResponse, selectedRouteIndex: number, routeType: 'regular' | 'traffic' = 'regular'): SpeedDataPoint[] {
  const selectedRoute = route.routes[selectedRouteIndex];
  if (!selectedRoute || !selectedRoute.legs || selectedRoute.legs.length === 0) {
    return [];
  }

  console.log(`🚗 useSpeedData - ${routeType} route data:`, selectedRoute);

  const speedData: SpeedDataPoint[] = [];
  let cumulativeDistance = 0;
  let globalStepIndex = 0;

  selectedRoute.legs.forEach((leg: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    // First priority: Use step-level data if available
    if (leg.steps && leg.steps.length > 0) {
      leg.steps.forEach((step: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        if (step.distance && step.duration) {
          const stepDistance = step.distance;
          const stepDuration = step.duration;
          
          // Calculate speed: distance (meters) / duration (seconds) = m/s
          // Convert to km/h: m/s * 3.6 = km/h
          const speedMs = stepDistance / stepDuration; // m/s
          const speedKmh = speedMs * 3.6; // km/h
          
          const dataPoint: SpeedDataPoint = {
            distance: cumulativeDistance,
            speed: routeType === 'regular' ? Math.round(speedKmh) : 0,
            trafficSpeed: routeType === 'traffic' ? Math.round(speedKmh) : undefined,
            distanceLabel: formatDistance(cumulativeDistance),
            stepIndex: globalStepIndex,
            geometry: step.geometry,
            locationName: step.name,
            routeRef: step.ref,
            destinations: step.destinations
          };
          
          speedData.push(dataPoint);
          
          cumulativeDistance += stepDistance;
          globalStepIndex++;
        }
      });
      
    // Second priority: Use annotation arrays if steps not available
    } else if (leg.annotation && leg.annotation.distance && leg.annotation.duration && leg.annotation.distance.length > 0 && leg.annotation.duration.length > 0) {
      const distances = leg.annotation.distance;
      const durations = leg.annotation.duration;
      
      // Process each segment in the annotation arrays
      for (let i = 0; i < distances.length && i < durations.length; i++) {
        const segmentDistance = distances[i];
        const segmentDuration = durations[i];
        
        // Calculate speed: distance (meters) / duration (seconds) = m/s
        // Convert to km/h: m/s * 3.6 = km/h
        const speedMs = segmentDistance / segmentDuration; // m/s
        const speedKmh = speedMs * 3.6; // km/h
        
        const dataPoint: SpeedDataPoint = {
          distance: cumulativeDistance,
          speed: routeType === 'regular' ? Math.round(speedKmh) : 0,
          trafficSpeed: routeType === 'traffic' ? Math.round(speedKmh) : undefined,
          distanceLabel: formatDistance(cumulativeDistance),
          stepIndex: globalStepIndex,
          geometry: undefined // No geometry available for annotation segments
        };
        
        speedData.push(dataPoint);
        globalStepIndex++;
        
        cumulativeDistance += segmentDistance;
      }
      
    // Fallback: Use leg-level data
    } else if (leg.distance && leg.duration) {
      const speedMs = leg.distance / leg.duration;
      const speedKmh = speedMs * 3.6;
      
      const dataPoint: SpeedDataPoint = {
        distance: cumulativeDistance,
        speed: routeType === 'regular' ? Math.round(speedKmh) : 0,
        trafficSpeed: routeType === 'traffic' ? Math.round(speedKmh) : undefined,
        distanceLabel: formatDistance(cumulativeDistance),
        stepIndex: globalStepIndex,
        geometry: undefined // No geometry available for leg-level fallback
      };
      
      speedData.push(dataPoint);
      globalStepIndex++;
      
      cumulativeDistance += leg.distance;
    }
  });

  return speedData;
}

// Helper function to interpolate speed at a given distance
function interpolateSpeedAtDistance(speedData: SpeedDataPoint[], targetDistance: number): number | null {
  if (speedData.length === 0) return null;
  
  // Find the two closest points to our target distance
  let beforePoint = null;
  let afterPoint = null;
  
  for (let i = 0; i < speedData.length; i++) {
    const point = speedData[i];
    if (point.distance <= targetDistance) {
      beforePoint = point;
    }
    if (point.distance >= targetDistance && !afterPoint) {
      afterPoint = point;
      break;
    }
  }

  // If target is before first point, use first point speed
  if (!beforePoint && afterPoint) {
    return afterPoint.speed || afterPoint.trafficSpeed || 0;
  }
  
  // If target is after last point, use last point speed
  if (beforePoint && !afterPoint) {
    return beforePoint.speed || beforePoint.trafficSpeed || 0;
  }
  
  // If we have exact match
  if (beforePoint && beforePoint.distance === targetDistance) {
    return beforePoint.speed || beforePoint.trafficSpeed || 0;
  }
  
  // Interpolate between two points
  if (beforePoint && afterPoint) {
    const beforeSpeed = beforePoint.speed || beforePoint.trafficSpeed || 0;
    const afterSpeed = afterPoint.speed || afterPoint.trafficSpeed || 0;
    const distanceRatio = (targetDistance - beforePoint.distance) / (afterPoint.distance - beforePoint.distance);
    const interpolatedSpeed = beforeSpeed + (afterSpeed - beforeSpeed) * distanceRatio;
    return Math.round(interpolatedSpeed * 10) / 10; // Round to 1 decimal place
  }
  
  return null;
}

// Helper function to find closest geometry data point
function findClosestGeometry(speedData: SpeedDataPoint[], targetDistance: number): { 
  geometry?: string; 
  stepIndex: number; 
  locationName?: string; 
  routeRef?: string; 
  destinations?: string;
} {
  if (speedData.length === 0) return { 
    geometry: undefined, 
    stepIndex: 0, 
    locationName: undefined, 
    routeRef: undefined, 
    destinations: undefined 
  };
  
  let closest = speedData[0];
  let minDistance = Math.abs(speedData[0].distance - targetDistance);
  
  for (const point of speedData) {
    const dist = Math.abs(point.distance - targetDistance);
    if (dist < minDistance) {
      minDistance = dist;
      closest = point;
    }
  }
  
  return { 
    geometry: closest.geometry, 
    stepIndex: closest.stepIndex,
    locationName: closest.locationName,
    routeRef: closest.routeRef,
    destinations: closest.destinations
  };
}

export function useSpeedData({ route, trafficRoute, selectedRouteIndex = 0 }: UseSpeedDataParams): UseSpeedDataResult {
  // Memoize the regular speed data extraction
  const regularSpeedData = useMemo(() => {
    if (!route || !route.routes || route.routes.length === 0) {
      return [];
    }
    return extractSpeedData(route, selectedRouteIndex, 'regular');
  }, [route, selectedRouteIndex]);

  // Memoize the traffic speed data extraction
  const trafficSpeedData = useMemo(() => {
    if (!trafficRoute) {
      return [];
    }
    return extractSpeedData(trafficRoute, selectedRouteIndex, 'traffic');
  }, [trafficRoute, selectedRouteIndex]);

  // Memoize the combined data processing
  const combinedData = useMemo(() => {
    if (regularSpeedData.length === 0) {
      return [];
    }

    // Debug logging to understand the data mismatch
    console.log('🔵 Regular speed data points:', regularSpeedData.length);
    console.log('🟠 Traffic speed data points:', trafficSpeedData.length);
    
    if (regularSpeedData.length > 0) {
      console.log('🔵 Regular route total distance:', regularSpeedData[regularSpeedData.length - 1]?.distance);
    }
    if (trafficSpeedData.length > 0) {
      console.log('🟠 Traffic route total distance:', trafficSpeedData[trafficSpeedData.length - 1]?.distance);
    }

    // Create a common distance grid for both routes by resampling
    const maxDistance = Math.max(
      regularSpeedData.length > 0 ? regularSpeedData[regularSpeedData.length - 1].distance : 0,
      trafficSpeedData.length > 0 ? trafficSpeedData[trafficSpeedData.length - 1].distance : 0
    );

    // Create distance intervals (every ~200m for smooth curves)
    const sampleInterval = Math.max(50, maxDistance / 100); // At least 50m, max 100 points
    const distanceGrid = [];
    for (let distance = 0; distance <= maxDistance; distance += sampleInterval) {
      distanceGrid.push(distance);
    }

    console.log(`📏 Distance grid: 0 to ${maxDistance}m with ${distanceGrid.length} points (${sampleInterval}m intervals)`);

    // Resample both routes to the common distance grid
    const combined = distanceGrid.map(distance => {
      const regularSpeed = interpolateSpeedAtDistance(regularSpeedData, distance);
      const trafficSpeed = interpolateSpeedAtDistance(trafficSpeedData, distance);
      
      // Find the closest original data point to preserve geometry information
      const closestData = findClosestGeometry(regularSpeedData, distance);
      
      return {
        distance,
        speed: regularSpeed,
        trafficSpeed,
        distanceLabel: formatDistance(distance),
        stepIndex: closestData.stepIndex,
        geometry: closestData.geometry,
        locationName: closestData.locationName,
        routeRef: closestData.routeRef,
        destinations: closestData.destinations
      };
    });

    console.log('📈 Combined speed data points:', combined.length);
    console.log('📈 Combined speed data sample:', combined.slice(0, 3));

    return combined;
  }, [regularSpeedData, trafficSpeedData]);

  // Memoize speed statistics
  const { avgSpeed, avgTrafficSpeed } = useMemo(() => {
    // Calculate speed stats for both routes
    const speeds = combinedData.map(d => d.speed).filter((s): s is number => s !== null && s > 0);
    const trafficSpeeds = combinedData.map(d => d.trafficSpeed).filter((s): s is number => s !== null && s > 0);
    
    const avgSpeedValue = speeds.length > 0 ? Math.round(speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length) : 0;
    const avgTrafficSpeedValue = trafficSpeeds.length > 0 ? Math.round(trafficSpeeds.reduce((sum, speed) => sum + speed, 0) / trafficSpeeds.length) : null;

    return {
      avgSpeed: avgSpeedValue,
      avgTrafficSpeed: avgTrafficSpeedValue
    };
  }, [combinedData]);

  return {
    regularSpeedData,
    trafficSpeedData,
    combinedData,
    avgSpeed,
    avgTrafficSpeed
  };
}