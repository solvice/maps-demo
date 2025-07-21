# Page snapshot

```yaml
- main:
  - heading "Solvice Maps" [level=1]
  - group:
    - radio "Car" [checked]
    - radio "Truck"
    - radio "Bike"
  - text: Origin
  - textbox "Enter origin": Brussels
  - text: "Brussels, Belgium Confidence: 100% Brussels, Belgium Confidence: 90% Lombardenstraat 8, 2000 Antwerpen, Belgium Confidence: 80% Destination"
  - textbox "Enter destination": Antwerp
  - text: "Antwerp, Belgium Confidence: 100% Antwerp, Belgium Confidence: 90% Antwerp, Belgium Confidence: 80% Click on the map to place markers or enter addresses above"
  - button
  - button
  - button
  - button
  - region "Map"
- region "Notifications alt+T"
- alert
```