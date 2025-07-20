maps ui demo

i want to re-create the  maps demo that we have, but now in another tech stack. it needs to show of solvice maps functionality, such as routing and distance matrix calculation. at first we will focus on just routing. https://maps.solvice.io/

visual: @demo.jpg

features:
 - click two times on map to create two markers
 - then it connects to the solvice maps `/route` endpoint and displays the route on the map with the polygon


tech stack:
- react
- shadcn/ui
- tailwindcss
- typescript
- openapi spec from solvice maps: https://mapr-gateway-staging-181354976021.europe-west1.run.app/q/openapi.yaml
- docs from solvice maps: https://maps.solvice.io/llms-full.txt
- maplibre react for map visualization
- solvice map style:
```
var map = new maplibregl.Map({
container: "map",
hash: true,
center: [-122.4194, 37.7749],
zoom: 12,
style: 'https://cdn.solvice.io/styles/light.json',
});
```

check out the old code in @old-code directory for reference.
 this can be simplified a lot!!
