# Page snapshot

```yaml
- main:
  - heading "Solvice Maps" [level=1]
  - group:
    - radio "Car" [checked]
    - radio "Truck"
    - radio "Bike"
  - text: Origin
  - textbox "Enter origin": Bru
  - text: "Brussels, Belgium Confidence: 100% Brussels, Belgium Confidence: 90% Bredabaan 536, 2170 Antwerpen, Belgium Confidence: 80% Destination"
  - textbox "Enter destination"
  - text: "Error: Address not found"
  - button
  - button
  - button
  - button
  - region "Map"
- region "Notifications alt+T":
  - list:
    - listitem:
      - img
      - text: "Address lookup failed: Address not found"
- alert
```