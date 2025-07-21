'use client';

import { DemoNavigation } from './demo-navigation';

export function DemoTitlePane() {
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 text-center">
      <DemoNavigation />
    </div>
  );
}