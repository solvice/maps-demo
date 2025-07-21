# Page snapshot

```yaml
- region "Map"
- link "/route":
  - /url: /route
- link "/table":
  - /url: /table
- button
- button
- button
- heading "Solvice Maps" [level=1]
- link "supported by TOMTOM":
  - /url: https://www.tomtom.com
- group:
  - radio "Car" [checked]
  - radio "Truck"
  - radio "Bike"
- text: Origin
- textbox "Origin": 3.659035131835026,51.06077375897266
- text: Destination
- textbox "Destination": 3.676201269530054,51.04998365782339
- text: "Error: Route calculation failed: Internal server error Traffic info unavailable"
- button "Share"
- button "JSON"
- button "Steps"
- region "Notifications alt+T"
- alert
```