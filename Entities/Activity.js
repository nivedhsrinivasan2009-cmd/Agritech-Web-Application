{
  "name": "Activity",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Activity name"
    },
    "description": {
      "type": "string",
      "description": "Activity description"
    },
    "typical_time": {
      "type": "string",
      "description": "Typical time when activity is available"
    },
    "location_id": {
      "type": "string",
      "description": "Associated location/zone ID"
    },
    "type": {
      "type": "string",
      "enum": [
        "farm_walk",
        "kids_zone",
        "feeding",
        "workshop",
        "exploration"
      ],
      "description": "Type of activity"
    },
    "icon": {
      "type": "string",
      "description": "Icon name for the activity"
    },
    "image_url": {
      "type": "string",
      "description": "Activity image URL"
    }
  },
  "required": [
    "name",
    "type"
  ]
}