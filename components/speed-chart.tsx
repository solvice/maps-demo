'use client';

import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { formatDistance } from '@/lib/format';
import { useMapContext } from '@/contexts/map-context';
import { CombinedDataPoint } from '@/hooks/use-speed-data';

export interface SpeedChartProps {
  combinedData: CombinedDataPoint[];
  chartConfig: ChartConfig;
  hasTrafficData?: boolean;
  onStepHover?: (stepGeometry: string | null, stepIndex: number | null) => void;
  getCoordinatesAtDistance: (targetDistance: number) => [number, number] | null;
}

export function SpeedChart({ 
  combinedData, 
  chartConfig, 
  hasTrafficData = false,
  onStepHover,
  getCoordinatesAtDistance
}: SpeedChartProps) {
  const map = useMapContext();

  if (combinedData.length === 0) {
    return null;
  }

  const handleMouseMove = (data: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (data && data.activePayload && data.activePayload[0]) {
      const payload = data.activePayload[0].payload;
      
      // Call step hover callback
      if (onStepHover) {
        onStepHover(payload.geometry || null, payload.stepIndex);
      }
      
      // FlyTo corresponding location on map
      if (map && map.isStyleLoaded()) {
        const coords = getCoordinatesAtDistance(payload.distance);
        if (coords) {
          map.flyTo({
            center: coords,
            zoom: Math.max(map.getZoom(), 14), // Don't zoom out, only zoom in if needed
            duration: 500, // Quick transition
            essential: false // Allow interruption
          });
        }
      }
    }
  };

  const handleMouseLeave = () => {
    if (onStepHover) {
      onStepHover(null, null);
    }
  };

  const renderTooltipContent = ({ active, payload, label }: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (active && payload && payload.length) {
      const numValue = Number(label);
      const distanceLabel = isNaN(numValue) ? '0 m' : formatDistance(numValue);
      
      // Get the data point from the first payload entry
      const dataPoint = payload[0]?.payload;
      const locationName = dataPoint?.locationName;
      const routeRef = dataPoint?.routeRef;
      const destinations = dataPoint?.destinations;
      
      // Build location display string
      const locationParts = [];
      if (locationName) locationParts.push(locationName);
      if (routeRef) locationParts.push(`(${routeRef})`);
      const locationDisplay = locationParts.join(' ');
      
      return (
        <div className="bg-background border rounded-lg shadow-lg p-2 max-w-xs">
          <p className="text-xs font-medium mb-1">{`Distance: ${distanceLabel}`}</p>
          
          {locationDisplay && (
            <div className="mb-2">
              <p className="text-xs font-medium truncate">{locationDisplay}</p>
              {destinations && (
                <p className="text-xs text-muted-foreground truncate">→ {destinations}</p>
              )}
            </div>
          )}
          
          <div className="space-y-1 mb-2">
            {payload.map((entry: any, index: number) => { // eslint-disable-line @typescript-eslint/no-explicit-any
              const speed = Number(entry.value);
              const roundedSpeed = isNaN(speed) ? 0 : Math.round(speed);
              const isTraffic = entry.dataKey === 'trafficSpeed';
              const color = isTraffic ? '#f97316' : '#3b82f6'; // Orange for traffic, blue for regular
              
              return (
                <div key={index} className="flex items-center gap-1 text-xs">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-muted-foreground">{isTraffic ? 'Traffic' : 'Speed'}:</span>
                  <span className="font-medium">{roundedSpeed} km/h</span>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ChartContainer config={chartConfig} className="h-36 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart 
          data={combinedData} 
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="fillSpeed" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-speed)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-speed)"
                stopOpacity={0.1}
              />
            </linearGradient>
            <linearGradient id="fillTrafficSpeed" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-trafficSpeed)"
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor="var(--color-trafficSpeed)"
                stopOpacity={0.1}
              />
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="distance"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => formatDistance(value)}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => `${Math.round(value)} km/h`}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <ChartTooltip
            position={{ x: undefined, y: -25 }}
            content={renderTooltipContent}
          />
          <Area
            type="monotone"
            dataKey="speed"
            stroke="var(--color-speed)"
            strokeWidth={2}
            fill="url(#fillSpeed)"
            connectNulls={false}
          />
          {hasTrafficData && (
            <Area
              type="monotone"
              dataKey="trafficSpeed"
              stroke="var(--color-trafficSpeed)"
              strokeWidth={2}
              fill="url(#fillTrafficSpeed)"
              connectNulls={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}