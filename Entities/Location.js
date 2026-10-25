{
  "name": "Location",
  "type": "object",
  "properties": {
    "zone_name": {
      "type": "string",
      "description": "Name of the zone"
    },
    "zone_type": {
      "type": "string",
      "enum": [
        "greenhouse",
        "animal_yard",
        "training_centre",
        "kids_zone",
        "shops",
        "entrance",
        "parking"
      ],
      "description": "Type of zone"
    },
    "description": {
      "type": "string",
      "description": "Zone description"
    },
    "map_x": {
      "type": "number",
      "description": "X coordinate on map (percentage)"
    },
    "map_y": {
      "type": "number",
      "description": "Y coordinate on map (percentage)"
    },
    "color": {
      "type": "string",
      "description": "Zone color for map display"
    }
  },
  "required": [
    "zone_name",
    "zone_type"
  ]
}