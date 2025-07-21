"use client";

interface TrafficImpactLegendProps {
  maxTrafficImpact: number;
  show: boolean;
}

export function TrafficImpactLegend({ 
  maxTrafficImpact, 
  show 
}: TrafficImpactLegendProps) {
  
  if (!show) return null;

  // Generate gradient stops for the legend using dynamic max impact
  const gradientStops = [];
  
  for (let i = 0; i <= 10; i++) {
    const t = i / 10; // 0 to 1
    
    // Interpolate from blue to red
    const blue = { r: 59, g: 130, b: 246 };
    const red = { r: 239, g: 68, b: 68 };
    
    const r = Math.round(blue.r + (red.r - blue.r) * t);
    const g = Math.round(blue.g + (red.g - blue.g) * t);
    const b = Math.round(blue.b + (red.b - blue.b) * t);
    
    gradientStops.push(`rgb(${r}, ${g}, ${b}) ${i * 10}%`);
  }

  const gradientStyle = `linear-gradient(to right, ${gradientStops.join(', ')})`;
  const maxImpactPercent = Math.round(maxTrafficImpact * 100);

  return (
    <div className="absolute bottom-4 left-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border p-3 text-xs">
      <div className="mb-2 font-semibold text-gray-700">Traffic Impact</div>
      
      {/* Gradient bar */}
      <div className="flex flex-col gap-1 mb-2">
        <div 
          className="h-4 w-32 rounded border"
          style={{ background: gradientStyle }}
        />
        
        {/* Labels */}
        <div className="flex justify-between text-[10px] text-gray-600">
          <span>100%</span>
          <span>{maxImpactPercent}%</span>
        </div>
      </div>
      
      {/* Legend explanation */}
      <div className="text-[9px] text-gray-400 mt-1 leading-tight">
        Blue = No traffic delay<br/>
        Red = {Math.round((maxTrafficImpact - 1.0) * 100)}% longer duration
      </div>
    </div>
  );
}